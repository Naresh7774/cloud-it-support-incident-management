-- Seed Initial Data for Cloud IT Support & Incident Management System

USE `incident_management`;

-- 1. Seed Configurable SLA Policies
INSERT INTO `sla_configs` (`priority`, `target_minutes`, `description`)
VALUES
    ('Critical', 15, 'Critical outages or security breaches - 15 minutes response SLA'),
    ('High', 60, 'High business impact or severe degradation - 1 hour response SLA'),
    ('Medium', 240, 'Moderate operational impact - 4 hours response SLA'),
    ('Low', 480, 'Minor requests, inquiries or cosmetic issues - 8 hours response SLA')
ON DUPLICATE KEY UPDATE 
    `target_minutes` = VALUES(`target_minutes`),
    `description` = VALUES(`description`);

-- 2. Seed Default Administrative, Engineer, and End-User Accounts
-- Default Passwords:
-- Admin: Admin@123
-- Engineer: Engineer@123
-- User: User@123
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`)
VALUES
    (1, 'System Administrator', 'admin@cloudsupport.local', '$2b$10$brYL/lGWNVnV33QVMuA8LexPtq1n6OEevyf/SFdeVCNDeZLIQ0fz.', 'admin'),
    (2, 'Sarah Cloud Engineer', 'engineer@cloudsupport.local', '$2b$10$uPBp0KC/hHPUW6q57EHNSeThN6cc8GPecZRF9rasp1VyCvyT4DU4O', 'engineer'),
    (3, 'John Doe EndUser', 'user@cloudsupport.local', '$2b$10$fiS.w8DS8L7rAeHe0bceIu9WEQ5vP6ladK22QbXprhdelPRWsUJGe', 'user')
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`),
    `role` = VALUES(`role`);

-- 3. Seed Realistic Sample Incidents
INSERT INTO `tickets` (`id`, `ticket_number`, `title`, `description`, `category`, `priority`, `status`, `created_by`, `assigned_to`, `sla_deadline`, `is_overdue`, `resolution_notes`, `resolved_at`, `created_at`)
VALUES
    (1, 'INC-2026-0001', 'Production API Gateway 502 Bad Gateway Spike', 'High latency and 502 HTTP errors detected on primary API Gateway endpoint in us-east-1.', 'Cloud/Infrastructure', 'Critical', 'Open', 3, NULL, DATE_SUB(NOW(), INTERVAL 15 MINUTE), 1, NULL, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
    (2, 'INC-2026-0002', 'VPN Access Failure for Remote Engineering Team', 'Engineers are unable to authenticate via OpenVPN gateway. LDAP handshake timing out.', 'Network', 'High', 'In Progress', 3, 2, DATE_ADD(NOW(), INTERVAL 45 MINUTE), 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
    (3, 'INC-2026-0003', 'Database Read Replica Latency Alerts', 'Read queries hitting replica experienced 800ms replication lag during peak batch job.', 'Database', 'Medium', 'Resolved', 3, 2, DATE_SUB(NOW(), INTERVAL 1 HOUR), 0, 'Cleaned up stuck query locks and scaled Aurora provisioned IOPS.', NOW(), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    (4, 'INC-2026-0004', 'Request for Staging S3 Bucket Access', 'Developer requesting read/write access to test-artifacts bucket for CI pipeline.', 'Software', 'Low', 'Open', 3, NULL, DATE_ADD(NOW(), INTERVAL 7 HOUR), 0, NULL, NULL, NOW())
ON DUPLICATE KEY UPDATE `ticket_number` = VALUES(`ticket_number`);

-- 4. Seed Comments
INSERT INTO `ticket_comments` (`ticket_id`, `user_id`, `comment`, `is_internal`, `created_at`)
VALUES
    (1, 3, 'Users are reporting continuous errors when attempting to complete checkouts.', 0, DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
    (2, 2, 'Investigating Active Directory sync logs on the authentication server.', 1, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
    (2, 2, 'Restarted radius service. Requesting user re-test.', 0, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
    (3, 2, 'Aurora replica lag has stabilized below 15ms. Marking incident resolved.', 0, NOW())
ON DUPLICATE KEY UPDATE `comment` = VALUES(`comment`);

-- 5. Seed Activity History
INSERT INTO `ticket_history` (`ticket_id`, `user_id`, `action`, `old_value`, `new_value`, `notes`, `created_at`)
VALUES
    (1, 3, 'CREATED', NULL, 'Priority: Critical', 'Ticket created by John Doe EndUser', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
    (2, 3, 'CREATED', NULL, 'Priority: High', 'Ticket created by John Doe EndUser', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
    (2, 2, 'ASSIGNED', 'Unassigned', 'Sarah Cloud Engineer', 'Self-assigned by Sarah Cloud Engineer', DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
    (2, 2, 'STATUS_CHANGED', 'Open', 'In Progress', 'Status updated to In Progress', DATE_SUB(NOW(), INTERVAL 11 MINUTE)),
    (3, 3, 'CREATED', NULL, 'Priority: Medium', 'Ticket created by John Doe EndUser', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    (3, 2, 'ASSIGNED', 'Unassigned', 'Sarah Cloud Engineer', 'Assigned by Administrator', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (3, 2, 'STATUS_CHANGED', 'In Progress', 'Resolved', 'Resolution Notes: Cleaned up stuck query locks and scaled Aurora provisioned IOPS.', NOW())
ON DUPLICATE KEY UPDATE `action` = VALUES(`action`);
