import { createLoginAttemptThrottle } from '@/modules/auth/login-attempt-throttle';

describe('login attempt throttle', () => {
  const startedAt = new Date('2026-07-12T00:00:00.000Z').getTime();
  const account = 'host@example.com';
  const source = '203.0.113.42';

  it('allows five failed attempts and throttles the sixth from the same account and source', () => {
    let now = startedAt;
    const throttle = createLoginAttemptThrottle({
      now: () => now,
      maxFailures: 5,
      cooldownMs: 60_000,
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(throttle.isThrottled(account, source)).toBe(false);
      throttle.recordFailure(account, source);
    }

    expect(throttle.isThrottled(account, source)).toBe(true);
    now += 60_000;
    expect(throttle.isThrottled(account, source)).toBe(false);
  });

  it('enforces the source limit across account identifiers', () => {
    const throttle = createLoginAttemptThrottle({
      now: () => startedAt,
      maxFailures: 5,
      cooldownMs: 60_000,
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      throttle.recordFailure(`unknown-${attempt}@example.com`, source);
    }

    expect(throttle.isThrottled(account, source)).toBe(true);
  });

  it('enforces the account limit across sources', () => {
    const throttle = createLoginAttemptThrottle({
      now: () => startedAt,
      maxFailures: 5,
      cooldownMs: 60_000,
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      throttle.recordFailure(account, `203.0.113.${attempt}`);
    }

    expect(throttle.isThrottled(account, '198.51.100.7')).toBe(true);
  });

  it('does not clear other abusive sources after a successful login', () => {
    const throttle = createLoginAttemptThrottle({
      now: () => startedAt,
      maxFailures: 5,
      cooldownMs: 60_000,
    });
    const abusiveSource = '203.0.113.42';
    const legitimateSource = '198.51.100.7';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      throttle.recordFailure(`unknown-${attempt}@example.com`, abusiveSource);
    }

    throttle.recordSuccess(account, legitimateSource);

    expect(throttle.isThrottled(account, abusiveSource)).toBe(true);
  });

  it('records safe throttle telemetry without passwords', () => {
    const telemetry = vi.fn();
    const throttle = createLoginAttemptThrottle({
      now: () => startedAt,
      maxFailures: 1,
      cooldownMs: 60_000,
      onThrottle: telemetry,
    });

    throttle.recordFailure(account, source);

    expect(telemetry).toHaveBeenCalledWith({
      event: 'login_throttled',
      accountFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      sourceFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    });
    expect(JSON.stringify(telemetry.mock.calls)).not.toContain('correct-horse-battery-staple');
  });
});
