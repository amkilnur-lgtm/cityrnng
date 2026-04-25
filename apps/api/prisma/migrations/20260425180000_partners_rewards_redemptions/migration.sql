-- AlterEnum: add reward_redemption to PointReasonType
ALTER TYPE "PointReasonType" ADD VALUE 'reward_redemption';

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('active', 'archived');
CREATE TYPE "RewardStatus" AS ENUM ('active', 'archived');
CREATE TYPE "RedemptionStatus" AS ENUM ('active', 'used', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contact_email" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'active',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");
CREATE INDEX "partners_status_idx" ON "partners"("status");

-- CreateTable
CREATE TABLE "rewards" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "partner_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cost_points" INTEGER NOT NULL,
    "badge" TEXT,
    "status" "RewardStatus" NOT NULL DEFAULT 'active',
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "capacity" INTEGER,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rewards_slug_key" ON "rewards"("slug");
CREATE INDEX "rewards_partner_id_idx" ON "rewards"("partner_id");
CREATE INDEX "rewards_status_idx" ON "rewards"("status");

-- CreateTable
CREATE TABLE "redemptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reward_id" UUID NOT NULL,
    "cost_points" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'active',
    "code" TEXT NOT NULL,
    "point_txn_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3),
    "used_at" TIMESTAMP(3),
    "used_by_id" UUID,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redemptions_code_key" ON "redemptions"("code");
CREATE UNIQUE INDEX "redemptions_point_txn_id_key" ON "redemptions"("point_txn_id");
CREATE INDEX "redemptions_user_id_created_at_idx" ON "redemptions"("user_id", "created_at" DESC);
CREATE INDEX "redemptions_reward_id_status_idx" ON "redemptions"("reward_id", "status");
CREATE INDEX "redemptions_status_expires_at_idx" ON "redemptions"("status", "expires_at");

-- AddForeignKey
ALTER TABLE "partners"
  ADD CONSTRAINT "partners_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rewards"
  ADD CONSTRAINT "rewards_partner_id_fkey"
  FOREIGN KEY ("partner_id") REFERENCES "partners"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rewards"
  ADD CONSTRAINT "rewards_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "redemptions"
  ADD CONSTRAINT "redemptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "redemptions"
  ADD CONSTRAINT "redemptions_reward_id_fkey"
  FOREIGN KEY ("reward_id") REFERENCES "rewards"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "redemptions"
  ADD CONSTRAINT "redemptions_point_txn_id_fkey"
  FOREIGN KEY ("point_txn_id") REFERENCES "point_transactions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
