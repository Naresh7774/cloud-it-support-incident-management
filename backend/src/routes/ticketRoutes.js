const express = require('express');
const { body, param, query } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

// All ticket routes require authentication
router.use(authenticateToken);

// 1. List tickets (with role-based filtering, status, priority, search)
router.get(
  '/',
  [
    query('priority').optional().isIn(['Critical', 'High', 'Medium', 'Low']),
    query('status').optional().isIn(['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed']),
    validateRequest
  ],
  ticketController.getTickets
);

// 2. Create ticket
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 60 }),
    body('priority').optional().isIn(['Critical', 'High', 'Medium', 'Low']).withMessage('Priority must be Critical, High, Medium, or Low'),
    validateRequest
  ],
  ticketController.createTicket
);

// 3. Get single ticket by ID
router.get(
  '/:id',
  [
    param('id').notEmpty().withMessage('Ticket ID is required'),
    validateRequest
  ],
  ticketController.getTicketById
);

// 4. Update ticket status
router.put(
  '/:id/status',
  [
    param('id').notEmpty().withMessage('Ticket ID is required'),
    body('status').isIn(['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed']).withMessage('Invalid ticket status'),
    body('resolutionNotes').optional().trim(),
    body('resolution_notes').optional().trim(),
    validateRequest
  ],
  ticketController.updateStatus
);

// 5. Assign ticket (Admin or Engineer)
router.put(
  '/:id/assign',
  authorizeRoles('admin', 'engineer'),
  [
    param('id').notEmpty().withMessage('Ticket ID is required'),
    body('engineerId').optional().isInt().withMessage('Engineer ID must be an integer'),
    body('assigned_to').optional().isInt().withMessage('assigned_to must be an integer'),
    validateRequest
  ],
  ticketController.assignTicket
);

// 6. Update priority (Admin or Engineer)
router.put(
  '/:id/priority',
  authorizeRoles('admin', 'engineer'),
  [
    param('id').notEmpty().withMessage('Ticket ID is required'),
    body('priority').isIn(['Critical', 'High', 'Medium', 'Low']).withMessage('Invalid priority level'),
    validateRequest
  ],
  ticketController.updatePriority
);

// 7. Add comment to ticket
router.post(
  '/:id/comments',
  [
    param('id').notEmpty().withMessage('Ticket ID is required'),
    body('comment').trim().notEmpty().withMessage('Comment cannot be empty'),
    body('isInternal').optional().isBoolean(),
    validateRequest
  ],
  commentController.addComment
);

module.exports = router;
