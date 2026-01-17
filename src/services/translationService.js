const MyMemoryProvider = require('../providers/myMemoryProvider');
const LibreTranslateProvider = require('../providers/libreTranslateProvider');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Translation Service - Business Logic Layer
 * 
 * WHY: Contains business rules, orchestration, retry logic
 * Separated from HTTP concerns (controller) and external API details (provider)
 */
class TranslationService {
  constructor(provider = null) {
    // Dependency injection: allows swapping providers or injecting mock for testing
    if (provider) {
      this.provider = provider;
    } else {
      // Choose provider based on config
      if (config.TRANSLATION_PROVIDER === 'libretranslate') {
        this.provider = new LibreTranslateProvider();
        logger.info('Using LibreTranslate provider');
      } else {
        // Default to MyMemory (free, no API key required)
        this.provider = new MyMemoryProvider();
        logger.info('Using MyMemory provider (free)');
      }
    }
  }

  /**
   * Translate text to target language
   * @param {string} text - Text to translate
   * @param {Object} options - Translation options
   * @param {string} options.targetLanguage - Target language code (required)
   * @param {string} options.sourceLanguage - Source language code (optional, auto-detect if not provided)
   * @returns {Promise<Object>} - Translation result with metadata
   */
  async translate(text, options = {}) {
    const startTime = Date.now();
    let { targetLanguage, sourceLanguage = null } = options;
    
    // If source language not provided, try to detect it (fast heuristic-based)
    if (!sourceLanguage) {
      try {
        sourceLanguage = await this.provider.detectLanguage(text);
        logger.debug({ detectedLanguage: sourceLanguage }, 'Auto-detected source language');
      } catch (error) {
        // If detection fails, default to 'en'
        logger.warn('Language detection failed, defaulting to English');
        sourceLanguage = 'en';
      }
    }

    // Validate inputs
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text to translate is required and cannot be empty');
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      throw new Error('Target language is required');
    }

    // Validate text length (prevent abuse)
    const maxLength = 5000; // Configurable limit
    if (text.length > maxLength) {
      throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
    }

    logger.info({
      textLength: text.length,
      targetLanguage,
      sourceLanguage: sourceLanguage || 'auto',
    }, 'Translation request received');

    try {
      // Retry logic with exponential backoff
      const result = await this.translateWithRetry(text, targetLanguage, sourceLanguage);

      const processingTime = Date.now() - startTime;

      logger.info({
        textLength: text.length,
        targetLanguage,
        sourceLanguage: result.sourceLanguage,
        processingTime: `${processingTime}ms`,
      }, 'Translation completed');

      return {
        original: result.original,
        translated: result.translated,
        targetLanguage: result.targetLanguage,
        sourceLanguage: result.sourceLanguage,
        confidence: result.confidence,
        processingTime,
      };
    } catch (error) {
      logger.logError(error, {
        context: 'Translation service error',
        textLength: text.length,
        targetLanguage,
      });
      throw error;
    }
  }

  /**
   * Translate with retry logic and exponential backoff
   * @private
   */
  async translateWithRetry(text, targetLanguage, sourceLanguage, attempt = 1) {
    try {
      return await this.provider.translate(text, targetLanguage, sourceLanguage);
    } catch (error) {
      // Don't retry on client errors (400, 429)
      if (error.message.includes('rate limit') || 
          error.message.includes('Invalid') ||
          error.message.includes('required')) {
        throw error;
      }

      // Retry on server errors or network issues
      if (attempt < config.TRANSLATION_MAX_RETRIES) {
        const delay = config.TRANSLATION_RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        logger.warn({
          attempt,
          maxRetries: config.TRANSLATION_MAX_RETRIES,
          delay,
          error: error.message,
        }, 'Translation failed, retrying...');

        await this.sleep(delay);
        return this.translateWithRetry(text, targetLanguage, sourceLanguage, attempt + 1);
      }

      // Max retries reached
      throw new Error(`Translation failed after ${config.TRANSLATION_MAX_RETRIES} attempts: ${error.message}`);
    }
  }

  /**
   * Auto-detect source language and translate
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<Object>} - Translation result with detected source language
   */
  async translateWithAutoDetect(text, targetLanguage) {
    try {
      // First detect language
      const detectedLanguage = await this.provider.detectLanguage(text);
      
      logger.debug({
        detectedLanguage,
        targetLanguage,
      }, 'Language auto-detected');

      // Then translate
      return this.translate(text, {
        targetLanguage,
        sourceLanguage: detectedLanguage,
      });
    } catch (error) {
      // If detection fails, try translation with auto-detect (LibreTranslate supports this)
      logger.warn('Language detection failed, falling back to auto-detect in translation');
      return this.translate(text, { targetLanguage });
    }
  }

  /**
   * Helper: Sleep for specified milliseconds
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new TranslationService();
