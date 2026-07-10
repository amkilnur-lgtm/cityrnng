-- Strava is gone: attendance is QR-based now. Historic EventAttendance rows
-- with source='sync' stay (enum value kept); their activity payloads and the
-- provider accounts are dropped with the tables below.

-- Detach attendances from activities first (FK), then drop child before parent.
ALTER TABLE "event_attendances" DROP CONSTRAINT "event_attendances_external_activity_id_fkey";
ALTER TABLE "event_attendances" DROP COLUMN "external_activity_id";

DROP TABLE "external_activities";
DROP TABLE "user_provider_accounts";
