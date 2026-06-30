-- AlterEnum: QR scans are a new attendance source alongside Strava sync / manual
ALTER TYPE "AttendanceSource" ADD VALUE 'qr_scan';

-- CreateEnum
CREATE TYPE "ScanDeviceStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "CheckinScanResult" AS ENUM ('matched', 'duplicate', 'no_window', 'unknown_code', 'error');

-- AlterTable: personal static check-in code printed on the runner's QR / fob
ALTER TABLE "users" ADD COLUMN "checkin_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_checkin_code_key" ON "users"("checkin_code");

-- CreateTable
CREATE TABLE "scan_devices" (
    "id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "status" "ScanDeviceStatus" NOT NULL DEFAULT 'active',
    "last_seen_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scan_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scan_devices_api_key_hash_key" ON "scan_devices"("api_key_hash");

-- CreateIndex
CREATE INDEX "scan_devices_location_id_idx" ON "scan_devices"("location_id");

-- CreateTable
CREATE TABLE "checkin_scans" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "scan_id" TEXT NOT NULL,
    "checkin_code" TEXT NOT NULL,
    "user_id" UUID,
    "event_id" UUID,
    "attendance_id" UUID,
    "result" "CheckinScanResult" NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkin_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkin_scans_attendance_id_key" ON "checkin_scans"("attendance_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkin_scans_device_id_scan_id_key" ON "checkin_scans"("device_id", "scan_id");

-- CreateIndex
CREATE INDEX "checkin_scans_location_id_scanned_at_idx" ON "checkin_scans"("location_id", "scanned_at");

-- CreateIndex
CREATE INDEX "checkin_scans_user_id_idx" ON "checkin_scans"("user_id");

-- AddForeignKey
ALTER TABLE "scan_devices" ADD CONSTRAINT "scan_devices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "city_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_devices" ADD CONSTRAINT "scan_devices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_scans" ADD CONSTRAINT "checkin_scans_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scan_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_scans" ADD CONSTRAINT "checkin_scans_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "city_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_scans" ADD CONSTRAINT "checkin_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_scans" ADD CONSTRAINT "checkin_scans_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_scans" ADD CONSTRAINT "checkin_scans_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "event_attendances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
