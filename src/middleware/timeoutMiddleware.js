const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Middleware to set request timeout
 * Prevents requests from hanging indefinitely
 */
const timeoutMiddleware = (timeout = config.OCR_TIMEOUT_MS + 5000) => {
  return (req, res, next) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn({ url: req.url, timeout }, 'Request timeout');
        res.status(408).json({
          error: {
            message: 'Request timeout',
          },
        });
      }
    }, timeout);

    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function (...args) {
      clearTimeout(timeoutId);
      originalEnd.apply(this, args);
    };

    next();
  };
};

module.exports = timeoutMiddleware;
