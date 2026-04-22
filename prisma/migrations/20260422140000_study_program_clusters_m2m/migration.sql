-- Convert StudyProgram <-> StudyProgramCluster from 1:N (single FK) to M:N.
-- Uses Prisma's implicit many-to-many convention:
--   junction table "_StudyProgramToStudyProgramCluster"
--   columns "A" (StudyProgram.id), "B" (StudyProgramCluster.id)
-- Data-preserving: the existing single clusterId is copied into the
-- junction before the column is dropped.

-- 1. Create the junction table.
CREATE TABLE "_StudyProgramToStudyProgramCluster" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_StudyProgramToStudyProgramCluster_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_StudyProgramToStudyProgramCluster_B_index"
    ON "_StudyProgramToStudyProgramCluster" ("B");

ALTER TABLE "_StudyProgramToStudyProgramCluster"
    ADD CONSTRAINT "_StudyProgramToStudyProgramCluster_A_fkey"
    FOREIGN KEY ("A") REFERENCES "study_programs" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_StudyProgramToStudyProgramCluster"
    ADD CONSTRAINT "_StudyProgramToStudyProgramCluster_B_fkey"
    FOREIGN KEY ("B") REFERENCES "study_program_clusters" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill: copy each program's existing clusterId into the junction.
INSERT INTO "_StudyProgramToStudyProgramCluster" ("A", "B")
SELECT "id", "clusterId"
FROM "study_programs"
WHERE "clusterId" IS NOT NULL;

-- 3. Drop the old single-cluster FK column and its index.
DROP INDEX IF EXISTS "study_programs_clusterId_idx";
ALTER TABLE "study_programs" DROP COLUMN "clusterId";