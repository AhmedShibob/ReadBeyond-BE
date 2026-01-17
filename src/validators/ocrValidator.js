const { body, query, validationResult } = require('express-validator');
const config = require('../config/env');

// Validation rules
const ocrValidationRules = [
  // Query parameter validation
  query('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage('Language code must be between 2 and 10 characters'),
  
  query('preprocess')
    .optional()
    .isBoolean()
    .withMessage('Preprocess must be a boolean value'),
];

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }

  // Additional validation: check if file exists
  if (!req.file) {
    return res.status(400).json({
      error: {
        message: 'No image file provided',
      },
    });
  }

  // Validate file buffer
  if (!req.file.buffer || req.file.buffer.length === 0) {
    return res.status(400).json({
      error: {
        message: 'Invalid image file',
      },
    });
  }

  next();
};

module.exports = {
  ocrValidationRules,
  validate,
};
