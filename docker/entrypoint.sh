#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding initial data..."
node -e "
const { execSync } = require('child_process');
try {
  execSync('npx tsx prisma/seed/index.ts', { stdio: 'inherit' });
} catch (e) {
  console.log('Seed already exists, skipping');
}
"

echo "Starting CMMS server..."
exec node server.js
