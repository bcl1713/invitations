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

## Current MVP target

- host authentication
- event creation
- guest management
- tokenized invitation links
- RSVP submission
- dashboard summary
- SMTP invitation delivery
