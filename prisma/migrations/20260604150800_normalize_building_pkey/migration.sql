-- Normalize the buildings primary-key constraint name.
-- The table was created as "Building" (constraint "Building_pkey") and later
-- renamed to "buildings" via @@map, but the PK constraint kept its old name.
-- Rename it to the expected "buildings_pkey" so the schema and DB match and
-- Prisma stops reporting drift. Safe: every environment built from these
-- migrations still has the old "Building_pkey" name.
ALTER TABLE "buildings" RENAME CONSTRAINT "Building_pkey" TO "buildings_pkey";
