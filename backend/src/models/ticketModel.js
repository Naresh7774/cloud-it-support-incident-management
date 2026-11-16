const { pool } = require('../config/db');

const ticketModel = {
  /**
   * Generate next sequential or unique ticket reference
   */
  async generateTicketNumber() {
    const year = new Date().getFullYear();
    const [rows] = await pool.execute(
      'SELECT id FROM tickets ORDER BY id DESC LIMIT 1'
    );
    const nextId = (rows[0]?.id || 0) + 1;
    const padded = String(nextId).padStart(4, '0');
    return `INC-${year}-${padded}`;
  },

  async create({
    ticketNumber,
    title,
    description,
    category,
    priority,
    createdBy,
    assignedTo = null,
    slaDeadline
  }) {
    const formattedDeadline = new Date(slaDeadline).toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.execute(
      `INSERT INTO tickets 
        (ticket_number, title, description, category, priority, status, created_by, assigned_to, sla_deadline, is_overdue, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [ticketNumber, title, description, category, priority, createdBy, assignedTo, formattedDeadline]
    );

    return this.findById(result.insertId);
  },

  async findById(id) {
    const query = `
      SELECT t.*,
             (t.status NOT IN ('Resolved', 'Closed') AND UTC_TIMESTAMP() > t.sla_deadline) as is_overdue_dynamic,
             creator.name as creator_name, creator.email as creator_email, creator.role as creator_role,
             assignee.name as assignee_name, assignee.email as assignee_email, assignee.role as assignee_role
      FROM tickets t
      JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ? OR t.ticket_number = ?
    `;
    const [rows] = await pool.execute(query, [id, id]);
    if (!rows[0]) return null;

    const ticket = rows[0];
    ticket.is_overdue = Boolean(ticket.is_overdue_dynamic || ticket.is_overdue);
    return ticket;
  },

  async findAll({
    createdBy,
    assignedTo,
    status,
    priority,
    category,
    search,
    isOverdue,
    unassignedOnly,
    limit = 50,
    offset = 0
  } = {}) {
    let query = `
      SELECT t.*,
             (t.status NOT IN ('Resolved', 'Closed') AND UTC_TIMESTAMP() > t.sla_deadline) as is_overdue_dynamic,
             creator.name as creator_name, creator.email as creator_email,
             assignee.name as assignee_name, assignee.email as assignee_email
      FROM tickets t
      JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE 1=1
    `;
    const params = [];

    if (createdBy) {
      query += ' AND t.created_by = ?';
      params.push(createdBy);
    }

    if (assignedTo) {
      query += ' AND t.assigned_to = ?';
      params.push(assignedTo);
    }

    if (unassignedOnly) {
      query += ' AND t.assigned_to IS NULL';
    }

    if (status) {
      if (Array.isArray(status)) {
        query += ` AND t.status IN (${status.map(() => '?').join(',')})`;
        params.push(...status);
      } else {
        query += ' AND t.status = ?';
        params.push(status);
      }
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (category) {
      query += ' AND t.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (t.ticket_number LIKE ? OR t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (isOverdue === true || isOverdue === 'true') {
      query += " AND t.status NOT IN ('Resolved', 'Closed') AND UTC_TIMESTAMP() > t.sla_deadline";
    }

    query += ' ORDER BY CASE t.priority WHEN "Critical" THEN 1 WHEN "High" THEN 2 WHEN "Medium" THEN 3 ELSE 4 END, t.created_at DESC';
    query += ` LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`;

    const [rows] = await pool.query(query, params);
    return rows.map((ticket) => ({
      ...ticket,
      is_overdue: Boolean(ticket.is_overdue_dynamic || ticket.is_overdue)
    }));
  },

  async countAll({ createdBy, assignedTo, status, priority, category, search, isOverdue, unassignedOnly } = {}) {
    let query = 'SELECT COUNT(*) as total FROM tickets t WHERE 1=1';
    const params = [];

    if (createdBy) {
      query += ' AND t.created_by = ?';
      params.push(createdBy);
    }
    if (assignedTo) {
      query += ' AND t.assigned_to = ?';
      params.push(assignedTo);
    }
    if (unassignedOnly) {
      query += ' AND t.assigned_to IS NULL';
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (category) {
      query += ' AND t.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (t.ticket_number LIKE ? OR t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (isOverdue === true || isOverdue === 'true') {
      query += " AND t.status NOT IN ('Resolved', 'Closed') AND UTC_TIMESTAMP() > t.sla_deadline";
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  },

  async updateStatus(id, { status, resolutionNotes = null, resolvedAt = null, closedAt = null }) {
    let query = 'UPDATE tickets SET status = ?, updated_at = UTC_TIMESTAMP()';
    const params = [status];

    if (resolutionNotes !== null && resolutionNotes !== undefined) {
      query += ', resolution_notes = ?';
      params.push(resolutionNotes);
    }

    if (resolvedAt) {
      query += ', resolved_at = ?';
      params.push(new Date(resolvedAt).toISOString().slice(0, 19).replace('T', ' '));
    }

    if (closedAt) {
      query += ', closed_at = ?';
      params.push(new Date(closedAt).toISOString().slice(0, 19).replace('T', ' '));
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.execute(query, params);
    return result.affectedRows > 0;
  },

  async updateAssignment(id, assignedTo) {
    const [result] = await pool.execute(
      `UPDATE tickets 
       SET assigned_to = ?, 
           status = CASE WHEN status = 'Open' AND ? IS NOT NULL THEN 'Assigned' ELSE status END,
           updated_at = UTC_TIMESTAMP() 
       WHERE id = ?`,
      [assignedTo, assignedTo, id]
    );
    return result.affectedRows > 0;
  },

  async updatePriority(id, priority, newSlaDeadline) {
    const formattedDeadline = new Date(newSlaDeadline).toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.execute(
      'UPDATE tickets SET priority = ?, sla_deadline = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?',
      [priority, formattedDeadline, id]
    );
    return result.affectedRows > 0;
  },

  async getStatistics({ userId = null, role = 'admin' } = {}) {
    let baseWhere = '1=1';
    const params = [];

    if (role === 'user' && userId) {
      baseWhere += ' AND created_by = ?';
      params.push(userId);
    } else if (role === 'engineer' && userId) {
      baseWhere += ' AND (assigned_to = ? OR assigned_to IS NULL)';
      params.push(userId);
    }

    // 1. Overall counts by status and overdue
    const countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN status NOT IN ('Resolved', 'Closed') AND UTC_TIMESTAMP() > sla_deadline THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN priority = 'Critical' AND status NOT IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as critical_active
      FROM tickets
      WHERE ${baseWhere}
    `;
    const [countRows] = await pool.query(countQuery, params);

    // 2. Breakdown by priority
    const priorityQuery = `
      SELECT priority, COUNT(*) as count 
      FROM tickets 
      WHERE ${baseWhere}
      GROUP BY priority
    `;
    const [priorityRows] = await pool.query(priorityQuery, params);

    // 3. Breakdown by category
    const categoryQuery = `
      SELECT category, COUNT(*) as count 
      FROM tickets 
      WHERE ${baseWhere}
      GROUP BY category
    `;
    const [categoryRows] = await pool.query(categoryQuery, params);

    return {
      summary: {
        total: Number(countRows[0]?.total || 0),
        open: Number(countRows[0]?.open || 0),
        assigned: Number(countRows[0]?.assigned || 0),
        in_progress: Number(countRows[0]?.in_progress || 0),
        resolved: Number(countRows[0]?.resolved || 0),
        closed: Number(countRows[0]?.closed || 0),
        overdue: Number(countRows[0]?.overdue || 0),
        critical_active: Number(countRows[0]?.critical_active || 0)
      },
      byPriority: priorityRows,
      byCategory: categoryRows
    };
  }
};

module.exports = ticketModel;
