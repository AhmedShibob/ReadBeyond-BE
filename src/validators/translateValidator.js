const { body, validationResult } = require('express-validator');
const config = require('../config/env');

/**
 * Validation rules for translation endpoint
 * 
 * WHY: Validate early, fail fast, provide clear error messages
 * Separates validation logic from business logic
 */
const translateValidationRules = [
  // Text validation
  body('text')
    .notEmpty()
    .withMessage('Text is required')
    .isString()
    .withMessage('Text must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),

  // Target language validation
  body('targetLanguage')
    .notEmpty()
    .withMessage('Target language is required')
    .isString()
    .withMessage('Target language must be a string')
    .isLength({ min: 2, max: 5 })
    .withMessage('Target language code must be between 2 and 5 characters')
    .custom((value) => {
      // Check if language is supported
      if (!config.SUPPORTED_LANGUAGES.includes(value.toLowerCase())) {
        throw new Error(`Unsupported target language: ${value}. Supported languages: ${config.SUPPORTED_LANGUAGES.join(', ')}`);
      }
      return true;
    }),

  // Source language validation (optional)
  body('sourceLanguage')
    .optional()
    .isString()
    .withMessage('Source language must be a string')
    .isLength({ min: 2, max: 5 })
    .withMessage('Source language code must be between 2 and 5 characters')
    .custom((value) => {
      if (value && !config.SUPPORTED_LANGUAGES.includes(value.toLowerCase())) {
        throw new Error(`Unsupported source language: ${value}. Supported languages: ${config.SUPPORTED_LANGUAGES.join(', ')}`);
      }
      return true;
    }),
];

/**
 * Middleware to check validation results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg,
        })),
      },
    });
  }

  // Normalize language codes to lowercase
  if (req.body.targetLanguage) {
    req.body.targetLanguage = req.body.targetLanguage.toLowerCase();
  }
  if (req.body.sourceLanguage) {
    req.body.sourceLanguage = req.body.sourceLanguage.toLowerCase();
  }

  next();
};

module.exports = {
  translateValidationRules,
  validate,
};
