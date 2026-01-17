const config = require('./env');

const tesseractConfig = {
  // OCR engine options
  options: {
    lang: config.OCR_LANGUAGES,
    // Performance tuning
    tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
    tessedit_char_whitelist: '', // Empty = all characters
    // Quality settings
    preserve_interword_spaces: '1',
  },
  // Worker options
  workerOptions: {
    logger: (m) => {
      // Suppress verbose Tesseract logs in production
      if (config.NODE_ENV === 'development') {
        console.log('[Tesseract]', m);
      }
    },
  },
};

module.exports = tesseractConfig;
