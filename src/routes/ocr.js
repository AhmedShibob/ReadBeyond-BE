const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { ocrValidationRules, validate } = require('../validators/ocrValidator');
const timeoutMiddleware = require('../middleware/timeoutMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const ocrController = require('../controllers/ocrController');

// POST /ocr
// Middleware chain: upload → validation → timeout → async handler → controller
router.post(
  '/ocr',
  uploadMiddleware,
  ocrValidationRules,
  validate,
  timeoutMiddleware(),
  asyncHandler(ocrController)
);

module.exports = router;
