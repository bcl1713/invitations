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

## Current MVP target

- host authentication
- event creation
- guest management
- tokenized invitation links
- RSVP submission
- dashboard summary
- SMTP invitation delivery
