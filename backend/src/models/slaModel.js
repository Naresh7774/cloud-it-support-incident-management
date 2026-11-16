const { pool } = require('../config/db');

const slaModel = {
  async getAll() {
    const [rows] = await pool.execute(
      'SELECT id, priority, target_minutes, description, updated_at FROM sla_configs ORDER BY FIELD(priority, "Critical", "High", "Medium", "Low")'
    );
    return rows;
  },

  async findByPriority(priority) {
    const [rows] = await pool.execute(
      'SELECT id, priority, target_minutes, description, updated_at FROM sla_configs WHERE priority = ?',
      [priority]
    );
    return rows[0] || null;
  },

  async update(priority, targetMinutes, description = null) {
    const [result] = await pool.execute(
      `INSERT INTO sla_configs (priority, target_minutes, description, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE target_minutes = VALUES(target_minutes), description = COALESCE(VALUES(description), description), updated_at = NOW()`,
      [priority, targetMinutes, description]
    );
    return result.affectedRows > 0;
  },

  async seedDefaults() {
    const defaults = [
      { priority: 'Critical', minutes: 15, desc: 'Critical outages or security breaches - 15 minutes' },
      { priority: 'High', minutes: 60, desc: 'High business impact or severe degradation - 1 hour' },
      { priority: 'Medium', minutes: 240, desc: 'Moderate operational impact - 4 hours' },
      { priority: 'Low', minutes: 480, desc: 'Minor requests, inquiries or cosmetic issues - 8 hours' }
    ];

    for (const d of defaults) {
      await pool.execute(
        `INSERT IGNORE INTO sla_configs (priority, target_minutes, description) VALUES (?, ?, ?)`,
        [d.priority, d.minutes, d.desc]
      );
    }
  }
};

module.exports = slaModel;
