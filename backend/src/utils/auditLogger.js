const { pool } = require('../config/db');
const { logEvent } = require('./cloudwatchLogger');

/**
 * Record an audit log entry in the ticket_history table and forward to CloudWatch
 * @param {Object} params
 * @param {number} params.ticketId
 * @param {number} params.userId
 * @param {string} params.action - e.g. CREATED, STATUS_CHANGED, ASSIGNED, PRIORITY_CHANGED, RESOLVED, COMMENT_ADDED
 * @param {string|null} [params.oldValue=null]
 * @param {string|null} [params.newValue=null]
 * @param {string|null} [params.notes=null]
 * @param {Object} [params.connection=null] - Optional transaction connection
 */
const recordHistory = async ({
  ticketId,
  userId,
  action,
  oldValue = null,
  newValue = null,
  notes = null,
  connection = null
}) => {
  const query = `
    INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
  `;
  const values = [ticketId, userId, action, oldValue, newValue, notes];

  try {
    const executor = connection || pool;
    await executor.execute(query, values);

    // Forward structured event to CloudWatch / Application log
    logEvent(action, {
      ticketId,
      userId,
      oldValue,
      newValue,
      notes
    });
  } catch (err) {
    console.error('Failed to record ticket history:', err.message);
  }
};

module.exports = {
  recordHistory
};
