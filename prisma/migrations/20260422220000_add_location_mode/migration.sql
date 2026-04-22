-- Add locationMode + locationWishArea to events.
--
-- Organisers can now choose between:
--   * Steht fest (CONFIRMED): pick a building + room from the managed list.
--   * Wunsch    (WISH)     : pick a campus area and describe preferences
--                            in the existing roomRequest free-text field.
--
-- Existing rows default to CONFIRMED (matches the previous behaviour —
-- a buildingId was required or absent, but the form always treated it
-- as a confirmed assignment).

CREATE TYPE "LocationMode" AS ENUM ('CONFIRMED', 'WISH');
CREATE TYPE "CampusArea"   AS ENUM ('WESTERBERG', 'CAPRIVI', 'INNENSTADT');

ALTER TABLE "events"
    ADD COLUMN "locationMode"     "LocationMode" NOT NULL DEFAULT 'CONFIRMED',
    ADD COLUMN "locationWishArea" "CampusArea";