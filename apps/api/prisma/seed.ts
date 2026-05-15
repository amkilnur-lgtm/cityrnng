import {
  EventType,
  PartnerStatus,
  PrismaClient,
  RecurrenceRuleStatus,
  RewardStatus,
  type Prisma,
} from "@prisma/client";

const ROLES: ReadonlyArray<{ code: string; name: string }> = [
  { code: "runner", name: "Runner" },
  { code: "admin", name: "Admin" },
  { code: "partner", name: "Partner" },
];

/**
 * Уфа start points — mirror apps/web/src/lib/home-mock.ts LOCATIONS.
 * Coordinates point to the partner-cafe at the start of each route.
 */
const LOCATIONS: ReadonlyArray<{
  slug: string;
  name: string;
  city: string;
  venue: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}> = [
  {
    slug: "centr",
    name: "Центр",
    city: "Уфа",
    venue: "Monkey Grinder",
    address: "ул. Карла Маркса, 41",
    lat: 54.7299,
    lng: 55.9474,
    radiusMeters: 500,
  },
  {
    slug: "prospekt",
    name: "Проспект",
    city: "Уфа",
    venue: "Monkey Grinder",
    address: "Проспект Октября, 63А",
    lat: 54.7531,
    lng: 56.0017,
    radiusMeters: 500,
  },
  {
    slug: "chernikovka",
    name: "Черниковка",
    city: "Уфа",
    venue: "Surf Coffee",
    address: "ул. Первомайская, 22",
    lat: 54.8217,
    lng: 56.0436,
    radiusMeters: 500,
  },
];

const PARTNERS: ReadonlyArray<{
  slug: string;
  name: string;
  description: string;
  contactEmail: string | null;
}> = [
  {
    slug: "monkey-grinder",
    name: "Monkey Grinder",
    description:
      "Кофейня в&nbsp;Центре и&nbsp;на&nbsp;Проспекте — точки старта двух пробежек",
    contactEmail: null,
  },
  {
    slug: "surf-coffee",
    name: "Surf Coffee",
    description:
      "Кофейня в&nbsp;Черниковке — точка старта пробежки",
    contactEmail: null,
  },
];

const REWARDS: ReadonlyArray<{
  slug: string;
  partnerSlug: string;
  title: string;
  description: string;
  costPoints: number;
  badge?: string;
}> = [
  {
    slug: "mg-cappuccino",
    partnerSlug: "monkey-grinder",
    title: "Капучино",
    description: "200 мл, на любом молоке. Любая точка Monkey Grinder.",
    costPoints: 120,
  },
  {
    slug: "mg-croissant",
    partnerSlug: "monkey-grinder",
    title: "Круассан с миндалём",
    description: "Свежий, утром свежевыпеченный. Идёт с кофе.",
    costPoints: 180,
  },
  {
    slug: "mg-raf",
    partnerSlug: "monkey-grinder",
    title: "Раф ванильный",
    description: "Любимый напиток зимы. 300 мл.",
    costPoints: 160,
  },
  {
    slug: "mg-espresso",
    partnerSlug: "monkey-grinder",
    title: "Двойной эспрессо",
    description: "Ристретто или классика — на выбор.",
    costPoints: 80,
  },
  {
    slug: "sc-flat-white",
    partnerSlug: "surf-coffee",
    title: "Флэт уайт",
    description: "200 мл. Surf-blend, фирменная обжарка.",
    costPoints: 140,
  },
  {
    slug: "sc-matcha",
    partnerSlug: "surf-coffee",
    title: "Матча-латте",
    description: "Премиум матча из Удзи. На любом молоке.",
    costPoints: 120,
    badge: "до 31 мая",
  },
  {
    slug: "sc-cheesecake",
    partnerSlug: "surf-coffee",
    title: "Чизкейк Нью-Йорк",
    description: "Классический, в кофейню привозят утром.",
    costPoints: 220,
  },
  {
    slug: "sc-sandwich",
    partnerSlug: "surf-coffee",
    title: "Сэндвич с тунцом",
    description: "На цельнозерновом, идеально после 10 км.",
    costPoints: 260,
  },
];

/** Default recurring run — Wednesday 19:30, all three Уфа start points. */
const DEFAULT_RECURRENCE = {
  title: "Пробежка Ситираннинг",
  type: EventType.regular,
  status: RecurrenceRuleStatus.active,
  dayOfWeek: 3,
  timeOfDay: "19:30",
  durationMinutes: 75,
  isPointsEligible: true,
  basePointsAward: 30,
  startsFromDate: new Date("2026-01-01"),
};

async function ensureRoles(tx: Prisma.TransactionClient) {
  for (const role of ROLES) {
    await tx.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    });
  }
}

async function ensureLocations(tx: Prisma.TransactionClient) {
  for (const loc of LOCATIONS) {
    await tx.cityLocation.upsert({
      where: { slug: loc.slug },
      update: {
        name: loc.name,
        city: loc.city,
        venue: loc.venue,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        radiusMeters: loc.radiusMeters,
      },
      create: loc,
    });
  }
}

