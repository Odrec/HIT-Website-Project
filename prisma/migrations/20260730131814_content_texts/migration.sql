-- CreateTable
CREATE TABLE "content_texts" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "content_texts_pkey" PRIMARY KEY ("key")
);
