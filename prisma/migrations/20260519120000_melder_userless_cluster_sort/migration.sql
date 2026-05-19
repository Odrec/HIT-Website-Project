-- Decouple Melder from User and add a case-insensitive uniqueness index on
-- email. Background: admins create events on behalf of professors/lecturers
-- who never log in. Before this migration the Melder model required a
-- backing User, so admin-entered Melder data was never persisted at all.

-- 1. Drop the existing FK (will be re-added with ON DELETE SET NULL).
ALTER TABLE "melders" DROP CONSTRAINT IF EXISTS "melders_userId_fkey";

-- 2. Make userId nullable. The existing unique index on userId stays — Postgres
--    permits multiple NULLs in a unique column, so user-less Melders can coexist.
ALTER TABLE "melders" ALTER COLUMN "userId" DROP NOT NULL;

-- 3. Re-add the FK so deleting a User now nulls out melder.userId rather than
--    cascading the Melder away (admin-created Melders should survive a User
--    deletion; the Melder remains linked to its events by email/id).
ALTER TABLE "melders"
  ADD CONSTRAINT "melders_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Add an index on email so the email-based upsert is fast.
CREATE INDEX "melders_email_idx" ON "melders" ("email");

-- 5. Add sortOrder to StudyProgramCluster (default 0 = alphabetical fallback).
ALTER TABLE "study_program_clusters"
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "study_program_clusters_sortOrder_idx"
  ON "study_program_clusters" ("sortOrder");
