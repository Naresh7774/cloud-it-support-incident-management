#!/usr/bin/env bash
# ==============================================================================
# MySQL Automated Backup Script for Cloud Incident Management
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/mysql}"
CONTAINER_NAME="${CONTAINER_NAME:-incident_mysql}"
DB_NAME="${DB_NAME:-incident_management}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_secure_password_2026}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/incident_backup_${TIMESTAMP}.sql.gz"

echo "===================================================================="
echo " Starting Database Backup: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo " Target Database: $DB_NAME"
echo " Destination: $BACKUP_FILE"
echo "===================================================================="

# Check if MySQL container is active
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Target MySQL container '$CONTAINER_NAME' is not currently running."
    exit 1
fi

# Execute mysqldump inside container and compress output on host
echo "Dumping database schema and table data..."
docker exec "$CONTAINER_NAME" mysqldump \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

# Validate backup file existence and minimum size
if [ ! -s "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file was created but is empty (0 bytes)."
    rm -f "$BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "Backup created successfully! File size: $BACKUP_SIZE"

# Apply Retention Policy: Remove backups older than RETENTION_DAYS
echo "Applying retention policy (retaining last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -name "incident_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm -v {} \;

echo "Backup process completed successfully."
