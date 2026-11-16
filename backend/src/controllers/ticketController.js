const ticketModel = require('../models/ticketModel');
const commentModel = require('../models/commentModel');
const historyModel = require('../models/historyModel');
const userModel = require('../models/userModel');
const { calculateSlaDeadline, getSlaTimeRemaining } = require('../utils/slaCalculator');
const { recordHistory } = require('../utils/auditLogger');
const { logEvent } = require('../utils/cloudwatchLogger');

const ticketController = {
  /**
   * Create a new ticket
   */
  async createTicket(req, res, next) {
    try {
      const { title, description, category, priority = 'Medium' } = req.body;
      const createdBy = req.user.id;

      // 1. Calculate SLA deadline based on priority
      const slaDeadline = await calculateSlaDeadline(priority);

      // 2. Generate unique ticket number
      const ticketNumber = await ticketModel.generateTicketNumber();

      // 3. Create ticket
      const newTicket = await ticketModel.create({
        ticketNumber,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        createdBy,
        slaDeadline
      });

      // 4. Record audit history
      await recordHistory({
        ticketId: newTicket.id,
        userId: createdBy,
        action: 'CREATED',
        newValue: `Priority: ${priority}, SLA: ${new Date(slaDeadline).toISOString()}`,
        notes: `Ticket created by ${req.user.name} (${req.user.email})`
      });

      logEvent('TICKET_CREATED', {
        ticketId: newTicket.id,
        ticketNumber: newTicket.ticket_number,
        priority: newTicket.priority,
        category: newTicket.category,
        createdBy: req.user.id
      });

      return res.status(201).json({
        success: true,
        message: 'Ticket created successfully.',
        data: {
          ticket: newTicket
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get tickets list with filters and role-based visibility
   */
  async getTickets(req, res, next) {
    try {
      const {
        status,
        priority,
        category,
        search,
        isOverdue,
        queue, // 'mine', 'unassigned', 'all'
        limit = 50,
        offset = 0
      } = req.query;

      const filter = {
        status,
        priority,
        category,
        search,
        isOverdue,
        limit: parseInt(limit, 10) || 50,
        offset: parseInt(offset, 10) || 0
      };

      // Role-based filtering
      if (req.user.role === 'user') {
        // Regular users can only see their own tickets
        filter.createdBy = req.user.id;
      } else if (req.user.role === 'engineer') {
        if (queue === 'mine') {
          filter.assignedTo = req.user.id;
        } else if (queue === 'unassigned') {
          filter.unassignedOnly = true;
        }
        // If queue is 'all' or omitted, engineers see all tickets in the system
      }

      const tickets = await ticketModel.findAll(filter);
      const total = await ticketModel.countAll(filter);

      // Add SLA countdown information
      const enrichedTickets = tickets.map((t) => ({
        ...t,
        sla_info: getSlaTimeRemaining(t.sla_deadline)
      }));

      return res.status(200).json({
        success: true,
        data: {
          tickets: enrichedTickets,
          pagination: {
            total,
            limit: filter.limit,
            offset: filter.offset
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get single ticket by ID with comments and history
   */
  async getTicketById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await ticketModel.findById(id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.'
        });
      }

      // Check access permission: Users can only see tickets they created
      if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own tickets.'
        });
      }

      // Fetch comments (hide internal comments from regular users)
      const includeInternal = req.user.role !== 'user';
      const comments = await commentModel.findByTicketId(ticket.id, includeInternal);

      // Fetch audit history
      const history = await historyModel.findByTicketId(ticket.id);

      // Enrich with SLA timer
      ticket.sla_info = getSlaTimeRemaining(ticket.sla_deadline);

      return res.status(200).json({
        success: true,
        data: {
          ticket,
          comments,
          history
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update ticket status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const resolutionNotes = req.body.resolutionNotes || req.body.resolution_notes;
      const validStatuses = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: [${validStatuses.join(', ')}]`
        });
      }

      const ticket = await ticketModel.findById(id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.'
        });
      }

      // Authorization rules:
      // - Regular users can only close their own ticket if it is currently 'Resolved'
      // - Engineers & Admins can change status between any stages
      if (req.user.role === 'user') {
        if (ticket.created_by !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You cannot modify status on tickets created by others.'
          });
        }
        if (status !== 'Closed' || ticket.status !== 'Resolved') {
          return res.status(403).json({
            success: false,
            message: 'Users can only close tickets that are in Resolved state.'
          });
        }
      }

      // If resolving ticket, resolution notes are required
      if (status === 'Resolved' && (!resolutionNotes || resolutionNotes.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Resolution notes are required when resolving an incident.'
        });
      }

      const oldStatus = ticket.status;
      const resolvedAt = status === 'Resolved' ? new Date() : ticket.resolved_at;
      const closedAt = status === 'Closed' ? new Date() : ticket.closed_at;

      await ticketModel.updateStatus(ticket.id, {
        status,
        resolutionNotes: resolutionNotes ? resolutionNotes.trim() : ticket.resolution_notes,
        resolvedAt,
        closedAt
      });

      // Record history
      await recordHistory({
        ticketId: ticket.id,
        userId: req.user.id,
        action: 'STATUS_CHANGED',
        oldValue: oldStatus,
        newValue: status,
        notes: resolutionNotes ? `Resolution Notes: ${resolutionNotes.trim()}` : null
      });

      if (status === 'Resolved') {
        logEvent('TICKET_RESOLVED', {
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          resolvedBy: req.user.id,
          resolvedAt
        });
      } else {
        logEvent('TICKET_STATUS_CHANGED', {
          ticketId: ticket.id,
          from: oldStatus,
          to: status,
          updatedBy: req.user.id
        });
      }

      const updatedTicket = await ticketModel.findById(ticket.id);
      updatedTicket.sla_info = getSlaTimeRemaining(updatedTicket.sla_deadline);

      return res.status(200).json({
        success: true,
        message: `Ticket status updated to ${status}.`,
        data: {
          ticket: updatedTicket
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Assign ticket to an engineer
   */
  async assignTicket(req, res, next) {
    try {
      const { id } = req.params;
      const engineerId = req.body.engineerId !== undefined 
        ? req.body.engineerId 
        : (req.body.assigned_to !== undefined ? req.body.assigned_to : req.body.assignedTo);

      const ticket = await ticketModel.findById(id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.'
        });
      }

      // Check authorization:
      // Admin can assign any engineer.
      // Engineer can assign to themselves.
      let targetEngineerId = engineerId;
      if (req.user.role === 'engineer') {
        // If engineer, self-assign only
        targetEngineerId = req.user.id;
      }

      if (!targetEngineerId) {
        return res.status(400).json({
          success: false,
          message: 'Engineer ID is required for assignment.'
        });
      }

      const targetUser = await userModel.findById(targetEngineerId);
      if (!targetUser || !['engineer', 'admin'].includes(targetUser.role)) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must have an engineer or admin role.'
        });
      }

      const oldAssigneeName = ticket.assignee_name || 'Unassigned';
      await ticketModel.updateAssignment(ticket.id, targetEngineerId);

      // Record audit history
      await recordHistory({
        ticketId: ticket.id,
        userId: req.user.id,
        action: 'ASSIGNED',
        oldValue: oldAssigneeName,
        newValue: targetUser.name,
        notes: `Assigned to ${targetUser.name} (${targetUser.email}) by ${req.user.name}`
      });

      logEvent('TICKET_ASSIGNED', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        assignedTo: targetEngineerId,
        assignedBy: req.user.id
      });

      const updatedTicket = await ticketModel.findById(ticket.id);
      updatedTicket.sla_info = getSlaTimeRemaining(updatedTicket.sla_deadline);

      return res.status(200).json({
        success: true,
        message: `Ticket assigned to ${targetUser.name}.`,
        data: {
          ticket: updatedTicket
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update ticket priority and recalculate SLA deadline
   */
  async updatePriority(req, res, next) {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      const validPriorities = ['Critical', 'High', 'Medium', 'Low'];

      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority. Must be one of: [${validPriorities.join(', ')}]`
        });
      }

      const ticket = await ticketModel.findById(id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found.'
        });
      }

      const oldPriority = ticket.priority;
      if (oldPriority === priority) {
        return res.status(200).json({
          success: true,
          message: 'Priority unchanged.',
          data: { ticket }
        });
      }

      // Recalculate SLA deadline based on ticket created_at and new priority
      const newSlaDeadline = await calculateSlaDeadline(priority, ticket.created_at);

      await ticketModel.updatePriority(ticket.id, priority, newSlaDeadline);

      await recordHistory({
        ticketId: ticket.id,
        userId: req.user.id,
        action: 'PRIORITY_CHANGED',
        oldValue: oldPriority,
        newValue: priority,
        notes: `SLA recalculated to: ${new Date(newSlaDeadline).toISOString()}`
      });

      logEvent('PRIORITY_CHANGED', {
        ticketId: ticket.id,
        from: oldPriority,
        to: priority,
        updatedBy: req.user.id
      });

      const updatedTicket = await ticketModel.findById(ticket.id);
      updatedTicket.sla_info = getSlaTimeRemaining(updatedTicket.sla_deadline);

      return res.status(200).json({
        success: true,
        message: `Ticket priority updated to ${priority}. SLA adjusted.`,
        data: {
          ticket: updatedTicket
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ticketController;
