-- CreateEnum
CREATE TYPE "LehramtTyp" AS ENUM ('GRUND_HAUPT_REAL', 'GYMNASIUM', 'BERUFSBILDEND');

-- AlterTable
ALTER TABLE "study_programs" ADD COLUMN     "isBeruflicheFachrichtung" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lehramtTyp" "LehramtTyp";

-- CreateTable
CREATE TABLE "study_program_unterrichtsfaecher" (
    "fachrichtungId" TEXT NOT NULL,
    "fachId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_program_unterrichtsfaecher_pkey" PRIMARY KEY ("fachrichtungId","fachId")
);

-- CreateIndex
CREATE INDEX "study_program_unterrichtsfaecher_fachId_idx" ON "study_program_unterrichtsfaecher"("fachId");

-- CreateIndex
CREATE INDEX "study_programs_lehramtTyp_idx" ON "study_programs"("lehramtTyp");

-- AddForeignKey
ALTER TABLE "study_program_unterrichtsfaecher" ADD CONSTRAINT "study_program_unterrichtsfaecher_fachrichtungId_fkey" FOREIGN KEY ("fachrichtungId") REFERENCES "study_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_program_unterrichtsfaecher" ADD CONSTRAINT "study_program_unterrichtsfaecher_fachId_fkey" FOREIGN KEY ("fachId") REFERENCES "study_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: classify existing Lehramt programs by their cluster + name.
-- Best effort; anything unmatched stays NULL and is classified by admins.

UPDATE "study_programs" sp
SET "lehramtTyp" = 'GYMNASIUM'
WHERE sp."lehramtTyp" IS NULL
  AND sp."name" ILIKE '%gymnasi%'
  AND EXISTS (
    SELECT 1 FROM "_StudyProgramToStudyProgramCluster" j
    JOIN "study_program_clusters" c ON c."id" = j."B"
    WHERE j."A" = sp."id" AND c."name" = 'Lehramt' AND c."institution" = 'UNI'
  );

UPDATE "study_programs" sp
SET "lehramtTyp" = 'GRUND_HAUPT_REAL'
WHERE sp."lehramtTyp" IS NULL
  AND (sp."name" ILIKE '%grundschul%' OR sp."name" ILIKE '%haupt%' OR sp."name" ILIKE '%realschul%')
  AND EXISTS (
    SELECT 1 FROM "_StudyProgramToStudyProgramCluster" j
    JOIN "study_program_clusters" c ON c."id" = j."B"
    WHERE j."A" = sp."id" AND c."name" = 'Lehramt' AND c."institution" = 'UNI'
  );

UPDATE "study_programs" sp
SET "lehramtTyp" = 'BERUFSBILDEND'
WHERE sp."lehramtTyp" IS NULL
  AND EXISTS (
    SELECT 1 FROM "_StudyProgramToStudyProgramCluster" j
    JOIN "study_program_clusters" c ON c."id" = j."B"
    WHERE j."A" = sp."id"
      AND c."name" = 'Lehramt an berufsbildenden Schulen'
      AND c."institution" = 'HOCHSCHULE'
  );
