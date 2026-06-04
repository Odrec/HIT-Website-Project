/*
  Warnings:

  - You are about to drop the column `url` on the `study_programs` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "study_program_links" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_program_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_program_links_programId_idx" ON "study_program_links"("programId");

-- AddForeignKey
ALTER TABLE "study_program_links" ADD CONSTRAINT "study_program_links_programId_fkey" FOREIGN KEY ("programId") REFERENCES "study_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing single urls into the new links table.
INSERT INTO "study_program_links" ("id", "programId", "label", "url", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'Zur Studiengang-Seite', "url", 0, now(), now()
FROM "study_programs"
WHERE "url" IS NOT NULL AND btrim("url") <> '';

-- AlterTable
ALTER TABLE "study_programs" DROP COLUMN "url";