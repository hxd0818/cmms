#!/usr/bin/env bash
#
# Backup the CMMS PostgreSQL database to a gzipped SQL dump.
#
# Usage:
#   ./scripts/backup.sh
#
# Output:
#   ./backups/cmms_YYYYMMDD_HHMMSS.sql.gz
#
# Retention:
#   Keeps the most recent 7 backup files; older ones are pruned.
#
# Requires:
#   - Docker daemon running
#   - cmms-postgres container running (docker compose -f docker/docker-compose.yml up -d)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/cmms_${TIMESTAMP}.sql.gz"

CONTAINER_NAME="${CMMS_POSTGRES_CONTAINER:-cmms-postgres}"
DB_USER="${CMMS_DB_USER:-cmms}"
DB_NAME="${CMMS_DB_NAME:-cmms}"

mkdir -p "$BACKUP_DIR"

echo "[backup] dumping $DB_NAME from container $CONTAINER_NAME ..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[backup] saved to $BACKUP_FILE"

# Keep only the last 7 backups (newest first).
ls -t "$BACKUP_DIR"/cmms_*.sql.gz 2>/dev/null | tail -n +8 | while read -r stale; do
  echo "[backup] pruning old backup: $stale"
  rm -f "$stale"
done

echo "[backup] done"
