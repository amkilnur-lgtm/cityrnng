-- Optional free-text label for distances on an event (e.g. "10 км", "3+7", "уточняется").
-- Falls back to computed distances from attached locations' pace groups when null.
ALTER TABLE "events" ADD COLUMN "distance_label" TEXT;
