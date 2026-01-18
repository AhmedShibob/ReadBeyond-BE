const config = require('./env');

const tesseractConfig = {
  // OCR engine options - optimized for speed
  options: {
    lang: config.OCR_LANGUAGES,
    // Performance tuning - optimized for speed
    // Fast mode: Use sparse text mode (11) for maximum speed
    // Normal mode: Use uniform block (6) for balance
    tessedit_pageseg_mode: config.OCR_FAST_MODE ? '11' : '6', // Uniform block of text (faster than auto-detection)
    // Alternative modes for different content:
    // '1' = Auto with OSD (slower but more accurate)
    // '6' = Uniform block (faster, good for most images)
    // '11' = Sparse text (fastest, for single words/lines)
    tessedit_char_whitelist: '', // Empty = all characters
    // Quality settings
    preserve_interword_spaces: '1',
    // Speed optimizations
    tessedit_do_invert: '0', // Don't invert (faster)
    classify_bln_numeric_mode: '0', // Disable numeric mode (faster)
  },
  // Worker options
  workerOptions: {
    logger: (m) => {
      // Suppress verbose Tesseract logs in production
      if (config.NODE_ENV === 'development') {
        console.log('[Tesseract]', m);
      }
    },
    // Cache path for faster subsequent loads
    cachePath: process.env.TESSERACT_CACHE_PATH || undefined,
  },
};

module.exports = tesseractConfig;