async function ensurePartnersAndRewards(
  tx: Prisma.TransactionClient,
  createdById: string,
) {
  for (const p of PARTNERS) {
    await tx.partner.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        contactEmail: p.contactEmail,
        status: PartnerStatus.active,
      },
      create: { ...p, status: PartnerStatus.active, createdById },
    });
  }

  for (const r of REWARDS) {
    const partner = await tx.partner.findUniqueOrThrow({
      where: { slug: r.partnerSlug },
    });
    await tx.reward.upsert({
      where: { slug: r.slug },
      update: {
        partnerId: partner.id,
        title: r.title,
        description: r.description,
        costPoints: r.costPoints,
        badge: r.badge ?? null,
        status: RewardStatus.active,
      },
      create: {
        slug: r.slug,
        partnerId: partner.id,
        title: r.title,
        description: r.description,
        costPoints: r.costPoints,
        badge: r.badge ?? null,
        status: RewardStatus.active,
        createdById,
      },
    });
  }
}

/**
 * Optional: link a partner-role user to the first PARTNERS entry, creating
 * the user as pending if needed. Triggered by SEED_PARTNER_EMAIL — purely
 * a dev convenience so /partner can be exercised without manual admin
 * setup.
 */
async function ensureSeedPartnerMember(
  prisma: PrismaClient,
  addedById: string,
): Promise<void> {
  const raw = process.env.SEED_PARTNER_EMAIL;
  if (!raw || raw.trim().length === 0) return;

  const email = raw.trim().toLowerCase();
  const partnerSlug = PARTNERS[0]?.slug;
  if (!partnerSlug) return;

  await prisma.$transaction(async (tx) => {
    const runnerRole = await tx.role.upsert({
      where: { code: "runner" },
      update: {},
      create: { code: "runner", name: "Runner" },
    });
    const partnerRole = await tx.role.upsert({
      where: { code: "partner" },
      update: {},
      create: { code: "partner", name: "Partner" },
    });

    const existing = await tx.user.findUnique({ where: { email } });
    const user = existing
      ? existing
      : await tx.user.create({ data: { email, status: "pending" } });

    await tx.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, displayName: email.split("@")[0] || "partner" },
    });

    await tx.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: runnerRole.id } },
      update: {},
      create: { userId: user.id, roleId: runnerRole.id },
    });
    await tx.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: partnerRole.id } },
      update: {},
      create: { userId: user.id, roleId: partnerRole.id },
    });

    const partner = await tx.partner.findUniqueOrThrow({
      where: { slug: partnerSlug },
    });
    await tx.partnerMember.upsert({
      where: {
        partnerId_userId: { partnerId: partner.id, userId: user.id },
      },
      update: {},
      create: {
        partnerId: partner.id,
        userId: user.id,
        createdById: addedById,
      },
    });
  });

  console.log(
    `[seed] linked ${email} as partner-member of ${partnerSlug} (status=pending until first magic-link login).`,
  );
}

async function ensureDefaultRecurrence(
  tx: Prisma.TransactionClient,
  createdById: string,
) {
  // No natural unique key on rules, so fingerprint by (title, dayOfWeek, timeOfDay).
  const existing = await tx.eventRecurrenceRule.findFirst({
    where: {
      title: DEFAULT_RECURRENCE.title,
      dayOfWeek: DEFAULT_RECURRENCE.dayOfWeek,
      timeOfDay: DEFAULT_RECURRENCE.timeOfDay,
    },
  });

  const rule = existing
    ? await tx.eventRecurrenceRule.update({
        where: { id: existing.id },
        data: { ...DEFAULT_RECURRENCE },
      })
    : await tx.eventRecurrenceRule.create({
        data: { ...DEFAULT_RECURRENCE, createdById },
      });

  // Attach all three Уфа locations (idempotent — composite PK).
  for (const loc of LOCATIONS) {
    const location = await tx.cityLocation.findUniqueOrThrow({
      where: { slug: loc.slug },
    });
    await tx.eventRecurrenceRuleLocation.upsert({
      where: {
        ruleId_locationId: { ruleId: rule.id, locationId: location.id },
      },
      update: {},
      create: { ruleId: rule.id, locationId: location.id },
    });
  }
}

async function seed(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await ensureRoles(tx);
    await ensureLocations(tx);
  });
  console.log(`[seed] roles ensured: ${ROLES.map((r) => r.code).join(", ")}`);
  console.log(
    `[seed] locations ensured: ${LOCATIONS.map((l) => l.slug).join(", ")}`,
  );

  const rawAdminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!rawAdminEmail || rawAdminEmail.trim().length === 0) {
    console.log(
      "[seed] SEED_ADMIN_EMAIL not set — skipping admin promotion + partners/rewards/recurrence-rule. " +
        "Run `pnpm prisma db seed` again with SEED_ADMIN_EMAIL set after the admin signs in once.",
    );
    return;
  }

  const adminEmail = rawAdminEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    console.warn(
      `[seed] SEED_ADMIN_EMAIL=${adminEmail} has no matching user; skipping admin promotion + content seed. ` +
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

  await prisma.$transaction(async (tx) => {
    await ensurePartnersAndRewards(tx, user.id);
    await ensureDefaultRecurrence(tx, user.id);
  });
  console.log(
    `[seed] partners ensured: ${PARTNERS.map((p) => p.slug).join(", ")}`,
  );
  console.log(`[seed] rewards ensured: ${REWARDS.length} items`);
  console.log(
    `[seed] default recurrence rule ensured (${DEFAULT_RECURRENCE.title}, day=${DEFAULT_RECURRENCE.dayOfWeek}, ${DEFAULT_RECURRENCE.timeOfDay})`,
  );

  await ensureSeedPartnerMember(prisma, user.id);
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
