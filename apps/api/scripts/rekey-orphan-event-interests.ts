/**
 * One-off cleanup: EventInterest rows whose `eventKey` is the UUID of an
 * override Event (i.e. an Event with `recurrenceRuleId` + `overridesOccurrenceAt`)
 * are rewritten to use the canonical rule-key `rule:<ruleId>:<YYYY-MM-DD>`.
 *
 * This is a fallout from the bug fixed by this PR: lists and detail used
 * to emit override.UUID as the public id for materialized occurrences, so
 * any RSVP made through those broken surfaces persisted under the wrong
 * key. After the fix, lists/detail emit the rule-key everywhere, so we
 * back-fill existing data to match.
 *
 * Idempotent — re-running on a clean DB is a no-op.
 *
 * Dry run by default. Pass `--apply` to actually mutate the database.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`\n=== Rekey orphan EventInterests (${apply ? "APPLY" : "DRY RUN"}) ===\n`);

  // All interests whose eventKey is a UUID — candidates for rekey.
  const candidates = await prisma.eventInterest.findMany();
  const uuidKeyed = candidates.filter((c) => UUID_RE.test(c.eventKey));
  if (uuidKeyed.length === 0) {
    console.log("No UUID-keyed EventInterest rows. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  // Resolve UUIDs to override Events (with rule + occurrence date).
  const eventIds = [...new Set(uuidKeyed.map((c) => c.eventKey))];
  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    select: { id: true, recurrenceRuleId: true, overridesOccurrenceAt: true },
  });
  const overrideById = new Map(
    events
      .filter((e) => e.recurrenceRuleId && e.overridesOccurrenceAt)
      .map((e) => [e.id, { ruleId: e.recurrenceRuleId!, day: e.overridesOccurrenceAt! }]),
  );

  const orphans = uuidKeyed.filter((c) => overrideById.has(c.eventKey));
  if (orphans.length === 0) {
    console.log("No orphan EventInterests pointing at override Events. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${orphans.length} orphan EventInterest(s) to rekey.\n`);

  let rekeyed = 0;
  let deletedOnConflict = 0;

  for (const row of orphans) {
    const meta = overrideById.get(row.eventKey)!;
    const dateKey = meta.day.toISOString().slice(0, 10);
    const ruleKey = `rule:${meta.ruleId}:${dateKey}`;

    console.log(
      `  user=${row.userId} ${row.eventKey} → ${ruleKey} (status=${row.status})`,
    );

    if (!apply) continue;

    // Check for collision: if (user, ruleKey) already exists, drop the
    // UUID-keyed duplicate. Prefer the existing rule-keyed row as the
    // canonical record (it was created against the post-fix code path).
    const existing = await prisma.eventInterest.findUnique({
      where: { userId_eventKey: { userId: row.userId, eventKey: ruleKey } },
    });
    if (existing) {
      await prisma.eventInterest.delete({ where: { id: row.id } });
      deletedOnConflict++;
      console.log(`    ↳ collision; kept existing rule-keyed row, dropped UUID-keyed.`);
      continue;
    }
    await prisma.eventInterest.update({
      where: { id: row.id },
      data: { eventKey: ruleKey },
    });
    rekeyed++;
  }

  console.log(
    `\nDone. ${apply ? `Rekeyed ${rekeyed}, deleted ${deletedOnConflict} duplicates.` : "Dry run — re-run with --apply to mutate."}\n`,
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
