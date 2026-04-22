-- Add Building.institution so the event form can filter buildings by
-- whether they belong to Uni, Hochschule, or both.
-- Backfill uses the existing campus values:
--   * schloss    -> UNI (Uni-owned core campus)
--   * westerberg -> UNI (AVZ, Biologie, Physik, Chemie, Mathe/Info, EIHU
--                  are all Uni in the current seed; shared buildings don't
--                  exist in the dataset today)
--   * caprivi    -> HOCHSCHULE
--   * anything else or NULL -> BOTH (safe default; admin can refine)

ALTER TABLE "buildings"
    ADD COLUMN "institution" "Institution" NOT NULL DEFAULT 'BOTH';

UPDATE "buildings"
SET "institution" = CASE
    WHEN "campus" = 'schloss'    THEN 'UNI'::"Institution"
    WHEN "campus" = 'westerberg' THEN 'UNI'::"Institution"
    WHEN "campus" = 'caprivi'    THEN 'HOCHSCHULE'::"Institution"
    ELSE 'BOTH'::"Institution"
END;

CREATE INDEX "buildings_institution_idx" ON "buildings" ("institution");