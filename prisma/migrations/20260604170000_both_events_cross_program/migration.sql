-- Hochschulübergreifend (BOTH) events are external/cross-institution and now
-- always belong to "Rund ums Studium". Backfill the flag for existing events.
UPDATE "events" SET "isCrossProgram" = true WHERE "institution" = 'BOTH';
