-- Split the Melder.name single column into firstName + lastName.
-- Migration is data-preserving:
--   * If the existing name contains a space, first token -> firstName,
--     the remainder -> lastName.
--   * Otherwise the whole value goes into lastName and firstName stays empty.
-- Admins can fine-tune via the Melder profile editor afterwards.

ALTER TABLE "melders"
    ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "lastName"  TEXT NOT NULL DEFAULT '';

UPDATE "melders"
SET
    "firstName" = CASE
        WHEN position(' ' IN "name") > 0
            THEN split_part("name", ' ', 1)
        ELSE ''
    END,
    "lastName" = CASE
        WHEN position(' ' IN "name") > 0
            THEN substring("name" FROM position(' ' IN "name") + 1)
        ELSE "name"
    END;

ALTER TABLE "melders"
    ALTER COLUMN "firstName" DROP DEFAULT,
    ALTER COLUMN "lastName"  DROP DEFAULT;

ALTER TABLE "melders" DROP COLUMN "name";