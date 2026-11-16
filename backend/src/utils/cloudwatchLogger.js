const { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const logger = require('../config/logger');

let cwClient = null;
let sequenceToken = null;
let isInitialized = false;

const logGroupName = process.env.CLOUDWATCH_LOG_GROUP || '/aws/ec2/cloud-incident-management';
const logStreamName = process.env.CLOUDWATCH_LOG_STREAM || `instance-${process.env.HOSTNAME || 'default'}-${new Date().toISOString().slice(0, 10)}`;
const awsRegion = process.env.AWS_REGION || 'us-east-1';

const initCloudWatch = async () => {
  if (process.env.ENABLE_CLOUDWATCH !== 'true') {
    return false;
  }

  try {
    const config = { region: awsRegion };
    // If explicit AWS keys are provided (fallback, otherwise use EC2 IAM role)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      };
    }

    cwClient = new CloudWatchLogsClient(config);

    // Ensure Log Group exists
    try {
      await cwClient.send(new CreateLogGroupCommand({ logGroupName }));
    } catch (err) {
      if (err.name !== 'ResourceAlreadyExistsException') {
        logger.warn(`CloudWatch CreateLogGroup notice: ${err.message}`);
      }
    }

    // Ensure Log Stream exists
    try {
      await cwClient.send(new CreateLogStreamCommand({ logGroupName, logStreamName }));
    } catch (err) {
      if (err.name !== 'ResourceAlreadyExistsException') {
        logger.warn(`CloudWatch CreateLogStream notice: ${err.message}`);
      }
    }

    isInitialized = true;
    logger.info(`AWS CloudWatch logging initialized successfully. Group: ${logGroupName}, Stream: ${logStreamName}`);
    return true;
  } catch (err) {
    logger.warn(`Failed to initialize AWS CloudWatch client: ${err.message}. Local file logging will continue.`);
    isInitialized = false;
    return false;
  }
};

const sendToCloudWatch = async (level, message, meta = {}) => {
  if (!isInitialized || !cwClient) {
    return;
  }

  try {
    const logEvent = {
      timestamp: Date.now(),
      message: JSON.stringify({
        level,
        message,
        ...meta,
        timestamp: new Date().toISOString()
      })
    };

    const params = {
      logGroupName,
      logStreamName,
      logEvents: [logEvent]
    };

    if (sequenceToken) {
      params.sequenceToken = sequenceToken;
    }

    const response = await cwClient.send(new PutLogEventsCommand(params));
    sequenceToken = response.nextSequenceToken;
  } catch (err) {
    if (err.name === 'InvalidSequenceTokenException' || err.name === 'DataAlreadyAcceptedException') {
      sequenceToken = err.expectedSequenceToken;
    } else {
      logger.debug(`CloudWatch putLogEvents error: ${err.message}`);
    }
  }
};

// Event-specific logging functions
const logEvent = (eventType, details, level = 'info') => {
  const structuredMeta = {
    eventType,
    environment: process.env.NODE_ENV || 'development',
    details
  };

  logger.log(level, `[EVENT: ${eventType}] ${typeof details === 'string' ? details : JSON.stringify(details)}`, structuredMeta);
  sendToCloudWatch(level, `[EVENT: ${eventType}]`, structuredMeta);
};

module.exports = {
  initCloudWatch,
  sendToCloudWatch,
  logEvent
};
