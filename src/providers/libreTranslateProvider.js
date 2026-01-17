const axios = require('axios');
const TranslationProvider = require('./translationProvider');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * LibreTranslate API provider implementation
 * 
 * WHY: Isolates LibreTranslate-specific logic, makes it easy to swap providers
 * LibreTranslate: Open-source, self-hostable, no API keys required
 */
class LibreTranslateProvider extends TranslationProvider {
  constructor() {
    super();
    this.apiUrl = config.LIBRETRANSLATE_API_URL;
    this.timeout = config.TRANSLATION_TIMEOUT_MS;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Translate text using LibreTranslate API
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (optional, 'auto' if not provided)
   * @returns {Promise<Object>} - Standardized translation result
   */
  async translate(text, targetLanguage, sourceLanguage = null) {
    try {
      const source = sourceLanguage || 'auto';

      logger.debug({
        textLength: text.length,
        sourceLanguage: source,
        targetLanguage,
      }, 'Calling LibreTranslate API');

      const response = await this.client.post('/translate', {
        q: text,
        source: source,
        target: targetLanguage,
        format: 'text',
      });

      // LibreTranslate API response format
      // Response: { translatedText: "...", detectedLanguage: { language: "en", confidence: 0.95 } }
      const translatedText = response.data.translatedText || response.data.translated || '';
      
      if (!translatedText) {
        logger.warn({ responseData: response.data }, 'Unexpected response format from LibreTranslate');
        throw new Error('Invalid response from translation service');
      }

      // Transform LibreTranslate response to standard format
      return {
        original: text,
        translated: translatedText,
        targetLanguage,
        sourceLanguage: response.data.detectedLanguage?.language || (source !== 'auto' ? source : null),
        confidence: response.data.detectedLanguage?.confidence || null,
      };
    } catch (error) {
      // Handle provider-specific errors
      if (error.response) {
        // API returned error response
        const status = error.response.status;
        const message = error.response.data?.error || error.response.data?.message || error.message;
        const url = error.config?.url || 'unknown';

        logger.error({
          status,
          message,
          url: `${this.apiUrl}${url}`,
          responseData: error.response.data,
        }, 'LibreTranslate API error');

        if (status === 404) {
          throw new Error(`Translation API endpoint not found. Please check LIBRETRANSLATE_API_URL configuration. (URL: ${this.apiUrl})`);
        } else if (status === 429) {
          throw new Error('Translation rate limit exceeded. Please try again later.');
        } else if (status === 400) {
          throw new Error(`Invalid translation request: ${message}`);
        } else if (status >= 500) {
          throw new Error('Translation service temporarily unavailable');
        } else {
          throw new Error(`Translation failed: ${message} (Status: ${status})`);
        }
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Translation request timeout');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(`Translation service unavailable. Cannot connect to ${this.apiUrl}`);
      } else {
        logger.logError(error, { context: 'Translation provider error' });
        throw new Error(`Translation error: ${error.message}`);
      }
    }
  }

  /**
   * Detect language using LibreTranslate API
   * @param {string} text - Text to detect language for
   * @returns {Promise<string>} - Detected language code
   */
  async detectLanguage(text) {
    try {
      const response = await this.client.post('/detect', {
        q: text,
      });

      // LibreTranslate returns array of detections, get the first one
      const detections = response.data;
      if (Array.isArray(detections) && detections.length > 0) {
        return detections[0].language;
      }

      throw new Error('Language detection failed');
    } catch (error) {
      logger.logError(error, { context: 'Language detection failed' });
      throw new Error(`Language detection failed: ${error.message}`);
    }
  }

  /**
   * Get supported languages from LibreTranslate API
   * @returns {Promise<Array<string>>} - Array of language codes
   */
  async getSupportedLanguages() {
    try {
      const response = await this.client.get('/languages');
      
      if (Array.isArray(response.data)) {
        return response.data.map(lang => lang.code);
      }

      // Fallback to config if API fails
      return config.SUPPORTED_LANGUAGES;
    } catch (error) {
      logger.warn('Failed to fetch supported languages from API, using config fallback');
      return config.SUPPORTED_LANGUAGES;
    }
  }
}

module.exports = LibreTranslateProvider;
