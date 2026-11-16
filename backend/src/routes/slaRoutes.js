const express = require('express');
const { body } = require('express-validator');
const slaController = require('../controllers/slaController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticateToken);

// View SLA targets
router.get('/configs', slaController.getSlaConfigs);

// Update SLA target (Admin only)
router.put(
  '/configs',
  authorizeRoles('admin'),
  [
    body('priority').isIn(['Critical', 'High', 'Medium', 'Low']).withMessage('Priority must be Critical, High, Medium, or Low'),
    body('targetMinutes').isInt({ min: 1 }).withMessage('targetMinutes must be an integer greater than 0'),
    body('description').optional().trim(),
    validateRequest
  ],
  slaController.updateSlaConfig
);

module.exports = router;
