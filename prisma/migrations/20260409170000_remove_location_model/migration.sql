-- Remove Location model and locationId from events
-- All events have been migrated to use buildingId instead

-- Drop the locationId column and its index from events
DROP INDEX IF EXISTS "events_locationId_idx";
ALTER TABLE "events" DROP COLUMN IF EXISTS "locationId";

-- Drop the locations table
DROP TABLE IF EXISTS "locations";