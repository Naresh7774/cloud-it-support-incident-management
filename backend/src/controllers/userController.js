const userModel = require('../models/userModel');
const { logEvent } = require('../utils/cloudwatchLogger');

const userController = {
  async getUsers(req, res, next) {
    try {
      const { role, search } = req.query;

      // Allow engineers to list engineers for assignment reference; otherwise admin only
      if (req.user.role === 'user') {
        return res.status(403).json({
          success: false,
          message: 'Access denied.'
        });
      }

      const users = await userModel.findAll({ role, search });
      return res.status(200).json({
        success: true,
        data: {
          users
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const validRoles = ['user', 'engineer', 'admin'];

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: [${validRoles.join(', ')}]`
        });
      }

      const user = await userModel.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Prevent admin from removing their own admin status if they are the only admin
      if (user.id === req.user.id && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'You cannot demote yourself from admin status.'
        });
      }

      await userModel.updateRole(id, role);

      logEvent('USER_ROLE_UPDATED', {
        targetUserId: id,
        oldRole: user.role,
        newRole: role,
        updatedBy: req.user.id
      });

      const updatedUser = await userModel.findById(id);

      return res.status(200).json({
        success: true,
        message: `Role for ${updatedUser.name} updated to ${role}.`,
        data: {
          user: updatedUser
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = userController;
