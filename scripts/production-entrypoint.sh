#!/bin/sh
set -eu

npm run prisma:migrate
exec npm run start
