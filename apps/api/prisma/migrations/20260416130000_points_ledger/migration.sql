-- CreateEnum
CREATE TYPE "PointAccountStatus" AS ENUM ('active', 'blocked');

-- CreateEnum
CREATE TYPE "PointDirection" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "PointTransactionStatus" AS ENUM ('posted', 'reversed');

-- CreateEnum
CREATE TYPE "PointActorType" AS ENUM ('system', 'admin');

-- CreateEnum
CREATE TYPE "PointReasonType" AS ENUM (
    'signup_bonus',
    'event_attendance_regular',
    'event_attendance_special',
    'event_attendance_partner',
    'manual_adjustment',
    'first_run_bonus',
    'streak_bonus',
    'milestone_bonus',
    'returning_user_bonus',
    'campaign_bonus',
    'partner_bonus',
    'reversal'
);

-- CreateTable
CREATE TABLE "point_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "PointAccountStatus" NOT NULL DEFAULT 'active',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_transactions" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "direction" "PointDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "status" "PointTransactionStatus" NOT NULL DEFAULT 'posted',
    "reason_type" "PointReasonType" NOT NULL,
    "reason_ref" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "comment" TEXT,
    "created_by_type" "PointActorType" NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "point_accounts_user_id_key" ON "point_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "point_transactions_idempotency_key_key" ON "point_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "point_transactions_user_id_created_at_id_idx" ON "point_transactions"("user_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "point_transactions_account_id_created_at_id_idx" ON "point_transactions"("account_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "point_transactions_reason_type_idx" ON "point_transactions"("reason_type");

-- AddForeignKey
ALTER TABLE "point_accounts" ADD CONSTRAINT "point_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "point_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
