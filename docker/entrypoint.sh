#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding initial data..."
npx tsx prisma/seed/index.ts || echo "Seed skipped (may already exist)"

echo "Starting CMMS server..."
exec node server.js
