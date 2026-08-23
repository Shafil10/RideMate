-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "dropoffLat" REAL;
ALTER TABLE "Booking" ADD COLUMN "dropoffLng" REAL;
ALTER TABLE "Booking" ADD COLUMN "dropoffPoint" TEXT;
ALTER TABLE "Booking" ADD COLUMN "fare" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "defaultRole" TEXT NOT NULL DEFAULT 'passenger',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "university") SELECT "createdAt", "email", "id", "name", "passwordHash", "university" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
