-- CreateTable
CREATE TABLE "cached_routes" (
    "id" TEXT NOT NULL,
    "fromBuildingId" TEXT NOT NULL,
    "toBuildingId" TEXT NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "polyline" TEXT NOT NULL,
    "waypoints" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cached_routes_fromBuildingId_toBuildingId_key" ON "cached_routes"("fromBuildingId", "toBuildingId");
