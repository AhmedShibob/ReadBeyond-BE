const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.logError(err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  // Handle multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: {
        message: 'File size exceeds maximum limit of 5MB',
      },
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: {
        message: err.message || 'Invalid file upload request',
      },
    });
  }

  // Handle OCR-specific errors
  if (err.message && err.message.includes('timeout')) {
    return res.status(408).json({
      error: {
        message: err.message || 'Request timeout',
      },
    });
  }

  if (err.message && err.message.includes('OCR processing failed')) {
    return res.status(500).json({
      error: {
        message: 'OCR processing failed. Please try again or use a different image.',
      },
    });
  }

  // Handle validation errors
  if (err.message && err.message.includes('Validation failed')) {
    return res.status(400).json({
      error: {
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle translation-specific errors
  if (err.message && err.message.includes('rate limit')) {
    return res.status(429).json({
      error: {
        message: err.message || 'Translation rate limit exceeded',
      },
    });
  }

  if (err.message && (err.message.includes('Translation') || err.message.includes('translation'))) {
    if (err.message.includes('timeout') || err.message.includes('timeout')) {
      return res.status(408).json({
        error: {
          message: err.message || 'Translation request timeout',
        },
      });
    }
    
    if (err.message.includes('unavailable') || err.message.includes('service')) {
      return res.status(503).json({
        error: {
          message: err.message || 'Translation service unavailable',
        },
      });
    }

    // Other translation errors
    return res.status(500).json({
      error: {
        message: err.message || 'Translation failed',
      },
    });
  }

  // Default error status and message
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send error response
  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
