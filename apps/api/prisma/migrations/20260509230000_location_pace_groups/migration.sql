-- CreateTable
CREATE TABLE "location_pace_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "location_id" UUID NOT NULL,
    "distance_km" INTEGER NOT NULL,
    "pace_seconds_per_km" INTEGER NOT NULL,
    "pacer_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_pace_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_location_pace_group" ON "location_pace_groups"("location_id", "distance_km", "pace_seconds_per_km");

-- AddForeignKey
ALTER TABLE "location_pace_groups" ADD CONSTRAINT "location_pace_groups_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "city_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
