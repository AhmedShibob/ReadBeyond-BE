const ocrService = require('../services/ocrService');
const logger = require('../utils/logger');

/**
 * Thin controller - delegates to OCR service
 * Handles HTTP concerns only
 */
const processOCR = async (req, res) => {
  try {
    // Extract request data
    const imageBuffer = req.file.buffer;
    const language = req.query.language;
    const preprocess = req.query.preprocess !== 'false'; // Default to true

    logger.info({
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      language,
      preprocess,
    }, 'OCR request received');

    // Delegate to service layer
    const result = await ocrService.extractText(imageBuffer, {
      language,
      preprocess,
    });

    // Format and return response
    res.status(200).json({
      status: 'success',
      data: {
        text: result.text,
        confidence: result.confidence,
        language: result.language,
        processingTime: result.processingTime,
        wordCount: result.wordCount,
      },
    });
  } catch (error) {
    // Error will be caught by asyncHandler and passed to errorHandler
    throw error;
  }
};

module.exports = processOCR;
