# MySQL Database Backup, Restoration & Disaster Recovery

## 1. Backup Strategy Overview

To safeguard incident records, audit logs, and user credentials against catastrophic hardware failure or accidental corruption, the Cloud IT Support platform includes automated, non-blocking backup mechanisms.

| Attribute | Specification |
| :--- | :--- |
| **Backup Engine** | `mysqldump` with `--single-transaction` and `--quick` (Zero table locks) |
| **Compression** | Gzip Level 9 (`.sql.gz`) |
| **Default Destination** | `/home/ubuntu/backups/mysql/` |
| **Naming Format** | `incident_backup_YYYYMMDD_HHMMSS.sql.gz` |
| **Default Retention** | 7 Days (configurable via `RETENTION_DAYS`) |
| **Execution Frequency** | Nightly at 02:00 UTC via Linux cron |

---

## 2. Automated Scheduled Backups (Cron)

The EC2 initialization script (`scripts/setup-ec2.sh`) installs an automated cron job under the `ubuntu` user:

```bash
# Verify existing cron schedule
crontab -l
```

Output:
```cron
0 2 * * * /bin/bash /home/ubuntu/app/scripts/backup.sh >> /home/ubuntu/backups/backup.log 2>&1
```

### Manual Backup Execution:
To take an on-demand snapshot (e.g. prior to an application upgrade):
```bash
bash ~/app/scripts/backup.sh
```

Sample output:
```
====================================================================
 Starting Database Backup: 2026-01-01 12:00:00 UTC
 Target Database: incident_management
 Destination: /home/ubuntu/backups/mysql/incident_backup_20260101_120000.sql.gz
====================================================================
Dumping database schema and table data...
Backup created successfully! File size: 48K
Applying retention policy (retaining last 7 days)...
Backup process completed successfully.
```

---

## 3. Backup Validation Procedure

Before trusting any backup archive, its integrity can be mathematically verified:

```bash
bash ~/app/scripts/validate-backup.sh ~/backups/mysql/incident_backup_20260101_120000.sql.gz
```

Validation steps performed:
1. `gzip -t`: Validates compressed archive integrity and checksum.
2. Header inspection: Verifies valid MySQL dump headers.
3. Schema inspection: Verifies critical table definitions (`users`, `tickets`, `ticket_history`) are intact.

---

## 4. Disaster Recovery & Restoration Procedure

In the event of database corruption or unintended record deletion:

1. Locate the desired backup snapshot:
   ```bash
   ls -lht ~/backups/mysql/
   ```

2. Validate the snapshot archive:
   ```bash
   bash ~/app/scripts/validate-backup.sh ~/backups/mysql/<SNAPSHOT_NAME>.sql.gz
   ```

3. Execute the restoration script:
   ```bash
   bash ~/app/scripts/restore.sh ~/backups/mysql/<SNAPSHOT_NAME>.sql.gz
   ```

4. Verify database row counts:
   The restore script automatically outputs the restored count of users and tickets to verify restoration integrity.

5. Test the application health check:
   ```bash
   curl http://localhost/health
   ```

---

## 5. Volume Persistence Guarantee

During routine continuous delivery deployments with `scripts/deploy.sh` or `docker compose up -d`:
- The MySQL database container references the external named Docker volume `mysql_data`.
- Named volumes are **never** recreated or erased by `docker compose up` or `docker compose pull`.
- Database files in `/var/lib/mysql` persist continuously across image upgrades, container restarts, and host reboots.
