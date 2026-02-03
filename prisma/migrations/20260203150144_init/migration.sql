-- CreateEnum
CREATE TYPE "Institution" AS ENUM ('UNI', 'HOCHSCHULE', 'BOTH');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('VORTRAG', 'LABORFUEHRUNG', 'RUNDGANG', 'WORKSHOP', 'LINK', 'INFOSTAND');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('INFOMARKT_SCHLOSS', 'INFOMARKT_CN', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ORGANIZER', 'PUBLIC');

-- CreateTable
CREATE TABLE "study_program_clusters" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_program_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_programs" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "institution" "Institution" NOT NULL,
    "clusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "buildingName" VARCHAR(200) NOT NULL,
    "roomNumber" VARCHAR(50),
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "information_markets" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "location" VARCHAR(200) NOT NULL,

    CONSTRAINT "information_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "eventType" "EventType" NOT NULL,
    "timeStart" TIMESTAMP(3),
    "timeEnd" TIMESTAMP(3),
    "locationType" "LocationType" NOT NULL,
    "locationDetails" JSONB,
    "roomRequest" TEXT,
    "meetingPoint" VARCHAR(500),
    "additionalInfo" TEXT,
    "photoUrl" VARCHAR(500),
    "institution" "Institution" NOT NULL,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturers" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "title" VARCHAR(50),
    "email" VARCHAR(200),
    "building" VARCHAR(100),
    "roomNumber" VARCHAR(50),

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_organizers" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(50),
    "internalOnly" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "event_organizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_study_programs" (
    "eventId" TEXT NOT NULL,
    "studyProgramId" TEXT NOT NULL,

    CONSTRAINT "event_study_programs_pkey" PRIMARY KEY ("eventId","studyProgramId")
);

-- CreateTable
CREATE TABLE "event_information_markets" (
    "eventId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,

    CONSTRAINT "event_information_markets_pkey" PRIMARY KEY ("eventId","marketId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "passwordHash" VARCHAR(255),
    "name" VARCHAR(200),
    "role" "UserRole" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" VARCHAR(100),
    "name" VARCHAR(100) NOT NULL DEFAULT 'My Schedule',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_items" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_programs_institution_idx" ON "study_programs"("institution");

-- CreateIndex
CREATE INDEX "study_programs_clusterId_idx" ON "study_programs"("clusterId");

-- CreateIndex
CREATE INDEX "locations_buildingName_idx" ON "locations"("buildingName");

-- CreateIndex
CREATE INDEX "events_eventType_idx" ON "events"("eventType");

-- CreateIndex
CREATE INDEX "events_institution_idx" ON "events"("institution");

-- CreateIndex
CREATE INDEX "events_timeStart_idx" ON "events"("timeStart");

-- CreateIndex
CREATE INDEX "events_locationId_idx" ON "events"("locationId");

-- CreateIndex
CREATE INDEX "lecturers_eventId_idx" ON "lecturers"("eventId");

-- CreateIndex
CREATE INDEX "event_organizers_eventId_idx" ON "event_organizers"("eventId");

-- CreateIndex
CREATE INDEX "event_study_programs_studyProgramId_idx" ON "event_study_programs"("studyProgramId");

-- CreateIndex
CREATE INDEX "event_information_markets_marketId_idx" ON "event_information_markets"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "user_schedules_sessionId_idx" ON "user_schedules"("sessionId");

-- CreateIndex
CREATE INDEX "user_schedules_userId_idx" ON "user_schedules"("userId");

-- CreateIndex
CREATE INDEX "schedule_items_eventId_idx" ON "schedule_items"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_items_scheduleId_eventId_key" ON "schedule_items"("scheduleId", "eventId");

-- AddForeignKey
ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "study_program_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_organizers" ADD CONSTRAINT "event_organizers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_study_programs" ADD CONSTRAINT "event_study_programs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_study_programs" ADD CONSTRAINT "event_study_programs_studyProgramId_fkey" FOREIGN KEY ("studyProgramId") REFERENCES "study_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_information_markets" ADD CONSTRAINT "event_information_markets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_information_markets" ADD CONSTRAINT "event_information_markets_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "information_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_schedules" ADD CONSTRAINT "user_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "user_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
