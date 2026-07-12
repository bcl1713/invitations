CREATE TABLE "LoginAttemptThrottle" (
    "identifierHash" TEXT NOT NULL,
    "failures" INTEGER NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttemptThrottle_pkey" PRIMARY KEY ("identifierHash")
);

CREATE INDEX "LoginAttemptThrottle_blockedUntil_idx" ON "LoginAttemptThrottle"("blockedUntil");
CREATE INDEX "LoginAttemptThrottle_expiresAt_idx" ON "LoginAttemptThrottle"("expiresAt");
