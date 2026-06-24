-- DropForeignKey
ALTER TABLE "study_program_unterrichtsfaecher" DROP CONSTRAINT "study_program_unterrichtsfaecher_fachId_fkey";

-- DropForeignKey
ALTER TABLE "study_program_unterrichtsfaecher" DROP CONSTRAINT "study_program_unterrichtsfaecher_fachrichtungId_fkey";

-- DropIndex
DROP INDEX "study_programs_lehramtTyp_idx";

-- AlterTable: add the new columns first; keep lehramtTyp for the backfill below.
ALTER TABLE "study_programs"
  ADD COLUMN     "isLehramtStudiengang" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "lehramtTypen" "LehramtTyp"[];

-- Backfill: each existing single value becomes a one-element array.
UPDATE "study_programs"
SET "lehramtTypen" = ARRAY["lehramtTyp"]
WHERE "lehramtTyp" IS NOT NULL;

-- Drop the now-migrated single-value column.
ALTER TABLE "study_programs" DROP COLUMN "lehramtTyp";

-- DropTable: the per-Fachrichtung subject list is replaced by the global
-- Allgemeinbildende-Unterrichtsfächer list derived from lehramtTypen.
DROP TABLE "study_program_unterrichtsfaecher";