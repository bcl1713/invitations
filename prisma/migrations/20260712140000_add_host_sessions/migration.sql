-- CreateTable
CREATE TABLE "HostSession" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostSession_tokenHash_key" ON "HostSession"("tokenHash");

-- CreateIndex
CREATE INDEX "HostSession_expiresAt_idx" ON "HostSession"("expiresAt");
