const pino = require('pino');
const config = require('../config/env');

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || (config.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: config.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Helper methods for structured logging
logger.logRequest = (req) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  }, 'Incoming request');
};

logger.logResponse = (req, res, responseTime) => {
  logger.info({
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
  }, 'Request completed');
};

logger.logError = (err, context = {}) => {
  logger.error({
    err: {
      message: err.message,
      stack: err.stack,
      ...context,
    },
  }, 'Error occurred');
};

module.exports = logger;
