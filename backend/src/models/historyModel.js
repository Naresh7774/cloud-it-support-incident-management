const { pool } = require('../config/db');

const historyModel = {
  async findByTicketId(ticketId) {
    const query = `
      SELECT h.id, h.ticket_id, h.user_id, h.action, h.old_value, h.new_value, h.notes, h.created_at,
             u.name as actor_name, u.email as actor_email, u.role as actor_role
      FROM ticket_history h
      JOIN users u ON h.user_id = u.id
      WHERE h.ticket_id = ?
      ORDER BY h.created_at ASC
    `;
    const [rows] = await pool.execute(query, [ticketId]);
    return rows;
  }
};

module.exports = historyModel;
