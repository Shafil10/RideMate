-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pickupPoint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "cancellationFee" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "rideId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    CONSTRAINT "Booking_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
