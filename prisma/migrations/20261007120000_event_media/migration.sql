-- AlterTable
ALTER TABLE "events" ADD COLUMN "videoUrl" VARCHAR(500);

-- CreateTable
CREATE TABLE "uploaded_images" (
    "id" TEXT NOT NULL,
    "mimeType" VARCHAR(50) NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_images_pkey" PRIMARY KEY ("id")
);

-- Photos uploaded before this release were written into the container's
-- public/uploads/ directory: the production server never served them and they
-- were deleted with every redeploy. The references point at nothing, so clear
-- them; the events can get a new photo through the form.
UPDATE "events" SET "photoUrl" = NULL WHERE "photoUrl" LIKE '/uploads/%';
