-- Add institution as nullable first
ALTER TABLE "study_program_clusters" ADD COLUMN "institution" "Institution";

-- Backfill: every existing row is a Uni cluster
UPDATE "study_program_clusters" SET "institution" = 'UNI';

-- Now make it NOT NULL
ALTER TABLE "study_program_clusters" ALTER COLUMN "institution" SET NOT NULL;

-- Index
CREATE INDEX "study_program_clusters_institution_idx" ON "study_program_clusters"("institution");

-- Drop icon
ALTER TABLE "study_program_clusters" DROP COLUMN "icon";
