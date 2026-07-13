-- Preserve the timezone selected by the host so event instants render consistently.
ALTER TABLE "Event" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'UTC';
