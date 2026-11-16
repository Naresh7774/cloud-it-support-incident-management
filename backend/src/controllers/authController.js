const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { logEvent } = require('../utils/cloudwatchLogger');

const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      // Check if email already registered
      const existingUser = await userModel.findByEmail(email.toLowerCase().trim());
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      // Check role assignment: regular public registration defaults to 'user'
      // If role is engineer/admin, check if requesting user is an admin
      let assignedRole = 'user';
      if (role && ['engineer', 'admin'].includes(role)) {
        if (req.user && req.user.role === 'admin') {
          assignedRole = role;
        } else {
          // If no users exist in the system yet, allow creating first admin
          const userCounts = await userModel.countByRole();
          const totalUsers = userCounts.reduce((acc, row) => acc + row.count, 0);
          if (totalUsers === 0) {
            assignedRole = role;
          } else {
            assignedRole = 'user'; // fallback to user for public signup
          }
        }
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = await userModel.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: assignedRole
      });

      // Sign JWT
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      logEvent('USER_REGISTERED', {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await userModel.findByEmail(email.toLowerCase().trim());
      if (!user) {
        logEvent('AUTH_FAILURE', {
          email: email.toLowerCase().trim(),
          ip: req.ip,
          reason: 'User not found'
        }, 'warn');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        logEvent('AUTH_FAILURE', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
          reason: 'Invalid password'
        }, 'warn');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      logEvent('USER_LOGIN', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
