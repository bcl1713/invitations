# Login throttling and abuse protection design

Issue: [#15](https://github.com/bcl1713/invitations/issues/15)

## Scope

Protect the host login Server Action from online credential guessing without
adding a limiter service or modifying live configuration. The application keeps
the existing generic login error response and uses PostgreSQL, which is already
required by the application, for shared and restart-safe throttle state.

## Design

- Create one `LoginAttemptThrottle` record per SHA-256 fingerprinted identifier.
  Identifiers are normalized (trimmed, lowercased, and capped) before hashing;
  raw account names, IP addresses, and passwords are never persisted.
- Count each credential failure against both the account identifier and the
  client-source identifier. This prevents easy account rotation from one source
  and source rotation against one account.
- Allow five failed attempts in a 15-minute window. The fifth failure sets a
  15-minute block; requests are rejected before credential comparison while
  either identifier remains blocked. At the exact cooldown boundary, the request
  may proceed.
- Store the record in PostgreSQL and serialize increment/read-modify-write work
  with sorted transaction-scoped advisory locks. This prevents concurrent
  requests on different application instances from losing increments or
  deadlocking on an account/source pair.
- Obtain `X-Forwarded-For` only when a trusted reverse proxy supplies a valid
  `X-Login-Proxy-Secret`. Otherwise use the shared `unknown` source identifier,
  rather than trusting client-controllable forwarding headers. The proxy must
  strip client-supplied copies of both headers and set them itself.
- On successful authentication, clear the account-only record. Never clear the
  source record: a successful account login must not reset another account's
  abusive-source protection.
- Return the existing `/login?error=1` generic error for invalid and throttled
  attempts. Do not expose whether a limit, account, or password caused failure.
- Emit telemetry only when a record becomes throttled. Never log an email,
  source address, identifier fingerprint, password, or configured secret.

## Persistence and configuration

- Add the `LoginAttemptThrottle` Prisma model and migration. Deploy it with
  `npm run prisma:migrate` before starting an application version that uses this
  feature.
- Add optional `LOGIN_TRUSTED_PROXY_SECRET` validation and document the reverse
  proxy header-stripping prerequisite. No default live configuration change is
  required; unset configuration deliberately falls back to the shared `unknown`
  source.
- Expired rows are deleted during failure recording. Index `blockedUntil` and
  `expiresAt` for blocked lookup and cleanup.

## Acceptance criteria

1. Five failures for either an account or source cause subsequent login attempts
   to be rejected for 15 minutes; the cooldown boundary is tested.
2. A throttled request does not compare credentials or increment a counter.
3. Failed attempts from rotating accounts at one source and rotating sources for
   one account are both protected.
4. A valid login clears only its account state and cannot bypass an unrelated
   source block.
5. Untrusted forwarded headers cannot choose the client-source key.
6. Throttle records and telemetry contain no raw account, source, password, or
   secret values.
7. PostgreSQL integration coverage proves concurrent failures are serialized.
8. Unit tests cover login-action integration, count/boundary/reset semantics,
   source trust, and safe telemetry; CI applies the migration before tests.
