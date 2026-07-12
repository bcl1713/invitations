#!/bin/sh
set -eu

# Run this as the deployment step, before restarting the application container.
# DATABASE_URL must point at the intended production database.
exec npm run prisma:migrate
