-- CreateTable
CREATE TABLE "ShuttleBus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShuttleBus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusPosition" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShuttleBus_number_key" ON "ShuttleBus"("number");

-- CreateIndex
CREATE UNIQUE INDEX "ShuttleBus_token_key" ON "ShuttleBus"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BusPosition_busId_key" ON "BusPosition"("busId");

-- AddForeignKey
ALTER TABLE "BusPosition" ADD CONSTRAINT "BusPosition_busId_fkey" FOREIGN KEY ("busId") REFERENCES "ShuttleBus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
