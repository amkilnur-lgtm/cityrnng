-- Locations whose participants are at THIS event instead of the regular
-- Wednesday occurrence at their usual point. Materializer subtracts these
-- from the rule's locations for the matching date.
ALTER TABLE "events" ADD COLUMN "excludes_regular_location_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
