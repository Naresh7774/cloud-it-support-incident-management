const express = require('express');
const { testDbConnection } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  const dbHealth = await testDbConnection();

  const status = {
    status: dbHealth.connected ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      api: {
        status: 'up'
      },
      database: {
        status: dbHealth.connected ? 'connected' : 'disconnected',
        ...(dbHealth.error && { error: dbHealth.error })
      }
    },
    system: {
      memory: process.memoryUsage(),
      nodeVersion: process.version
    }
  };

  const statusCode = dbHealth.connected ? 200 : 503;
  return res.status(statusCode).json(status);
});

module.exports = router;
