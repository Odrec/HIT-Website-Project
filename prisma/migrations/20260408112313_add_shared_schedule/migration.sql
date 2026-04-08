-- AlterTable
ALTER TABLE "lecturers" ALTER COLUMN "firstName" SET DATA TYPE TEXT,
ALTER COLUMN "lastName" SET DATA TYPE TEXT,
ALTER COLUMN "title" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "shared_schedules" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "eventIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_schedules_code_key" ON "shared_schedules"("code");
