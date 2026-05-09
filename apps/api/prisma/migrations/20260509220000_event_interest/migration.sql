-- CreateEnum
CREATE TYPE "EventInterestStatus" AS ENUM ('going', 'cancelled');

-- CreateTable
CREATE TABLE "event_interests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_key" TEXT NOT NULL,
    "location_id" UUID NOT NULL,
    "status" "EventInterestStatus" NOT NULL DEFAULT 'going',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "event_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_event_interest" ON "event_interests"("user_id", "event_key");

-- CreateIndex
CREATE INDEX "event_interests_event_key_idx" ON "event_interests"("event_key");

-- AddForeignKey
ALTER TABLE "event_interests" ADD CONSTRAINT "event_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_interests" ADD CONSTRAINT "event_interests_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "city_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
