-- Drop the legacy LocationType column and enum.
--
-- Background: Events used to be tagged as Infomarkt-or-not via the
-- LocationType enum (INFOMARKT_SCHLOSS, INFOMARKT_CN, OTHER). The new
-- InformationMarket model + EventInformationMarket M2M (added April 2026)
-- supersedes this. All read paths have been migrated to the M2M; the
-- column is now dead weight.
--
-- The four production rows that still carry INFOMARKT_SCHLOSS or
-- INFOMARKT_CN already have matching rows in event_information_markets,
-- so no data is lost when the column is dropped.

ALTER TABLE "events" DROP COLUMN "locationType";
DROP TYPE "LocationType";