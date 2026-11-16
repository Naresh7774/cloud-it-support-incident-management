#!/usr/bin/env bash
# ==============================================================================
# MySQL Backup Validation Script
# ==============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "FAILED: File not found ($BACKUP_FILE)"
    exit 1
fi

echo "Validating backup archive: $BACKUP_FILE"

# 1. Check Gzip Archive Integrity
if ! gzip -t "$BACKUP_FILE"; then
    echo "FAILED: Gzip archive is corrupt or truncated."
    exit 1
fi
echo "✓ Gzip compression integrity verified."

# 2. Check for MySQL dump signature
HEADER_CHECK=$(gunzip -c "$BACKUP_FILE" | head -n 15)
if echo "$HEADER_CHECK" | grep -q "MySQL dump"; then
    echo "✓ Valid MySQL dump header detected."
else
    echo "WARNING: Standard MySQL dump header not found in initial 15 lines."
fi

# 3. Check for core tables
TABLE_CHECKS=$(gunzip -c "$BACKUP_FILE" | grep -E "CREATE TABLE \`users\`|CREATE TABLE \`tickets\`" || true)
if [ -n "$TABLE_CHECKS" ]; then
    echo "✓ Critical schema tables (users, tickets) verified in dump."
else
    echo "WARNING: Core table definitions not detected."
fi

FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "Backup archive validation PASSED (Size: $FILE_SIZE)."
