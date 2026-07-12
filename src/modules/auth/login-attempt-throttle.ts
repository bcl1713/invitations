import { createHash } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/db';

const DEFAULT_MAX_FAILURES = 5;
const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000;

type ThrottleScope = 'account' | 'source';

export interface LoginThrottleTelemetry {
  event: 'login_throttled';
}

export interface LoginAttemptThrottleStore {
  clearAccount(accountIdentifierHash: string): Promise<void>;
  isThrottled(identifierHashes: string[], now: Date): Promise<boolean>;
  recordFailure(identifierHashes: string[], now: Date, maxFailures: number, cooldownMs: number): Promise<boolean>;
}

export interface LoginAttemptThrottleOptions {
  now?: () => number;
  maxFailures?: number;
  cooldownMs?: number;
  onThrottle?: (event: LoginThrottleTelemetry) => void;
  store?: LoginAttemptThrottleStore;
}

export interface LoginAttemptThrottle {
  isThrottled(account: string, source: string): Promise<boolean>;
  recordFailure(account: string, source: string): Promise<void>;
  recordSuccess(account: string, source: string): Promise<void>;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase().slice(0, 256) || 'unknown';
}

function fingerprint(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function identifierHash(scope: ThrottleScope, identifier: string) {
  return fingerprint(`${scope}:${normalizeIdentifier(identifier)}`);
}

export function createPrismaLoginAttemptThrottleStore(client: PrismaClient = prisma): LoginAttemptThrottleStore {
  return {
    async clearAccount(accountIdentifierHash) {
      await client.loginAttemptThrottle.deleteMany({ where: { identifierHash: accountIdentifierHash } });
    },
    async isThrottled(identifierHashes, now) {
      return Boolean(
        await client.loginAttemptThrottle.findFirst({
          where: { identifierHash: { in: identifierHashes }, blockedUntil: { gt: now } },
          select: { identifierHash: true },
        }),
      );
    },
    async recordFailure(identifierHashes, now, maxFailures, cooldownMs) {
      const windowStart = new Date(now.getTime() - cooldownMs);
      const expiresAt = new Date(now.getTime() + cooldownMs);

      return client.$transaction(async (tx) => {
        await tx.loginAttemptThrottle.deleteMany({ where: { expiresAt: { lte: now } } });
        let throttled = false;

        // PostgreSQL advisory locks serialize each identifier across app instances.
        // Sorting prevents deadlocks when overlapping account/source pairs arrive together.
        for (const identifierHash of [...identifierHashes].sort()) {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${identifierHash}))`;
        }

        for (const identifierHash of identifierHashes) {
          const existing = await tx.loginAttemptThrottle.findUnique({ where: { identifierHash } });
          const withinWindow = existing && existing.windowStartedAt > windowStart;
          const failures = withinWindow ? existing.failures + 1 : 1;
          const blockedUntil = failures >= maxFailures ? expiresAt : null;
          throttled ||= blockedUntil !== null;

          await tx.loginAttemptThrottle.upsert({
            where: { identifierHash },
            create: { identifierHash, failures, windowStartedAt: now, blockedUntil, expiresAt },
            update: { failures, windowStartedAt: withinWindow ? existing.windowStartedAt : now, blockedUntil, expiresAt },
          });
        }

        return throttled;
      });
    },
  };
}

const prismaLoginAttemptThrottleStore = createPrismaLoginAttemptThrottleStore();

export function createLoginAttemptThrottle({
  now = Date.now,
  maxFailures = DEFAULT_MAX_FAILURES,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  onThrottle,
  store = prismaLoginAttemptThrottleStore,
}: LoginAttemptThrottleOptions = {}): LoginAttemptThrottle {
  function identifiers(account: string, source: string) {
    return [identifierHash('account', account), identifierHash('source', source)];
  }

  async function recordFailure(account: string, source: string) {
    if (await store.recordFailure(identifiers(account, source), new Date(now()), maxFailures, cooldownMs)) {
      onThrottle?.({ event: 'login_throttled' });
    }
  }

  return {
    isThrottled: (account, source) => store.isThrottled(identifiers(account, source), new Date(now())),
    recordFailure,
    // A successful account login resets that account only, never a shared abusive-source limit.
    recordSuccess: async (account) => store.clearAccount(identifierHash('account', account)),
  };
}

export const loginAttemptThrottle = createLoginAttemptThrottle({
  onThrottle: (event) => {
    console.warn(JSON.stringify(event));
  },
});
