-- Record the building positions each cached route was computed from. Existing
-- rows get NULL and are recomputed on next use: some were computed while
-- building 11 (Schloss) still had coordinates at Westerberg next to building 69
-- and kept sending visitors there after the position was corrected.
ALTER TABLE "cached_routes" ADD COLUMN "fromLatitude" DOUBLE PRECISION,
ADD COLUMN "fromLongitude" DOUBLE PRECISION,
ADD COLUMN "toLatitude" DOUBLE PRECISION,
ADD COLUMN "toLongitude" DOUBLE PRECISION;
