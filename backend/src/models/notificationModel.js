const { pool } = require('../config/db');

const notificationModel = {
  async findByUserId(userId, onlyUnread = false) {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (onlyUnread) {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async countUnread(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return rows[0]?.unread_count || 0;
  },

  async markAsRead(id, userId) {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async markAllAsRead(userId) {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  },

  async create({ userId, title, message, type = 'info', link = null }) {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, UTC_TIMESTAMP())`,
      [userId, title, message, type, link]
    );
    return {
      id: result.insertId,
      user_id: userId,
      title,
      message,
      type,
      link,
      is_read: 0,
      created_at: new Date()
    };
  },

  async delete(id, userId) {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = notificationModel;
