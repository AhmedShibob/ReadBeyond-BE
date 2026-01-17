/**
 * Abstract base class for translation providers
 * Defines the contract that all translation providers must implement
 * 
 * WHY: Enables easy provider swapping without changing service/controller code
 * Future: Can add GoogleTranslateProvider, DeepLProvider, AzureTranslatorProvider, etc.
 */
class TranslationProvider {
  /**
   * Translate text from source language to target language
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (e.g., 'ar', 'en')
   * @param {string} sourceLanguage - Source language code (optional, auto-detect if not provided)
   * @returns {Promise<Object>} - Translation result
   * @throws {Error} - If translation fails
   */
  async translate(text, targetLanguage, sourceLanguage = null) {
    throw new Error('translate() method must be implemented by subclass');
  }

  /**
   * Detect the language of the given text
   * @param {string} text - Text to detect language for
   * @returns {Promise<string>} - Detected language code
   * @throws {Error} - If detection fails
   */
  async detectLanguage(text) {
    throw new Error('detectLanguage() method must be implemented by subclass');
  }

  /**
   * Get list of supported languages
   * @returns {Promise<Array<string>>} - Array of language codes
   */
  async getSupportedLanguages() {
    throw new Error('getSupportedLanguages() method must be implemented by subclass');
  }
}

module.exports = TranslationProvider;
