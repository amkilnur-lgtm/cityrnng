-- CreateEnum
CREATE TYPE "RecurrenceRuleStatus" AS ENUM ('active', 'paused');

-- AlterTable
ALTER TABLE "events"
  ADD COLUMN "recurrence_rule_id" UUID,
  ADD COLUMN "overrides_occurrence_at" DATE;

-- CreateTable
CREATE TABLE "event_recurrence_rules" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL DEFAULT 'regular',
    "status" "RecurrenceRuleStatus" NOT NULL DEFAULT 'active',
    "day_of_week" INTEGER NOT NULL,
    "time_of_day" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_points_eligible" BOOLEAN NOT NULL DEFAULT true,
    "base_points_award" INTEGER NOT NULL DEFAULT 0,
    "starts_from_date" DATE NOT NULL,
    "ends_at_date" DATE,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_recurrence_rule_locations" (
    "rule_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_recurrence_rule_locations_pkey" PRIMARY KEY ("rule_id", "location_id")
);

-- CreateIndex
CREATE INDEX "event_recurrence_rules_status_day_of_week_idx" ON "event_recurrence_rules"("status", "day_of_week");

-- CreateIndex (override uniqueness — one override Event per rule per date)
CREATE UNIQUE INDEX "uq_event_overrides_per_rule_date" ON "events"("recurrence_rule_id", "overrides_occurrence_at");

-- AddForeignKey
ALTER TABLE "events"
  ADD CONSTRAINT "events_recurrence_rule_id_fkey"
  FOREIGN KEY ("recurrence_rule_id") REFERENCES "event_recurrence_rules"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recurrence_rules"
  ADD CONSTRAINT "event_recurrence_rules_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recurrence_rule_locations"
  ADD CONSTRAINT "event_recurrence_rule_locations_rule_id_fkey"
  FOREIGN KEY ("rule_id") REFERENCES "event_recurrence_rules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recurrence_rule_locations"
  ADD CONSTRAINT "event_recurrence_rule_locations_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "city_locations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
