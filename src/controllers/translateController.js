const translationService = require('../services/translationService');
const logger = require('../utils/logger');

/**
 * Translation Controller - Thin HTTP Layer
 * 
 * WHY: Handles HTTP concerns only (request/response, status codes)
 * Delegates all business logic to service layer
 * Easy to test, can swap HTTP frameworks
 */
const translate = async (req, res) => {
  try {
    // Extract request data (already validated by middleware)
    const { text, targetLanguage, sourceLanguage } = req.body;

    logger.info({
      textLength: text.length,
      targetLanguage,
      sourceLanguage: sourceLanguage || 'auto',
    }, 'Translation request received');

    // Delegate to service layer
    const result = await translationService.translate(text, {
      targetLanguage,
      sourceLanguage,
    });

    // Format and return response
    res.status(200).json({
      original: result.original,
      translated: result.translated,
      targetLanguage: result.targetLanguage,
      sourceLanguage: result.sourceLanguage,
      ...(result.confidence && { confidence: result.confidence }),
    });
  } catch (error) {
    // Error will be caught by asyncHandler and passed to errorHandler
    throw error;
  }
};

module.exports = translate;
