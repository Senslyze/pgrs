-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_grievances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "report_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "date_of_registration" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sub_subject" TEXT NOT NULL,
    "grievance_address" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "location_name" TEXT,
    "location_address" TEXT,
    "media_id" TEXT,
    "image_url" TEXT,
    "download_url" TEXT,
    "ai_priority" TEXT NOT NULL,
    "ai_confidence" REAL,
    "is_image_validated" BOOLEAN,
    "status" TEXT DEFAULT 'OPEN',
    "userId" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "grievances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_grievances" ("age", "ai_confidence", "ai_priority", "created_at", "date_of_registration", "department", "download_url", "gender", "grievance_address", "id", "image_url", "is_deleted", "is_image_validated", "latitude", "location_address", "location_name", "longitude", "media_id", "name", "phone_number", "remark", "report_id", "status", "sub_subject", "subject", "updated_at", "userId") SELECT "age", "ai_confidence", "ai_priority", "created_at", "date_of_registration", "department", "download_url", "gender", "grievance_address", "id", "image_url", "is_deleted", "is_image_validated", "latitude", "location_address", "location_name", "longitude", "media_id", "name", "phone_number", "remark", "report_id", "status", "sub_subject", "subject", "updated_at", "userId" FROM "grievances";
DROP TABLE "grievances";
ALTER TABLE "new_grievances" RENAME TO "grievances";
CREATE UNIQUE INDEX "grievances_report_id_key" ON "grievances"("report_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
