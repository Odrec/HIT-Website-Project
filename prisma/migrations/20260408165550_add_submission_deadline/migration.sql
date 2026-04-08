-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "deadlineEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "submissionDeadline" TIMESTAMP(3);
