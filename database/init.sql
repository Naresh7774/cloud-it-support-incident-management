-- Cloud IT Support & Incident Management System
-- Initial Docker Database Setup Script

CREATE DATABASE IF NOT EXISTS `incident_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `incident_management`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'engineer', 'admin') NOT NULL DEFAULT 'user',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SLA Configurations Table
CREATE TABLE IF NOT EXISTS `sla_configs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `priority` ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL UNIQUE,
    `target_minutes` INT NOT NULL,
    `description` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tickets Table
CREATE TABLE IF NOT EXISTS `tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_number` VARCHAR(32) NOT NULL UNIQUE,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(60) NOT NULL,
    `priority` ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
    `status` ENUM('Open', 'Assigned', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
    `created_by` INT NOT NULL,
    `assigned_to` INT DEFAULT NULL,
    `sla_deadline` DATETIME NOT NULL,
    `is_overdue` BOOLEAN DEFAULT FALSE,
    `resolution_notes` TEXT DEFAULT NULL,
    `resolved_at` DATETIME DEFAULT NULL,
    `closed_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_tickets_ticket_number` (`ticket_number`),
    INDEX `idx_tickets_status` (`status`),
    INDEX `idx_tickets_priority` (`priority`),
    INDEX `idx_tickets_created_by` (`created_by`),
    INDEX `idx_tickets_assigned_to` (`assigned_to`),
    INDEX `idx_tickets_sla_deadline` (`sla_deadline`),
    INDEX `idx_tickets_is_overdue` (`is_overdue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Ticket Comments Table
CREATE TABLE IF NOT EXISTS `ticket_comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `comment` TEXT NOT NULL,
    `is_internal` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_comments_ticket_id` (`ticket_id`),
    INDEX `idx_comments_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Ticket Activity History / Audit Log Table
CREATE TABLE IF NOT EXISTS `ticket_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `old_value` VARCHAR(255) DEFAULT NULL,
    `new_value` VARCHAR(255) DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_history_ticket_id` (`ticket_id`),
    INDEX `idx_history_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Initial SLA Policies
INSERT INTO `sla_configs` (`priority`, `target_minutes`, `description`)
VALUES
    ('Critical', 15, 'Critical outages or security breaches - 15 minutes response SLA'),
    ('High', 60, 'High business impact or severe degradation - 1 hour response SLA'),
    ('Medium', 240, 'Moderate operational impact - 4 hours response SLA'),
    ('Low', 480, 'Minor requests, inquiries or cosmetic issues - 8 hours response SLA')
ON DUPLICATE KEY UPDATE 
    `target_minutes` = VALUES(`target_minutes`),
    `description` = VALUES(`description`);

-- Seed Default Accounts:
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
