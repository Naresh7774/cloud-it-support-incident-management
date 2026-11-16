const logger = require('../config/logger');
const { logEvent } = require('../utils/cloudwatchLogger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[API Error] ${req.method} ${req.originalUrl}: ${message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    user: req.user ? { id: req.user.id, email: req.user.email } : null
  });

  logEvent('API_ERROR', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, 'error');

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
