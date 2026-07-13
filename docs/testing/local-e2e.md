# Local E2E smoke verification

The Playwright smoke suite is intentionally not run by GitHub CI. It mutates a
real PostgreSQL database, uploads local files, and reads an invitation token from
the dedicated smoke database. Run it only against the disposable local smoke
stack; never point these commands at a shared or production database.

## Prerequisites

- Node.js 22 or newer and dependencies installed with `npm ci`.
- Docker and Docker Compose.
- A local smoke environment file maintained outside this repository. It contains
  the database, application, SMTP, and upload settings and must not be committed
  or copied into this repository.
- A local-only host account whose `ADMIN_EMAIL` and `ADMIN_PASSWORD` match the
  credentials used by `tests/e2e/local-smoke.spec.ts`. Never reuse a production
  account or place the credentials in this runbook.
- Playwright Chromium installed:

  ```sh
  npx playwright install --with-deps chromium
  ```

The commands below use the existing `invitations-smoke` Compose project and its
private Docker network. Substitute the location of your own managed smoke
configuration if it differs.

## Prepare the isolated smoke database

From the local stack configuration directory, start only the disposable database
service. The smoke environment must also name a local-only SMTP sink for the
invite-send assertion; do not use a real SMTP account.

```sh
INVITATIONS_IMAGE=unused docker compose -p invitations-smoke --env-file .env.local-smoke up -d db
```

`INVITATIONS_IMAGE=unused` only satisfies Compose interpolation for the app
service; the command starts neither that service nor a registry image.

In a shell at this repository root, load that managed local environment without
printing it, resolve the smoke database container address, construct a host-side
database URL, and apply all committed Prisma migrations. This leaves secrets in
the shell environment only; it does not put them in the runbook or terminal
output. The `APP_URL` in the smoke environment must be
`http://127.0.0.1:3300`.

```sh
set -a
. /path/to/invitations/.env.local-smoke
set +a
export SMOKE_DB_HOST="$(docker inspect invitations-smoke-db-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')"
export DATABASE_URL="$(node -e 'const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, SMOKE_DB_HOST } = process.env; process.stdout.write(`postgresql://${encodeURIComponent(POSTGRES_USER)}:${encodeURIComponent(POSTGRES_PASSWORD)}@${SMOKE_DB_HOST}:5432/${encodeURIComponent(POSTGRES_DB)}`)')"
test "$APP_URL" = 'http://127.0.0.1:3300'
npm run prisma:migrate
```

`invitations-smoke-db-1` is the Compose-generated container name for the default
smoke project. If your project name differs, use its database container name in
the `docker inspect` command. Do not expose the database or reuse production
credentials merely to run E2E.

## Run the application and smoke spec

Keep the prepared environment exported in the first shell and start the local app
on port 3300. Playwright's smoke spec intentionally targets this port.

```sh
PORT=3300 npm run dev
```

`allowedDevOrigins` includes `127.0.0.1` so that Next.js development client
resources can hydrate when the smoke spec uses its required loopback URL.

In a second shell, confirm the local app is ready before executing only the smoke
spec:

```sh
curl --fail http://127.0.0.1:3300/api/health
npm run test:e2e -- --timeout=60000 tests/e2e/local-smoke.spec.ts
```

The suite creates and changes smoke data, sends mail only to the local mail
service, and writes test uploads to the smoke environment's configured upload
path. Stop the local app when it finishes; the disposable stack can remain for
subsequent smoke runs. The Compose configuration uses a host-backed
`POSTGRES_DATA_PATH`, so `docker compose down` stops the stack but does not erase
the smoke database or uploads. Delete those paths only after confirming that they
are the isolated smoke paths from `.env.local-smoke`; never apply cleanup commands
to a shared or production stack.
