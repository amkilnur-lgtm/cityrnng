-- CreateEnum
CREATE TYPE "RewardFulfillmentType" AS ENUM ('verify', 'promo_pool');
CREATE TYPE "PromoCodeStatus" AS ENUM ('available', 'assigned');

-- AlterTable: rewards gain a fulfillment type. Default 'verify' preserves the
-- existing behavior (our code + partner verification) for all current rewards.
ALTER TABLE "rewards" ADD COLUMN "fulfillment_type" "RewardFulfillmentType" NOT NULL DEFAULT 'verify';

-- CreateTable: partner promo-code pool for promo_pool rewards.
CREATE TABLE "promo_codes" (
    "id" UUID NOT NULL,
    "reward_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "PromoCodeStatus" NOT NULL DEFAULT 'available',
    "redemption_id" UUID,
    "assigned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_redemption_id_key" ON "promo_codes"("redemption_id");
CREATE UNIQUE INDEX "promo_codes_reward_id_code_key" ON "promo_codes"("reward_id", "code");
CREATE INDEX "promo_codes_reward_id_status_idx" ON "promo_codes"("reward_id", "status");

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "redemptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
