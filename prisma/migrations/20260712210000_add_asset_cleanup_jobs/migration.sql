CREATE TABLE "AssetCleanup" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCleanup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetCleanup_eventId_fileName_key" ON "AssetCleanup"("eventId", "fileName");
CREATE INDEX "AssetCleanup_eventId_idx" ON "AssetCleanup"("eventId");
