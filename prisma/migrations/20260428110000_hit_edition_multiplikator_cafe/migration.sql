-- Add the nullable FK column on HitEdition
ALTER TABLE "hit_editions" ADD COLUMN "multiplikatorCafeEventId" TEXT;

-- Add the FK constraint with ON DELETE SET NULL
ALTER TABLE "hit_editions"
  ADD CONSTRAINT "hit_editions_multiplikatorCafeEventId_fkey"
  FOREIGN KEY ("multiplikatorCafeEventId") REFERENCES "events"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
