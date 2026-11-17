const { pool } = require('../config/db');

const commentModel = {
  async create({ ticketId, userId, comment, isInternal = false }) {
    const [result] = await pool.execute(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal, created_at)
       VALUES (?, ?, ?, ?, UTC_TIMESTAMP())`,
      [ticketId, userId, comment, isInternal ? 1 : 0]
    );

    return {
      id: result.insertId,
      ticket_id: ticketId,
      user_id: userId,
      comment,
      is_internal: isInternal,
      created_at: new Date()
    };
  },

  async findByTicketId(ticketId, includeInternal = true) {
    let query = `
      SELECT c.id, c.ticket_id, c.user_id, c.comment, c.is_internal, c.created_at,
             u.name as author_name, u.email as author_email, u.role as author_role
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
    `;
    const params = [ticketId];

    if (!includeInternal) {
      query += ' AND c.is_internal = 0';
    }

    query += ' ORDER BY c.created_at ASC';

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM ticket_comments WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM ticket_comments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = commentModel;
