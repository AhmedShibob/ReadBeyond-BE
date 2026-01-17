const axios = require('axios');
const TranslationProvider = require('./translationProvider');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * MyMemory Translation API provider implementation
 * 
 * WHY: Free translation API, no API key required for basic usage
 * MyMemory: Free tier allows 10,000 words/day, no registration needed
 * API Docs: https://mymemory.translated.net/doc/spec
 */
class MyMemoryProvider extends TranslationProvider {
  constructor() {
    super();
    this.apiUrl = 'https://api.mymemory.translated.net';
    this.timeout = config.TRANSLATION_TIMEOUT_MS;
    
    // Create axios instance with default config
    // Keep-alive connections for better performance
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable HTTP keep-alive for better performance
      httpAgent: new (require('http').Agent)({ keepAlive: true }),
      httpsAgent: new (require('https').Agent)({ keepAlive: true }),
    });
  }

  /**
   * Translate text using MyMemory API
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (ISO 639-1, e.g., 'ar', 'en')
   * @param {string} sourceLanguage - Source language code (optional, 'en' if not provided)
   * @returns {Promise<Object>} - Standardized translation result
   */
  async translate(text, targetLanguage, sourceLanguage = null) {
    try {
      // MyMemory uses ISO 639-1 codes, default to 'en' if not provided
      const source = sourceLanguage || 'en';

      logger.debug({
        textLength: text.length,
        sourceLanguage: source,
        targetLanguage,
      }, 'Calling MyMemory Translation API');

      // MyMemory API endpoint: /get?q=text&langpair=source|target
      const response = await this.client.get('/get', {
        params: {
          q: text,
          langpair: `${source}|${targetLanguage}`,
        },
      });

      // MyMemory API response format:
      // { responseData: { translatedText: "...", match: 1 } }
      const responseData = response.data.responseData;
      
      if (!responseData || !responseData.translatedText) {
        logger.warn({ responseData: response.data }, 'Unexpected response format from MyMemory');
        throw new Error('Invalid response from translation service');
      }

      // Transform MyMemory response to standard format
      return {
        original: text,
        translated: responseData.translatedText,
        targetLanguage,
        sourceLanguage: source,
        confidence: responseData.match ? responseData.match / 100 : null, // match is 0-100
      };
    } catch (error) {
      // Handle provider-specific errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error || error.response.data?.message || error.message;

        logger.error({
          status,
          message,
          url: error.config?.url,
          responseData: error.response.data,
        }, 'MyMemory API error');

        if (status === 429) {
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
        logger.logError(error, { context: 'MyMemory provider error' });
        throw new Error(`Translation error: ${error.message}`);
      }
    }
  }

  /**
   * Detect language using simple heuristics
   * Note: MyMemory doesn't have language detection, so we use pattern matching
   * This is much faster than trying multiple translations
   * @param {string} text - Text to detect language for
   * @returns {Promise<string>} - Detected language code
   */
  async detectLanguage(text) {
    // Simple heuristic-based detection (fast, no API calls)
    const sample = text.substring(0, 100).toLowerCase();
    
    // Arabic characters
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    
    // Japanese characters
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    
    // Korean characters
    if (/[\uac00-\ud7a3]/.test(text)) return 'ko';
    
    // Cyrillic (Russian, Bulgarian, etc.)
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    
    // Greek
    if (/[\u0370-\u03ff]/.test(text)) return 'el';
    
    // Hebrew
    if (/[\u0590-\u05ff]/.test(text)) return 'he';
    
    // Thai
    if (/[\u0e00-\u0e7f]/.test(text)) return 'th';
    
    // Common Spanish words/patterns
    if (/\b(el|la|los|las|de|que|y|en|un|una|es|son|con|por|para)\b/i.test(sample)) return 'es';
    
    // Common French words/patterns
    if (/\b(le|la|les|de|du|des|et|est|sont|avec|pour|dans|un|une)\b/i.test(sample)) return 'fr';
    
    // Common German words/patterns
    if (/\b(der|die|das|und|ist|sind|mit|für|von|zu|ein|eine)\b/i.test(sample)) return 'de';
    
    // Common Italian words/patterns
    if (/\b(il|la|lo|gli|le|di|del|della|e|è|sono|con|per|un|una)\b/i.test(sample)) return 'it';
    
    // Common Portuguese words/patterns
    if (/\b(o|a|os|as|de|do|da|e|é|são|com|para|um|uma)\b/i.test(sample)) return 'pt';
    
    // Default to English (most common)
    return 'en';
  }

  /**
   * Get supported languages from MyMemory API
   * @returns {Promise<Array<string>>} - Array of language codes
   */
  async getSupportedLanguages() {
    // MyMemory supports many languages, return common ones
    // Full list: https://mymemory.translated.net/doc/spec
    return [
      'en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'hi', 
      'tr', 'pl', 'nl', 'sv', 'da', 'fi', 'no', 'cs', 'ro', 'hu', 'el', 'he', 
      'th', 'vi', 'id', 'uk', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt', 'mt', 
      'ga', 'cy', 'ca', 'eu', 'gl', 'is', 'mk', 'sq', 'sr', 'bs', 'mt'
    ];
  }
}

module.exports = MyMemoryProvider;
