-- CreateTable
CREATE TABLE "shuttle_stops" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "directionsNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shuttle_stops_pkey" PRIMARY KEY ("id")
);

-- Carry over the stops that used to be hardcoded in src/types/shuttle.ts,
-- unchanged, so the Lageplan looks the same until an admin refines them.
INSERT INTO "shuttle_stops" ("id", "name", "latitude", "longitude", "directionsNote", "sortOrder", "updatedAt") VALUES
    ('osnabrueckhalle', 'OsnabrückHalle / Schloss', 52.2713, 8.042, 'Eine Haltestelle (Seite der OsnabrückHalle)', 1, CURRENT_TIMESTAMP),
    ('caprivistrasse', 'Caprivistraße / Sophie-Charlotte-Str.', 52.278, 8.024, 'Zwei Haltestellen (eine pro Fahrtrichtung)', 2, CURRENT_TIMESTAMP),
    ('nelson-mandela-platz', 'Nelson-Mandela-Platz', 52.2865, 8.0231, 'Zwei Haltestellen (eine pro Fahrtrichtung)', 3, CURRENT_TIMESTAMP);
