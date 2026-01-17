const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { ocrValidationRules, validate } = require('../validators/ocrValidator');
const timeoutMiddleware = require('../middleware/timeoutMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const uploadController = require('../controllers/uploadController');

// POST /api/upload
// Always performs OCR on uploaded image
// Optional query parameters: ?language=eng&preprocess=true
// Middleware chain: upload → validation → timeout → async handler → controller
router.post(
  '/upload',
  uploadMiddleware,
  ocrValidationRules,
  validate,
  timeoutMiddleware(),
  asyncHandler(uploadController)
);

module.exports = router;
