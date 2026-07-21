#!/bin/sh
set -e

# Fix volume permissions (named volumes mount as root)
mkdir -p /app/tmp/uploads
chown -R nextjs:nodejs /app/tmp 2>/dev/null || true

echo "Running database schema sync..."
./node_modules/.bin/prisma db push --accept-data-loss

echo "Seeding users..."
./node_modules/.bin/tsx prisma/seed/index.ts || echo "  User seed skipped"

echo "Seeding dictionary..."
./node_modules/.bin/tsx prisma/seed/dictionary.ts || echo "  Dictionary seed skipped"

echo "Starting CMMS server..."
exec node server.js
