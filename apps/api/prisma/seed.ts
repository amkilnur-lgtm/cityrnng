import { PrismaClient } from "@prisma/client";

const ROLES: ReadonlyArray<{ code: string; name: string }> = [
  { code: "runner", name: "Runner" },
  { code: "admin", name: "Admin" },
  { code: "partner", name: "Partner" },
];

async function seed(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const role of ROLES) {
      await tx.role.upsert({
        where: { code: role.code },
        update: { name: role.name },
        create: role,
      });
    }
  });
  console.log(`[seed] roles ensured: ${ROLES.map((r) => r.code).join(", ")}`);

  const rawAdminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!rawAdminEmail || rawAdminEmail.trim().length === 0) return;

  const adminEmail = rawAdminEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    console.warn(
      `[seed] SEED_ADMIN_EMAIL=${adminEmail} has no matching user; skipping admin promotion. ` +
        `Log in with this email via the magic-link flow first, then re-run the seed.`,
    );
    return;
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "admin" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });
  console.log(`[seed] promoted ${adminEmail} to admin`);
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
