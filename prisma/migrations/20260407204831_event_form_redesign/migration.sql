-- CreateEnum
CREATE TYPE "Affiliation" AS ENUM ('UNI', 'HOCHSCHULE', 'EXTERN');

-- AlterEnum: Rename LINK to ONLINE, add VIDEO
ALTER TYPE "EventType" RENAME VALUE 'LINK' TO 'ONLINE';
ALTER TYPE "EventType" ADD VALUE 'VIDEO';

-- CreateTable: SiteSettings
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "hitDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Melder
CREATE TABLE "Melder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "affiliation" "Affiliation" NOT NULL,
    "fakultaet" TEXT,
    "fachbereich" TEXT,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Melder_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Building
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "campus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Room
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "buildingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Event - add new columns
ALTER TABLE "events"
    ADD COLUMN "isCrossProgram" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "locationHint" TEXT,
    ADD COLUMN "melderId" TEXT,
    ADD COLUMN "buildingId" TEXT,
    ADD COLUMN "roomId" TEXT;

-- AlterTable: Lecturer - drop old columns, add new columns
ALTER TABLE "lecturers"
    DROP COLUMN "building",
    DROP COLUMN "roomNumber",
    ADD COLUMN "affiliation" "Affiliation",
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Remove the default after adding to avoid permanent defaults
ALTER TABLE "lecturers" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Melder_userId_key" ON "Melder"("userId");

-- CreateIndex
CREATE INDEX "Room_buildingId_idx" ON "Room"("buildingId");

-- CreateIndex
CREATE INDEX "events_melderId_idx" ON "events"("melderId");

-- CreateIndex
CREATE INDEX "events_buildingId_idx" ON "events"("buildingId");

-- CreateIndex
CREATE INDEX "events_roomId_idx" ON "events"("roomId");

-- AddForeignKey
ALTER TABLE "Melder" ADD CONSTRAINT "Melder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_melderId_fkey" FOREIGN KEY ("melderId") REFERENCES "Melder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed SiteSettings
INSERT INTO "SiteSettings" (id, "hitDate", "createdAt", "updatedAt")
VALUES ('default', '2026-11-19T00:00:00.000Z', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
