const express = require('express');
const router = express.Router();
const { translateValidationRules, validate } = require('../validators/translateValidator');
const timeoutMiddleware = require('../middleware/timeoutMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const translateController = require('../controllers/translateController');

// POST /api/translate
// Middleware chain: validation → timeout → async handler → controller
router.post(
  '/translate',
  translateValidationRules,
  validate,
  timeoutMiddleware(),
  asyncHandler(translateController)
);

module.exports = router;
