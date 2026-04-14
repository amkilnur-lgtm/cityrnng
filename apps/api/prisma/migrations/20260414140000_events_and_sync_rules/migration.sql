-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('regular', 'special', 'partner');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'started', 'finished', 'cancelled');

-- CreateEnum
CREATE TYPE "SyncProvider" AS ENUM ('strava');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('sync', 'manual_admin');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'regular',
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "location_name" TEXT,
    "location_address" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "capacity" INTEGER,
    "registration_open_at" TIMESTAMP(3),
    "registration_close_at" TIMESTAMP(3),
    "is_points_eligible" BOOLEAN NOT NULL DEFAULT false,
    "base_points_award" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sync_rules" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "provider" "SyncProvider" NOT NULL DEFAULT 'strava',
    "activity_type" TEXT,
    "min_distance_meters" INTEGER,
    "max_distance_meters" INTEGER,
    "min_duration_seconds" INTEGER,
    "max_duration_seconds" INTEGER,
    "window_starts_at" TIMESTAMP(3) NOT NULL,
    "window_ends_at" TIMESTAMP(3) NOT NULL,
    "geofence_lat" DOUBLE PRECISION,
    "geofence_lng" DOUBLE PRECISION,
    "geofence_radius_meters" INTEGER,
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sync_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_provider_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "SyncProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "access_token_encrypted" TEXT,
    "refresh_token_encrypted" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),

    CONSTRAINT "user_provider_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_activities" (
    "id" UUID NOT NULL,
    "user_provider_account_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "SyncProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "activity_type" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "elapsed_seconds" INTEGER NOT NULL,
    "distance_meters" INTEGER NOT NULL,
    "start_lat" DOUBLE PRECISION,
    "start_lng" DOUBLE PRECISION,
    "end_lat" DOUBLE PRECISION,
    "end_lng" DOUBLE PRECISION,
    "payload_json" JSONB NOT NULL,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendances" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "external_activity_id" UUID,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'pending',
    "source" "AttendanceSource" NOT NULL,
    "matched_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_status_starts_at_idx" ON "events"("status", "starts_at");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE UNIQUE INDEX "event_sync_rules_event_id_key" ON "event_sync_rules"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_provider_accounts_user_id_provider_key" ON "user_provider_accounts"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_provider_accounts_provider_provider_user_id_key" ON "user_provider_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_activities_provider_external_id_key" ON "external_activities"("provider", "external_id");

-- CreateIndex
CREATE INDEX "external_activities_user_id_started_at_idx" ON "external_activities"("user_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendances_event_id_user_id_key" ON "event_attendances"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "event_attendances_event_id_status_idx" ON "event_attendances"("event_id", "status");

-- CreateIndex
CREATE INDEX "event_attendances_user_id_idx" ON "event_attendances"("user_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sync_rules" ADD CONSTRAINT "event_sync_rules_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_provider_accounts" ADD CONSTRAINT "user_provider_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_activities" ADD CONSTRAINT "external_activities_user_provider_account_id_fkey" FOREIGN KEY ("user_provider_account_id") REFERENCES "user_provider_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_activities" ADD CONSTRAINT "external_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_external_activity_id_fkey" FOREIGN KEY ("external_activity_id") REFERENCES "external_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
