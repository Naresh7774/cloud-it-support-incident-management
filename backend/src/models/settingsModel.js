const { pool } = require('../config/db');

const settingsModel = {
  async getAll() {
    const [rows] = await pool.execute(
      'SELECT id, setting_key, setting_value, category, description, updated_at FROM system_settings ORDER BY category, setting_key'
    );
    // Convert to map as well
    const map = {};
    for (const r of rows) {
      map[r.setting_key] = r.setting_value;
    }
    return { list: rows, map };
  },

  async update(key, value) {
    const [result] = await pool.execute(
      'UPDATE system_settings SET setting_value = ?, updated_at = UTC_TIMESTAMP() WHERE setting_key = ?',
      [String(value), key]
    );
    return result.affectedRows > 0;
  },

  async bulkUpdate(settingsObj) {
    for (const [key, val] of Object.entries(settingsObj)) {
      await pool.execute(
        `INSERT INTO system_settings (setting_key, setting_value, updated_at) 
         VALUES (?, ?, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = UTC_TIMESTAMP()`,
        [key, String(val)]
      );
    }
    return true;
  }
};

module.exports = settingsModel;
