# Production database migrations

The production container runs `npm run prisma:migrate` before it starts Next.js.
The Next.js application command itself remains `npm run start`; schema changes
are performed by the container deployment entrypoint before the app accepts
traffic.

## Deployment sequence

1. Build and publish the image.
2. In Portainer, update the stack to the intended image tag and verify that its
   `DATABASE_URL` targets the intended production database.
3. Redeploy the stack. Before the application container starts, its deployment
   entrypoint runs `prisma migrate deploy` from the image's committed
   `prisma/migrations` directory.
4. If the migration command fails, the entrypoint exits non-zero and Next.js
   does not start. Treat the deployment as failed; do not route traffic to the
   new container.
5. After a successful migration and application start, verify `/api/health` and
   the login route.

`prisma migrate deploy` is safe to repeat: it applies only migrations that are not recorded in `_prisma_migrations`.

## Existing databases created with `prisma db push`

This repository now contains a baseline migration representing the current schema. An existing database that was created by `prisma db push` has no migration history, so it must be baselined once before ordinary deployment migrations can run:

```sh
npx prisma migrate resolve --applied 20260712000000_initial
```

Run that command only after inspecting the target database and confirming that its schema matches `prisma/schema.prisma`. Do not use it to conceal a drifted or partially migrated database. After the baseline is recorded, future schema changes must be committed as new migrations and applied with `npm run prisma:migrate`.

## Failed migrations and rollback

A failed migration stops the new container before Next.js starts. Inspect the
migration error and database state, correct the migration or database issue,
then redeploy the intended image. Do not edit an already-applied migration. For
destructive changes, use a new forward migration and take a database backup
before deployment. Application rollback does not automatically roll back
database changes.

## Deployment verification

For every fresh database or image containing a new migration, verify the
Portainer deployment log shows a successful `prisma migrate deploy` before the
application start log. Then confirm `/api/health` and host login work against
the new container. The deployment entrypoint contract is covered by unit tests:
it starts Next.js only after migration succeeds and exits without starting it
when migration fails.
