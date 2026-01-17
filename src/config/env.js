require('dotenv').config();

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  OCR_TIMEOUT_MS: parseInt(process.env.OCR_TIMEOUT_MS) || 30000,
  OCR_WORKER_THREADS: parseInt(process.env.OCR_WORKER_THREADS) || 2,
  OCR_LANGUAGES: process.env.OCR_LANGUAGES || 'eng',
  IMAGE_PREPROCESSING_ENABLED: process.env.IMAGE_PREPROCESSING_ENABLED !== 'false',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 30 * 60 * 1000, // 30 minutes (0.5 hour)
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
  // Translation configuration
  // Using MyMemory Translation API (free, no API key required)
  // Alternative: Set TRANSLATION_PROVIDER=libretranslate to use LibreTranslate (requires self-hosting or paid plan)
  TRANSLATION_PROVIDER: process.env.TRANSLATION_PROVIDER || 'mymemory', // 'mymemory' or 'libretranslate'
  LIBRETRANSLATE_API_URL: process.env.LIBRETRANSLATE_API_URL || 'https://libretranslate.com',
  TRANSLATION_TIMEOUT_MS: parseInt(process.env.TRANSLATION_TIMEOUT_MS) || 15000, // Increased for longer texts
  TRANSLATION_MAX_RETRIES: parseInt(process.env.TRANSLATION_MAX_RETRIES) || 2,
  TRANSLATION_RETRY_DELAY_MS: parseInt(process.env.TRANSLATION_RETRY_DELAY_MS) || 1000,
  // Supported languages (common ones, can be extended)
  SUPPORTED_LANGUAGES: [
    'en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'fi', 'no', 'cs', 'ro', 'hu', 'el', 'he', 'th', 'vi', 'id', 'uk', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt', 'mt', 'ga', 'cy'
  ],
};

// Validate required environment variables if needed
// Add validation logic here for production

module.exports = config;
