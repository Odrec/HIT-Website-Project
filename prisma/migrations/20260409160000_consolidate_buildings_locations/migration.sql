-- Consolidate Buildings and Locations into a single Building model
-- Buildings become the single source of truth for coordinates, routing, and event locations

-- Step 1: Add new columns to the existing Building table (if it exists without these columns)
-- First rename the table to match the new @@map("buildings")
ALTER TABLE "Building" RENAME TO "buildings";

-- Add new columns
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "slug" VARCHAR(50);
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "shortName" VARCHAR(50);
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "hasAccessibility" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "buildings" ADD COLUMN IF NOT EXISTS "accessibilityNotes" TEXT;

-- Widen name column
ALTER TABLE "buildings" ALTER COLUMN "name" TYPE VARCHAR(200);

-- Widen address column
ALTER TABLE "buildings" ALTER COLUMN "address" TYPE TEXT;

-- Widen campus column
ALTER TABLE "buildings" ALTER COLUMN "campus" TYPE VARCHAR(50);

-- Step 2: Generate slugs for existing buildings that don't have one
UPDATE "buildings" SET "slug" = LOWER(REPLACE(REPLACE("name", ' ', '-'), '/', '-')) WHERE "slug" IS NULL;

-- Make slug unique and not null
ALTER TABLE "buildings" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "buildings_slug_key" ON "buildings"("slug");

-- Add campus index
CREATE INDEX IF NOT EXISTS "buildings_campus_idx" ON "buildings"("campus");

-- Step 3: Rename CachedRoute columns from buildingId to buildingSlug
-- First add new columns
ALTER TABLE "cached_routes" ADD COLUMN IF NOT EXISTS "fromBuildingSlug" VARCHAR(50);
ALTER TABLE "cached_routes" ADD COLUMN IF NOT EXISTS "toBuildingSlug" VARCHAR(50);

-- Copy existing data (the old IDs were already slug-style strings like 'schloss', 'avz')
UPDATE "cached_routes" SET "fromBuildingSlug" = "fromBuildingId", "toBuildingSlug" = "toBuildingId";

-- Drop old unique constraint and columns
DROP INDEX IF EXISTS "cached_routes_fromBuildingId_toBuildingId_key";
ALTER TABLE "cached_routes" DROP COLUMN IF EXISTS "fromBuildingId";
ALTER TABLE "cached_routes" DROP COLUMN IF EXISTS "toBuildingId";

-- Make new columns not null and add unique constraint
ALTER TABLE "cached_routes" ALTER COLUMN "fromBuildingSlug" SET NOT NULL;
ALTER TABLE "cached_routes" ALTER COLUMN "toBuildingSlug" SET NOT NULL;
CREATE UNIQUE INDEX "cached_routes_fromBuildingSlug_toBuildingSlug_key" ON "cached_routes"("fromBuildingSlug", "toBuildingSlug");