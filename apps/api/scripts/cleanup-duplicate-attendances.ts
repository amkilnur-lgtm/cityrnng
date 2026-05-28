/**
 * Find users with >1 EventAttendance on the same calendar date and keep
 * only the "winner" — special > partner > regular, then earliest matchedAt
 * on tie. Losing attendances are deleted and their credited points are
 * reversed with a `reversal` PointTransaction.
 *
 * Idempotent: re-running on a clean DB is a no-op. Safe to wire into
 * deploys (we do — see deploy-staging.yml).
 *
 * Dry run by default. Pass `--apply` to actually mutate the database.
 *
 *   pnpm --filter @cityrnng/api ts-script scripts/cleanup-duplicate-attendances.ts
 *   pnpm --filter @cityrnng/api ts-script scripts/cleanup-duplicate-attendances.ts --apply
 */

import { PrismaClient, EventType } from "@prisma/client";

const prisma = new PrismaClient();
const TYPE_ORDER: Record<EventType, number> = {
  [EventType.special]: 0,
  [EventType.partner]: 1,
  [EventType.regular]: 2,
};

type DuplicateGroup = {
  userId: string;
  dateKey: string;
  attendances: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    eventType: EventType;
    startsAt: Date;
    matchedAt: Date | null;
    points: number;
  }>;
};

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`\n=== Cleanup duplicate EventAttendances (${apply ? "APPLY" : "DRY RUN"}) ===\n`);

  const all = await prisma.eventAttendance.findMany({
    include: {
      event: {
        select: { id: true, title: true, type: true, startsAt: true },
      },
    },
  });

  // Group by (userId, calendar day in UTC).
  const groups = new Map<string, DuplicateGroup>();
  for (const a of all) {
    const dateKey = a.event.startsAt.toISOString().slice(0, 10);
    const key = `${a.userId}|${dateKey}`;
    let g = groups.get(key);
    if (!g) {
      g = { userId: a.userId, dateKey, attendances: [] };
      groups.set(key, g);
    }
    // Lookup credited points for this attendance (sum of credit txns).
    const pts = await prisma.pointTransaction.aggregate({
      where: { reasonRef: a.id, direction: "credit" },
      _sum: { amount: true },
    });
    g.attendances.push({
      id: a.id,
      eventId: a.eventId,
      eventTitle: a.event.title,
      eventType: a.event.type,
      startsAt: a.event.startsAt,
      matchedAt: a.matchedAt,
      points: pts._sum.amount ?? 0,
    });
  }

  const dupes = [...groups.values()].filter((g) => g.attendances.length > 1);
  if (dupes.length === 0) {
    console.log("No duplicate attendances found. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${dupes.length} duplicate group(s).\n`);

  for (const group of dupes) {
    // Sort: type priority first, then earliest matched (the one credited
    // first is the "real" run that triggered everything).
    const sorted = [...group.attendances].sort((a, b) => {
      const t = TYPE_ORDER[a.eventType] - TYPE_ORDER[b.eventType];
      if (t !== 0) return t;
      const am = a.matchedAt?.getTime() ?? 0;
      const bm = b.matchedAt?.getTime() ?? 0;
      return am - bm;
    });
    const [winner, ...losers] = sorted;

    console.log(`---- user=${group.userId} date=${group.dateKey} ----`);
    console.log(`  WINNER: ${winner!.eventType} "${winner!.eventTitle}" id=${winner!.id} points=${winner!.points}`);
    for (const loser of losers) {
      console.log(`  LOSER : ${loser.eventType} "${loser.eventTitle}" id=${loser.id} points=${loser.points} (will reverse + delete)`);
    }
    console.log();

    if (!apply) continue;

    for (const loser of losers) {
      await prisma.$transaction(async (tx) => {
        if (loser.points > 0) {
          // Reversal transaction — debit the same amount with a dedicated
          // reason. Idempotent via the reverse-key naming.
          const account = await tx.pointAccount.upsert({
            where: { userId: group.userId },
            create: { userId: group.userId },
            update: {},
          });
          const newBalance = account.balance - loser.points;
          await tx.pointAccount.update({
            where: { id: account.id },
            data: { balance: newBalance },
          });
          await tx.pointTransaction.create({
            data: {
              accountId: account.id,
              userId: group.userId,
              direction: "debit",
              amount: loser.points,
              balanceAfter: newBalance,
              reasonType: "reversal",
              reasonRef: loser.id,
              idempotencyKey: `dedup-reversal:${loser.id}`,
              comment: `Reversal: duplicate attendance on ${group.dateKey} (winner was ${winner!.eventType} "${winner!.eventTitle}")`,
              createdByType: "system",
              createdById: null,
            },
          });
        }
        await tx.eventAttendance.delete({ where: { id: loser.id } });
      });
      console.log(`  ✓ deleted attendance ${loser.id}, reversed ${loser.points} pts`);
    }
  }

  console.log(`\nDone. ${apply ? "Applied." : "Dry run — re-run with --apply to mutate."}\n`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
