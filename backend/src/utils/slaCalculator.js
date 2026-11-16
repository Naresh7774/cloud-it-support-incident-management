const { pool } = require('../config/db');

// Default initial targets (in minutes) if database table is not yet initialized
const DEFAULT_SLA_TARGETS = {
  Critical: 15,
  High: 60,
  Medium: 240,
  Low: 480
};

let cachedSlaConfigs = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Fetch SLA configurations from the database with caching
 */
const getSlaTargets = async () => {
  const now = Date.now();
  if (cachedSlaConfigs && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedSlaConfigs;
  }

  try {
    const [rows] = await pool.query('SELECT priority, target_minutes FROM sla_configs');
    if (rows && rows.length > 0) {
      const configMap = {};
      for (const row of rows) {
        configMap[row.priority] = parseInt(row.target_minutes, 10);
      }
      cachedSlaConfigs = { ...DEFAULT_SLA_TARGETS, ...configMap };
      lastCacheTime = now;
      return cachedSlaConfigs;
    }
  } catch (err) {
    // Database may not be ready or in-memory test environment
  }

  return DEFAULT_SLA_TARGETS;
};

/**
 * Invalidate the in-memory SLA cache
 */
const invalidateSlaCache = () => {
  cachedSlaConfigs = null;
  lastCacheTime = 0;
};

/**
 * Calculate SLA deadline from creation time and priority
 * @param {string} priority - 'Critical', 'High', 'Medium', 'Low'
 * @param {Date|string} [baseTime=new Date()]
 * @param {Object} [customTargets=null]
 * @returns {Date} SLA deadline Date
 */
const calculateSlaDeadline = async (priority, baseTime = new Date(), customTargets = null) => {
  const targets = customTargets || (await getSlaTargets());
  const minutes = targets[priority] || DEFAULT_SLA_TARGETS[priority] || 240;
  const deadline = new Date(baseTime);
  deadline.setMinutes(deadline.getMinutes() + minutes);
  return deadline;
};

/**
 * Determine if a ticket is overdue
 * @param {Object} ticket
 * @returns {boolean}
 */
const isTicketOverdue = (ticket) => {
  if (!ticket || !ticket.sla_deadline) return false;
  if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
    return false;
  }
  const deadline = new Date(ticket.sla_deadline);
  return Date.now() > deadline.getTime();
};

/**
 * Compute time remaining until SLA breach
 * @param {Date|string} slaDeadline
 * @returns {Object} { minutesRemaining, isOverdue, formatted }
 */
const getSlaTimeRemaining = (slaDeadline) => {
  if (!slaDeadline) return { minutesRemaining: 0, isOverdue: false, formatted: 'N/A' };
  const deadline = new Date(slaDeadline);
  const diffMs = deadline.getTime() - Date.now();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= 0) {
    const overdueMins = Math.abs(diffMinutes);
    const hrs = Math.floor(overdueMins / 60);
    const mins = overdueMins % 60;
    return {
      minutesRemaining: diffMinutes,
      isOverdue: true,
      formatted: hrs > 0 ? `Overdue by ${hrs}h ${mins}m` : `Overdue by ${mins}m`
    };
  }

  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return {
    minutesRemaining: diffMinutes,
    isOverdue: false,
    formatted: hrs > 0 ? `${hrs}h ${mins}m remaining` : `${mins}m remaining`
  };
};

module.exports = {
  DEFAULT_SLA_TARGETS,
  getSlaTargets,
  invalidateSlaCache,
  calculateSlaDeadline,
  isTicketOverdue,
  getSlaTimeRemaining
};
