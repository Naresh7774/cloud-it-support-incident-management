const jwt = require('jsonwebtoken');
const { logEvent } = require('../utils/cloudwatchLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'cloud_support_jwt_super_secret_key_change_in_production_2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logEvent('AUTH_FAILURE', {
      ip: req.ip,
      path: req.originalUrl,
      reason: 'Missing Authorization header'
    }, 'warn');
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    logEvent('AUTH_FAILURE', {
      ip: req.ip,
      path: req.originalUrl,
      reason: err.message
    }, 'warn');

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid authentication token.'
    });
  }
};

module.exports = {
  authenticateToken,
  JWT_SECRET
};
