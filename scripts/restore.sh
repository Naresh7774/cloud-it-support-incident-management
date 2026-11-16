#!/usr/bin/env bash
# ==============================================================================
# MySQL Database Restoration Script for Cloud Incident Management
# ==============================================================================
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-incident_mysql}"
DB_NAME="${DB_NAME:-incident_management}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_secure_password_2026}"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    echo "Example: $0 ~/backups/mysql/incident_backup_20260101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file '$BACKUP_FILE' does not exist."
    exit 1
fi

echo "===================================================================="
echo " Database Restoration Request"
echo " Target Container: $CONTAINER_NAME"
echo " Target Database:  $DB_NAME"
echo " Source Archive:   $BACKUP_FILE"
echo "===================================================================="

# Check if MySQL container is active
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Target MySQL container '$CONTAINER_NAME' is not running."
    exit 1
fi

# Decompress and stream SQL dump into container
echo "Restoring database from backup archive..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "$DB_NAME"

echo "Restoration command completed. Validating record counts..."
USER_COUNT=$(docker exec -i "$CONTAINER_NAME" mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT COUNT(*) FROM users;" "$DB_NAME" -N -s)
TICKET_COUNT=$(docker exec -i "$CONTAINER_NAME" mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT COUNT(*) FROM tickets;" "$DB_NAME" -N -s)

echo "Verification summary:"
echo " - Users restored:   $USER_COUNT"
echo " - Tickets restored: $TICKET_COUNT"
echo "===================================================================="
echo " Database restoration completed successfully!"
echo "===================================================================="
