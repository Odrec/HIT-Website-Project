-- AlterTable
ALTER TABLE "ShuttleBus" ADD COLUMN     "pausedIndefinitely" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pausedUntil" TIMESTAMP(3);
