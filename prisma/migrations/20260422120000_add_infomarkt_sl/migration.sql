-- Add "Infomarkt SL" (Westerberg) as a third information market location.
-- Idempotent: only inserts if no row with that name already exists.
-- The id column uses cuid() in app code, but this migration runs in SQL
-- only, so we generate a stable placeholder id prefixed with the migration
-- slug. Future seed runs use the @default(cuid()) on fresh DBs.
INSERT INTO "information_markets" ("id", "name", "location")
SELECT 'im_sl_westerberg_20260422', 'Infomarkt SL', 'Westerberg (SL)'
WHERE NOT EXISTS (
  SELECT 1 FROM "information_markets" WHERE "name" = 'Infomarkt SL'
);