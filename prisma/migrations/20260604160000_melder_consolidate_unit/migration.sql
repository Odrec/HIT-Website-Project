-- Consolidate Melder fakultaet/fachbereich into a single organisationseinheit
-- field and add an adresse field (used instead of room for external organisers).
ALTER TABLE "melders" ADD COLUMN "organisationseinheit" TEXT;
ALTER TABLE "melders" ADD COLUMN "adresse" TEXT;

UPDATE "melders"
SET "organisationseinheit" = COALESCE(NULLIF("fakultaet", ''), NULLIF("fachbereich", ''));

ALTER TABLE "melders" DROP COLUMN "fakultaet";
ALTER TABLE "melders" DROP COLUMN "fachbereich";
