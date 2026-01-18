const imagePreprocessingService = require('./imagePreprocessingService');
const workerPool = require('../utils/workerPool');
const logger = require('../utils/logger');
const config = require('../config/env');

class OCRService {
  /**
   * Process image and extract text using OCR
   * @param {Buffer} imageBuffer - Image buffer to process
   * @param {Object} options - OCR options
   * @param {string} options.language - OCR language code
   * @param {boolean} options.preprocess - Whether to preprocess image
   * @returns {Promise<Object>} - OCR result with text and metadata
   */
  async extractText(imageBuffer, options = {}) {
    const startTime = Date.now();
    const { language = config.OCR_LANGUAGES, preprocess = config.IMAGE_PREPROCESSING_ENABLED } = options;

    try {
      // Validate image first (quick check)
      const isValid = await imagePreprocessingService.validateImage(imageBuffer);
      if (!isValid) {
        throw new Error('Invalid image format');
      }

      // Preprocess image if enabled (runs in parallel with validation completion)
      let processedBuffer = imageBuffer;
      if (preprocess) {
        logger.debug('Preprocessing image for OCR');
        processedBuffer = await imagePreprocessingService.preprocess(imageBuffer);
      }

      // Execute OCR using worker pool (non-blocking)
      logger.debug('Starting OCR processing');
      const ocrResult = await workerPool.executeTask(
        {
          imageBuffer: processedBuffer,
          options: { language },
        },
        config.OCR_TIMEOUT_MS
      );

      const processingTime = Date.now() - startTime;

      logger.info({
        textLength: ocrResult.text.length,
        confidence: ocrResult.confidence,
        processingTime: `${processingTime}ms`,
      }, 'OCR processing completed');

      return {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        language,
        processingTime,
        wordCount: ocrResult.words?.length || 0,
      };
    } catch (error) {
      logger.logError(error, { context: 'OCR processing failed' });
      
      if (error.message.includes('timeout')) {
        throw new Error('OCR processing timeout. The image may be too complex or large.');
      }
      
      throw new Error('OCR processing failed: ' + error.message);
    }
  }
}

module.exports = new OCRService();
