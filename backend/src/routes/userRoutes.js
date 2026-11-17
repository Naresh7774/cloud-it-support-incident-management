const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticateToken);

// User Profile routes (all roles)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Engineer history route
router.get('/history', authorizeRoles('engineer', 'admin'), userController.getEngineerHistory);

// List users (Admins see all; Engineers can query engineers for assignment)
router.get(
  '/',
  authorizeRoles('admin', 'engineer'),
  [
    query('role').optional().isIn(['user', 'engineer', 'admin']),
    validateRequest
  ],
  userController.getUsers
);

// Update user role (Admin only)
router.put(
  '/:id/role',
  authorizeRoles('admin'),
  [
    param('id').isInt().withMessage('User ID must be an integer'),
    body('role').isIn(['user', 'engineer', 'admin']).withMessage('Role must be user, engineer, or admin'),
    validateRequest
  ],
  userController.updateUserRole
);

// Delete user permanently (Admin only)
router.delete(
  '/:id',
  authorizeRoles('admin'),
  [
    param('id').isInt().withMessage('User ID must be an integer'),
    validateRequest
  ],
  userController.deleteUser
);

module.exports = router;
