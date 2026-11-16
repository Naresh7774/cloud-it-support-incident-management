const { logEvent } = require('../utils/cloudwatchLogger');

/**
 * Middleware to restrict access based on user role
 * @param {Array<string>|string} allowedRoles - Single role or list of roles, e.g. ['admin', 'engineer']
 */
const authorizeRoles = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      logEvent('AUTHORIZATION_FAILURE', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.originalUrl,
        method: req.method
      }, 'warn');

      return res.status(403).json({
        success: false,
        message: `Forbidden. Action requires one of the following roles: [${roles.join(', ')}].`
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles
};
