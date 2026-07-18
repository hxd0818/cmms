#!/usr/bin/env bash
#
# Restore the CMMS PostgreSQL database from a gzipped SQL dump.
#
# Usage:
#   ./scripts/restore.sh ./backups/cmms_20260718_120000.sql.gz
#
# WARNING:
#   This overwrites ALL existing data in the target database.
#   Stop the web and worker processes before running restore in production.

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <backup_file.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "[restore] file not found: $BACKUP_FILE" >&2
  exit 1
fi

CONTAINER_NAME="${CMMS_POSTGRES_CONTAINER:-cmms-postgres}"
DB_USER="${CMMS_DB_USER:-cmms}"
DB_NAME="${CMMS_DB_NAME:-cmms}"

echo "[restore] restoring $BACKUP_FILE into $DB_NAME (container: $CONTAINER_NAME) ..."
echo "[restore] WARNING: this will overwrite all existing data. Press Ctrl+C to cancel."
read -r -p "Proceed? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "[restore] aborted by user"
  exit 0
fi

gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"

echo "[restore] done"
