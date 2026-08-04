-- Leader role (manual QR scan when no fixed device is present)
INSERT INTO "roles" ("id", "code", "name")
VALUES (gen_random_uuid(), 'leader', 'Leader')
ON CONFLICT ("code") DO NOTHING;

-- CheckinScan: allow manual leader scans without a device.
-- device_id / scan_id become nullable; scanned_by_user_id records the leader.
ALTER TABLE "checkin_scans" ALTER COLUMN "device_id" DROP NOT NULL;
ALTER TABLE "checkin_scans" ALTER COLUMN "scan_id" DROP NOT NULL;
ALTER TABLE "checkin_scans" ADD COLUMN "scanned_by_user_id" UUID;

-- FK for the leader audit pointer (SetNull so deleting a leader keeps the log).
ALTER TABLE "checkin_scans"
  ADD CONSTRAINT "checkin_scans_scanned_by_user_id_fkey"
  FOREIGN KEY ("scanned_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
