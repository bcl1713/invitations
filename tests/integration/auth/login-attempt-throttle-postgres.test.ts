import { PrismaClient } from '@prisma/client';

import {
  createLoginAttemptThrottle,
  createPrismaLoginAttemptThrottleStore,
} from '@/modules/auth/login-attempt-throttle';

const testDatabaseUrl = process.env.LOGIN_THROTTLE_TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;
const prisma = testDatabaseUrl ? new PrismaClient({ datasources: { db: { url: testDatabaseUrl } } }) : null;

describeWithDatabase('PostgreSQL login attempt throttle', () => {
  const now = new Date('2026-07-12T00:00:00.000Z').getTime();
  const account = 'concurrent-host@example.com';
  const source = '203.0.113.252';
  const throttle = createLoginAttemptThrottle({
    now: () => now,
    maxFailures: 5,
    cooldownMs: 60_000,
    store: createPrismaLoginAttemptThrottleStore(prisma!),
  });

  beforeAll(async () => {
    await prisma!.$connect();
  });

  beforeEach(async () => {
    await prisma!.loginAttemptThrottle.deleteMany();
  });

  afterAll(async () => {
    await prisma!.$disconnect();
  });

  it('serializes concurrent failures so a burst cannot lose increments', async () => {
    await Promise.all(Array.from({ length: 5 }, () => throttle.recordFailure(account, source)));

    await expect(throttle.isThrottled(account, source)).resolves.toBe(true);
  });
});
