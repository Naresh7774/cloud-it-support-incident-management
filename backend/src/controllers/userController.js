const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { pool } = require('../config/db');
const { logEvent } = require('../utils/cloudwatchLogger');

const userController = {
  async getUsers(req, res, next) {
    try {
      const { role, search } = req.query;

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
  },

  async getProfile(req, res, next) {
    try {
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Fetch user specific metrics
      const [ticketStats] = await pool.query(
        `SELECT 
          SUM(CASE WHEN created_by = ? THEN 1 ELSE 0 END) as created_count,
          SUM(CASE WHEN assigned_to = ? THEN 1 ELSE 0 END) as assigned_count,
          SUM(CASE WHEN assigned_to = ? AND status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_count
        FROM tickets`,
        [req.user.id, req.user.id, req.user.id]
      );

      return res.status(200).json({
        success: true,
        data: {
          user: {
            ...user,
            stats: {
              created: Number(ticketStats[0]?.created_count || 0),
              assigned: Number(ticketStats[0]?.assigned_count || 0),
              resolved: Number(ticketStats[0]?.resolved_count || 0)
            }
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { name, department, phone, bio, currentPassword, newPassword } = req.body;
      const user = await userModel.findByEmail(req.user.email);

      let passwordHash = undefined;
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password is required to set a new password.'
          });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Current password provided is incorrect.'
          });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'New password must be at least 6 characters long.'
          });
        }
        passwordHash = await bcrypt.hash(newPassword, 10);
      }

      await userModel.updateProfile(req.user.id, {
        name,
        department,
        phone,
        bio,
        passwordHash
      });

      logEvent('USER_PROFILE_UPDATED', {
        userId: req.user.id,
        passwordChanged: Boolean(passwordHash)
      });

      const updated = await userModel.findById(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          user: updated
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getEngineerHistory(req, res, next) {
    try {
      const [rows] = await pool.query(
        `SELECT h.*, t.ticket_number, t.title as ticket_title, t.priority, t.status as current_status
         FROM ticket_history h
         JOIN tickets t ON h.ticket_id = t.id
         WHERE h.user_id = ?
         ORDER BY h.created_at DESC
         LIMIT 100`,
        [req.user.id]
      );

      return res.status(200).json({
        success: true,
        data: {
          history: rows
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = userController;
