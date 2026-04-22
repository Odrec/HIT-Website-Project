-- Align the Melder table name with the schema's @@map("melders").
--
-- History: migration 20260407204831_event_form_redesign created "Melder"
-- (PascalCase). When @@map("melders") was later added to the schema, the
-- sibling Building rename was committed (20260409160000) but the Melder
-- rename was never written down. Production DBs were renamed out of band;
-- any fresh DB still carries the PascalCase table name, so Prisma queries
-- targeting "melders" fail with "relation does not exist".
--
-- IF EXISTS makes this idempotent — no-op on environments that are already
-- on the lowercase name.

ALTER TABLE IF EXISTS "Melder" RENAME TO "melders";
ALTER INDEX IF EXISTS "Melder_userId_key" RENAME TO "melders_userId_key";

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Melder_pkey'
    ) THEN
        ALTER TABLE "melders" RENAME CONSTRAINT "Melder_pkey" TO "melders_pkey";
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Melder_userId_fkey'
    ) THEN
        ALTER TABLE "melders" RENAME CONSTRAINT "Melder_userId_fkey" TO "melders_userId_fkey";
    END IF;
END $$;