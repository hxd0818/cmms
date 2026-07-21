#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push --accept-data-loss

echo "Seeding initial data..."
npx tsx prisma/seed/index.ts || echo "User seed skipped"
npx tsx prisma/seed/dictionary.ts || echo "Dictionary seed skipped"

echo "Starting CMMS server..."
exec node server.js
