-- CreateEnum
CREATE TYPE "CityLocationStatus" AS ENUM ('active', 'archived');

-- CreateTable
CREATE TABLE "city_locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radius_meters" INTEGER,
    "status" "CityLocationStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sync_rule_locations" (
    "sync_rule_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_sync_rule_locations_pkey" PRIMARY KEY ("sync_rule_id","location_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "city_locations_slug_key" ON "city_locations"("slug");

-- CreateIndex
CREATE INDEX "city_locations_city_idx" ON "city_locations"("city");

-- CreateIndex
CREATE INDEX "city_locations_status_idx" ON "city_locations"("status");

-- CreateIndex
CREATE INDEX "event_sync_rule_locations_location_id_idx" ON "event_sync_rule_locations"("location_id");

-- AddForeignKey
ALTER TABLE "event_sync_rule_locations" ADD CONSTRAINT "event_sync_rule_locations_sync_rule_id_fkey" FOREIGN KEY ("sync_rule_id") REFERENCES "event_sync_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sync_rule_locations" ADD CONSTRAINT "event_sync_rule_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "city_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
