import { createHash } from 'node:crypto';

const DEFAULT_MAX_FAILURES = 5;
const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000;
const MAX_TRACKED_IDENTIFIERS = 10_000;

type ThrottleScope = 'account' | 'source';

export interface LoginThrottleTelemetry {
  event: 'login_throttled';
  accountFingerprint: string;
  sourceFingerprint: string;
}

export interface LoginAttemptThrottleOptions {
  now?: () => number;
  maxFailures?: number;
  cooldownMs?: number;
  onThrottle?: (event: LoginThrottleTelemetry) => void;
}

export interface LoginAttemptThrottle {
  isThrottled(account: string, source: string): boolean;
  recordFailure(account: string, source: string): void;
  recordSuccess(account: string, source: string): void;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase().slice(0, 256) || 'unknown';
}

function fingerprint(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function createLoginAttemptThrottle({
  now = Date.now,
  maxFailures = DEFAULT_MAX_FAILURES,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  onThrottle,
}: LoginAttemptThrottleOptions = {}): LoginAttemptThrottle {
  const failuresByIdentifier = new Map<string, number[]>();

  function key(scope: ThrottleScope, identifier: string) {
    return `${scope}:${normalizeIdentifier(identifier)}`;
  }

  function recentFailures(identifier: string, currentTime: number) {
    const failures = failuresByIdentifier.get(identifier) ?? [];
    const recent = failures.filter((failedAt) => failedAt > currentTime - cooldownMs);

    if (recent.length === 0) {
      failuresByIdentifier.delete(identifier);
    } else if (recent.length !== failures.length) {
      failuresByIdentifier.set(identifier, recent);
    }

    return recent;
  }

  function trimTrackedIdentifiers() {
    while (failuresByIdentifier.size > MAX_TRACKED_IDENTIFIERS) {
      const oldestKey = failuresByIdentifier.keys().next().value;
      if (oldestKey === undefined) {
        return;
      }
      failuresByIdentifier.delete(oldestKey);
    }
  }

  function isThrottled(account: string, source: string) {
    const currentTime = now();
    return [key('account', account), key('source', source)].some(
      (identifier) => recentFailures(identifier, currentTime).length >= maxFailures,
    );
  }

  function recordFailure(account: string, source: string) {
    const currentTime = now();
    const identifiers = [key('account', account), key('source', source)];

    for (const identifier of identifiers) {
      failuresByIdentifier.set(identifier, [...recentFailures(identifier, currentTime), currentTime]);
    }
    trimTrackedIdentifiers();

    if (identifiers.some((identifier) => recentFailures(identifier, currentTime).length >= maxFailures)) {
      onThrottle?.({
        event: 'login_throttled',
        accountFingerprint: fingerprint(normalizeIdentifier(account)),
        sourceFingerprint: fingerprint(normalizeIdentifier(source)),
      });
    }
  }

  return {
    isThrottled,
    recordFailure,
    // Failure records expire naturally. A success must not erase a separate abusive source's limit.
    recordSuccess() {},
  };
}

export const loginAttemptThrottle = createLoginAttemptThrottle({
  onThrottle: (event) => {
    console.warn(JSON.stringify(event));
  },
});
