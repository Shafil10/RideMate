-- CreateTable
CREATE TABLE "RideRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origin" TEXT NOT NULL,
    "originLat" REAL,
    "originLng" REAL,
    "destination" TEXT NOT NULL,
    "destLat" REAL,
    "destLng" REAL,
    "university" TEXT NOT NULL,
    "desiredTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initiatorId" TEXT NOT NULL,
    "fulfilledByRideId" TEXT,
    CONSTRAINT "RideRequest_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RideRequest_fulfilledByRideId_fkey" FOREIGN KEY ("fulfilledByRideId") REFERENCES "Ride" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RideRequestParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pickupPoint" TEXT NOT NULL,
    "pickupLat" REAL,
    "pickupLng" REAL,
    "dropoffPoint" TEXT NOT NULL,
    "dropoffLat" REAL,
    "dropoffLng" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    CONSTRAINT "RideRequestParticipant_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RideRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RideRequestParticipant_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RideRequest_fulfilledByRideId_key" ON "RideRequest"("fulfilledByRideId");

-- CreateIndex
CREATE UNIQUE INDEX "RideRequestParticipant_requestId_riderId_key" ON "RideRequestParticipant"("requestId", "riderId");
