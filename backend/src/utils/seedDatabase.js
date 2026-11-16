const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const logger = require('../config/logger');

const seed = async () => {
  logger.info('Starting database seeding...');

  try {
    // 1. Ensure tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('user', 'engineer', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sla_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        priority ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL UNIQUE,
        target_minutes INT NOT NULL,
        description VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_number VARCHAR(32) NOT NULL UNIQUE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(60) NOT NULL,
        priority ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
        status ENUM('Open', 'Assigned', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
        created_by INT NOT NULL,
        assigned_to INT DEFAULT NULL,
        sla_deadline DATETIME NOT NULL,
        is_overdue BOOLEAN DEFAULT FALSE,
        resolution_notes TEXT DEFAULT NULL,
        resolved_at DATETIME DEFAULT NULL,
        closed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_tickets_ticket_number (ticket_number),
        INDEX idx_tickets_status (status),
        INDEX idx_tickets_priority (priority),
        INDEX idx_tickets_created_by (created_by),
        INDEX idx_tickets_assigned_to (assigned_to),
        INDEX idx_tickets_sla_deadline (sla_deadline),
        INDEX idx_tickets_is_overdue (is_overdue)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_comments_ticket_id (ticket_id),
        INDEX idx_comments_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id INT NOT NULL,
        action VARCHAR(60) NOT NULL,
        old_value VARCHAR(255) DEFAULT NULL,
        new_value VARCHAR(255) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_history_ticket_id (ticket_id),
        INDEX idx_history_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Seed SLA Configs
    const slaTargets = [
      { priority: 'Critical', minutes: 15, desc: 'Critical outages or security breaches - 15 minutes' },
      { priority: 'High', minutes: 60, desc: 'High business impact or severe degradation - 1 hour' },
      { priority: 'Medium', minutes: 240, desc: 'Moderate operational impact - 4 hours' },
      { priority: 'Low', minutes: 480, desc: 'Minor requests, inquiries or cosmetic issues - 8 hours' }
    ];

    for (const target of slaTargets) {
      await pool.query(
        `INSERT INTO sla_configs (priority, target_minutes, description) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE target_minutes = VALUES(target_minutes), description = VALUES(description)`,
        [target.priority, target.minutes, target.desc]
      );
    }
    logger.info('SLA configs seeded.');

    // 3. Seed Users
    const saltRounds = 10;
    const adminPassHash = await bcrypt.hash('Admin@123', saltRounds);
    const engPassHash = await bcrypt.hash('Engineer@123', saltRounds);
    const userPassHash = await bcrypt.hash('User@123', saltRounds);

    const users = [
      { name: 'Admin Administrator', email: 'admin@cloudsupport.local', hash: adminPassHash, role: 'admin' },
      { name: 'Sarah Cloud Engineer', email: 'engineer@cloudsupport.local', hash: engPassHash, role: 'engineer' },
      { name: 'John Doe EndUser', email: 'user@cloudsupport.local', hash: userPassHash, role: 'user' }
    ];

    const userMap = {};
    for (const u of users) {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role)`,
        [u.name, u.email, u.hash, u.role]
      );
      const [rows] = await pool.query('SELECT id, role FROM users WHERE email = ?', [u.email]);
      userMap[u.role] = rows[0].id;
    }
    logger.info('Default users seeded: admin, engineer, user.');

    // 4. Seed realistic initial sample incidents
    const [ticketCountRows] = await pool.query('SELECT COUNT(*) as count FROM tickets');
    if (ticketCountRows[0].count === 0) {
      const now = new Date();

      // Sample Ticket 1: Critical Production Issue (Overdue simulation)
      const overdueTime = new Date(now.getTime() - 25 * 60000); // 25 min ago
      const deadline1 = new Date(now.getTime() - 10 * 60000); // breached 10 min ago
      await pool.query(`
        INSERT INTO tickets (ticket_number, title, description, category, priority, status, created_by, assigned_to, sla_deadline, is_overdue, created_at)
        VALUES ('INC-2026-0001', 'Production API Gateway 502 Bad Gateway Spike', 'High latency and 502 HTTP errors detected on primary API Gateway endpoint.', 'Cloud/Infrastructure', 'Critical', 'Open', ?, NULL, ?, 1, ?)
      `, [userMap['user'], deadline1, overdueTime]);

      // Sample Ticket 2: High priority - Assigned to engineer, In Progress
      const deadline2 = new Date(now.getTime() + 45 * 60000); // 45 min left
      await pool.query(`
        INSERT INTO tickets (ticket_number, title, description, category, priority, status, created_by, assigned_to, sla_deadline, is_overdue, created_at)
        VALUES ('INC-2026-0002', 'VPN Access Failure for Remote Engineering Team', 'Engineers are unable to authenticate via OpenVPN gateway.', 'Network', 'High', 'In Progress', ?, ?, ?, 0, NOW())
      `, [userMap['user'], userMap['engineer'], deadline2]);

      // Sample Ticket 3: Medium priority - Resolved with notes
      const deadline3 = new Date(now.getTime() - 120 * 60000);
      await pool.query(`
        INSERT INTO tickets (ticket_number, title, description, category, priority, status, created_by, assigned_to, sla_deadline, is_overdue, resolution_notes, resolved_at, created_at)
        VALUES ('INC-2026-0003', 'Database Read Replica Latency Alerts', 'Read queries hitting replica experienced 800ms replica lag.', 'Database', 'Medium', 'Resolved', ?, ?, ?, 0, 'Cleaned up stuck query locks and scaled IOPS.', NOW(), ?)
      `, [userMap['user'], userMap['engineer'], deadline3, deadline3]);

      // Sample Ticket 4: Low priority - General Support Request
      const deadline4 = new Date(now.getTime() + 400 * 60000);
      await pool.query(`
        INSERT INTO tickets (ticket_number, title, description, category, priority, status, created_by, assigned_to, sla_deadline, is_overdue, created_at)
        VALUES ('INC-2026-0004', 'Request for New Staging S3 Bucket Access', 'Developer requesting read/write access to test-artifacts bucket.', 'Software', 'Low', 'Open', ?, NULL, ?, 0, NOW())
      `, [userMap['user'], deadline4]);

      logger.info('Sample incidents seeded.');
    }

    logger.info('Database seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error(`Database seeding failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

if (require.main === module) {
  seed();
}

module.exports = seed;
