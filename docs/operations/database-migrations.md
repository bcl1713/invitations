# Production database migrations

The application image does not mutate the database during startup. It starts only with `npm run start`.

## Deployment sequence

1. Build and publish the image.
2. Ensure `DATABASE_URL` points at the intended production database.
3. Run the migration step against the production image, before restarting the app:

   ```sh
   docker run --rm \
     --env-file /path/to/production.env \
     IMAGE_TAG \
     npm run prisma:migrate
   ```

   The equivalent repository helper is `scripts/migrate-production.sh`.
4. Redeploy/restart the application container.
5. Verify `/api/health` and the login route.

`prisma migrate deploy` is safe to repeat: it applies only migrations that are not recorded in `_prisma_migrations`.

## Existing databases created with `prisma db push`

This repository now contains a baseline migration representing the current schema. An existing database that was created by `prisma db push` has no migration history, so it must be baselined once before ordinary deployment migrations can run:

```sh
npx prisma migrate resolve --applied 20260712000000_initial
```

Run that command only after inspecting the target database and confirming that its schema matches `prisma/schema.prisma`. Do not use it to conceal a drifted or partially migrated database. After the baseline is recorded, future schema changes must be committed as new migrations and applied with `npm run prisma:migrate`.

## Failed migrations and rollback

A failed migration stops the deployment; the application should not be restarted against an unknown schema state. Inspect the migration error and database state, correct the migration or database issue, then rerun `npm run prisma:migrate`. Do not edit an already-applied migration. For destructive changes, use a new forward migration and take a database backup before deployment. Application rollback does not automatically roll back database changes.
