-- CreateEnum
CREATE TYPE "EditionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventReviewStatus" AS ENUM ('DRAFT_FROM_ROLLOVER', 'NEEDS_REVIEW', 'PUBLISHED');

-- CreateTable
CREATE TABLE "hit_editions" (
  "id" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "hitDate" TIMESTAMP(3) NOT NULL,
  "submissionDeadline" TIMESTAMP(3),
  "deadlineEnabled" BOOLEAN NOT NULL DEFAULT true,
  "status" "EditionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hit_editions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hit_editions_year_key" ON "hit_editions"("year");

-- CreateIndex
CREATE INDEX "hit_editions_status_idx" ON "hit_editions"("status");

-- Seed the 2026 edition from existing SiteSettings (if present), falling back to a fresh row.
DO $$
DECLARE
  seed_id TEXT;
BEGIN
  seed_id := 'edition-2026';

  IF EXISTS (SELECT 1 FROM "SiteSettings" WHERE id = 'default') THEN
    INSERT INTO "hit_editions" (id, year, "hitDate", "submissionDeadline", "deadlineEnabled", status, "createdAt", "updatedAt")
    SELECT seed_id, 2026,
           COALESCE(s."hitDate", '2026-11-19 00:00:00'::timestamp),
           s."submissionDeadline",
           s."deadlineEnabled",
           'ACTIVE',
           now(), now()
    FROM "SiteSettings" s WHERE s.id = 'default'
    ON CONFLICT (year) DO NOTHING;
  ELSE
    INSERT INTO "hit_editions" (id, year, "hitDate", "submissionDeadline", "deadlineEnabled", status, "createdAt", "updatedAt")
    VALUES (seed_id, 2026, '2026-11-19 00:00:00'::timestamp, NULL, true, 'ACTIVE', now(), now())
    ON CONFLICT (year) DO NOTHING;
  END IF;

  IF (SELECT COUNT(*) FROM "hit_editions" WHERE status = 'ACTIVE') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one ACTIVE HitEdition after seed, found %',
      (SELECT COUNT(*) FROM "hit_editions" WHERE status = 'ACTIVE');
  END IF;
END $$;

-- Add edition scoping to events (nullable first, backfill, then NOT NULL)
ALTER TABLE "events" ADD COLUMN "editionId" TEXT;
ALTER TABLE "events" ADD COLUMN "reviewStatus" "EventReviewStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "events" ADD COLUMN "sourceEventId" TEXT;

UPDATE "events" SET "editionId" = (SELECT id FROM "hit_editions" WHERE status = 'ACTIVE' LIMIT 1);

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "events" WHERE "editionId" IS NULL) > 0 THEN
    RAISE EXCEPTION 'Events backfill failed: % events still have NULL editionId',
      (SELECT COUNT(*) FROM "events" WHERE "editionId" IS NULL);
  END IF;
END $$;

ALTER TABLE "events" ALTER COLUMN "editionId" SET NOT NULL;
ALTER TABLE "events" ADD CONSTRAINT "events_editionId_fkey"
  FOREIGN KEY ("editionId") REFERENCES "hit_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_sourceEventId_fkey"
  FOREIGN KEY ("sourceEventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "events_editionId_idx" ON "events"("editionId");
CREATE INDEX "events_editionId_reviewStatus_idx" ON "events"("editionId", "reviewStatus");
CREATE INDEX "events_sourceEventId_idx" ON "events"("sourceEventId");

-- Same dance for user_schedules
ALTER TABLE "user_schedules" ADD COLUMN "editionId" TEXT;
UPDATE "user_schedules" SET "editionId" = (SELECT id FROM "hit_editions" WHERE status = 'ACTIVE' LIMIT 1);
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "user_schedules" WHERE "editionId" IS NULL) > 0 THEN
    RAISE EXCEPTION 'user_schedules backfill failed';
  END IF;
END $$;
ALTER TABLE "user_schedules" ALTER COLUMN "editionId" SET NOT NULL;
ALTER TABLE "user_schedules" ADD CONSTRAINT "user_schedules_editionId_fkey"
  FOREIGN KEY ("editionId") REFERENCES "hit_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "user_schedules_editionId_idx" ON "user_schedules"("editionId");

-- Same dance for shared_schedules
ALTER TABLE "shared_schedules" ADD COLUMN "editionId" TEXT;
UPDATE "shared_schedules" SET "editionId" = (SELECT id FROM "hit_editions" WHERE status = 'ACTIVE' LIMIT 1);
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "shared_schedules" WHERE "editionId" IS NULL) > 0 THEN
    RAISE EXCEPTION 'shared_schedules backfill failed';
  END IF;
END $$;
ALTER TABLE "shared_schedules" ALTER COLUMN "editionId" SET NOT NULL;
ALTER TABLE "shared_schedules" ADD CONSTRAINT "shared_schedules_editionId_fkey"
  FOREIGN KEY ("editionId") REFERENCES "hit_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "shared_schedules_editionId_idx" ON "shared_schedules"("editionId");

-- Drop SiteSettings — all its data moved to the 2026 HitEdition row
DROP TABLE "SiteSettings";