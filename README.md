# invitations

Self-hosted invitation and RSVP platform for private events.

## Core principles

- KISS-first narrow monolith
- SOLID service boundaries
- strict TDD
- semantic-release from `main`
- GHCR publication for production images

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`

## Environment

Copy `.env.example` to `.env` and adjust values.

## Deployment database migrations

Before rolling out an image that includes a Prisma schema change, apply the
database migrations with `npm run prisma:migrate`. Run that deployment step
against the intended production database **before** restarting the application
container. The application startup command does not run migrations implicitly.

See [the production database migration runbook](docs/operations/database-migrations.md)
for the full deployment sequence and guidance for existing databases.

## Login throttling

Host login failures are throttled across both account and client-source identifiers
(five failures in fifteen minutes blocks further attempts for fifteen minutes).
Throttle state is stored in PostgreSQL, so it is shared across application
instances and survives restarts. Apply the included Prisma migration before
deploying this change.

The application ignores forwarded headers unless `LOGIN_TRUSTED_PROXY_SECRET` is
configured and a reverse proxy injects that value in `X-Login-Proxy-Secret` after
removing any client-supplied copy. The proxy must also remove client-supplied
`X-Forwarded-For` and set it from the actual peer address. With no trusted proxy
secret, all requests use the conservative shared `unknown` source key rather than
accepting attacker-controlled headers. Throttle telemetry records only that a
throttle occurred; it contains no identifiers, credentials, or secrets.

## Current MVP target

- host authentication
- event creation
- guest management
- tokenized invitation links
- RSVP submission
- dashboard summary
- SMTP invitation delivery
