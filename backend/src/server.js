const app = require('./app');
const logger = require('./config/logger');
const { testDbConnection } = require('./config/db');
const { initCloudWatch, logEvent } = require('./utils/cloudwatchLogger');
const slaModel = require('./models/slaModel');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // 1. Initialize AWS CloudWatch Logging if enabled
    await initCloudWatch();

    // 2. Check Database connectivity
    const dbStatus = await testDbConnection();
    if (dbStatus.connected) {
      logger.info('Database connection established successfully.');
      try {
        await slaModel.seedDefaults();
      } catch (seedErr) {
        logger.debug(`SLA default check note: ${seedErr.message}`);
      }
    } else {
      logger.warn(`Database connection not available yet: ${dbStatus.error}. Application will retry on incoming requests.`);
    }

    // 3. Start HTTP Server
    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Cloud Incident Management API Server running on port ${PORT} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`);
      logEvent('APPLICATION_STARTUP', {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        dbConnected: dbStatus.connected
      });
    });

    // Graceful shutdown handlers
    const handleShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      logEvent('APPLICATION_SHUTDOWN', { signal });

      if (server) {
        server.close(() => {
          logger.info('HTTP server closed. Exiting process.');
          process.exit(0);
        });

        // Force exit after 10 seconds if not closed cleanly
        setTimeout(() => {
          logger.error('Forced shutdown timeout reached. Terminating process.');
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', { reason, promise });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
      process.exit(1);
    });

  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

startServer();
