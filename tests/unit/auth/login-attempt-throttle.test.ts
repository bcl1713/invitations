import {
  createLoginAttemptThrottle,
  type LoginAttemptThrottleStore,
} from '@/modules/auth/login-attempt-throttle';

function createStore(): LoginAttemptThrottleStore {
  const records = new Map<string, { failures: number; expiresAt: Date; blockedUntil: Date | null; windowStartedAt: Date }>();
  return {
    async clearAccount(identifierHash) {
      records.delete(identifierHash);
    },
    async isThrottled(identifierHashes, now) {
      return identifierHashes.some((identifierHash) => (records.get(identifierHash)?.blockedUntil ?? new Date(0)) > now);
    },
    async recordFailure(identifierHashes, now, maxFailures, cooldownMs) {
      const expiresAt = new Date(now.getTime() + cooldownMs);
      let throttled = false;
      for (const identifierHash of identifierHashes) {
        const existing = records.get(identifierHash);
        const failures = existing && existing.expiresAt > now ? existing.failures + 1 : 1;
        const blockedUntil = failures >= maxFailures ? expiresAt : null;
        records.set(identifierHash, { failures, expiresAt, blockedUntil, windowStartedAt: existing?.windowStartedAt ?? now });
        throttled ||= blockedUntil !== null;
      }
      return throttled;
    },
  };
}

describe('login attempt throttle', () => {
  const startedAt = new Date('2026-07-12T00:00:00.000Z').getTime();
  const account = 'host@example.com';
  const source = '203.0.113.42';

  it('allows five failed attempts and throttles the sixth until the cooldown boundary', async () => {
    let now = startedAt;
    const throttle = createLoginAttemptThrottle({ now: () => now, maxFailures: 5, cooldownMs: 60_000, store: createStore() });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(throttle.isThrottled(account, source)).resolves.toBe(false);
      await throttle.recordFailure(account, source);
    }

    await expect(throttle.isThrottled(account, source)).resolves.toBe(true);
    now += 60_000;
    await expect(throttle.isThrottled(account, source)).resolves.toBe(false);
  });

  it('enforces source and account limits across changing identifiers', async () => {
    const sourceThrottle = createLoginAttemptThrottle({ now: () => startedAt, maxFailures: 5, cooldownMs: 60_000, store: createStore() });
    for (let attempt = 0; attempt < 5; attempt += 1) await sourceThrottle.recordFailure(`unknown-${attempt}@example.com`, source);
    await expect(sourceThrottle.isThrottled(account, source)).resolves.toBe(true);

    const accountThrottle = createLoginAttemptThrottle({ now: () => startedAt, maxFailures: 5, cooldownMs: 60_000, store: createStore() });
    for (let attempt = 0; attempt < 5; attempt += 1) await accountThrottle.recordFailure(account, `203.0.113.${attempt}`);
    await expect(accountThrottle.isThrottled(account, '198.51.100.7')).resolves.toBe(true);
  });

  it('resets only a successful account and preserves an abusive source limit', async () => {
    const throttle = createLoginAttemptThrottle({ now: () => startedAt, maxFailures: 5, cooldownMs: 60_000, store: createStore() });
    for (let attempt = 0; attempt < 4; attempt += 1) await throttle.recordFailure(account, source);
    await throttle.recordSuccess(account, '198.51.100.7');
    await expect(throttle.isThrottled(account, source)).resolves.toBe(false);

    for (let attempt = 0; attempt < 5; attempt += 1) await throttle.recordFailure(`unknown-${attempt}@example.com`, source);
    await throttle.recordSuccess(account, '198.51.100.7');
    await expect(throttle.isThrottled(account, source)).resolves.toBe(true);
  });

  it('records safe throttle telemetry without identifiers or passwords', async () => {
    const telemetry = vi.fn();
    const throttle = createLoginAttemptThrottle({ now: () => startedAt, maxFailures: 1, cooldownMs: 60_000, onThrottle: telemetry, store: createStore() });
    await throttle.recordFailure(account, source);

    expect(telemetry).toHaveBeenCalledWith({
      event: 'login_throttled',
      accountFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      sourceFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    });
    expect(JSON.stringify(telemetry.mock.calls)).not.toContain(account);
    expect(JSON.stringify(telemetry.mock.calls)).not.toContain('correct-horse-battery-staple');
  });
});
