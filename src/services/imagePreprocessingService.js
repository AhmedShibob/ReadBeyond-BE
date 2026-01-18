const sharp = require('sharp');
const logger = require('../utils/logger');
const config = require('../config/env');

class ImagePreprocessingService {
  /**
   * Preprocess image for better OCR accuracy and speed
   * @param {Buffer} imageBuffer - Original image buffer
   * @returns {Promise<Buffer>} - Preprocessed image buffer
   */
  async preprocess(imageBuffer) {
    const startTime = Date.now();

    try {
      // Get image metadata (cached for reuse)
      const metadata = await sharp(imageBuffer).metadata();
      logger.debug({ 
        width: metadata.width, 
        height: metadata.height, 
        format: metadata.format 
      }, 'Original image metadata');

      // Skip preprocessing if image is already small and in good format
      if (metadata.width <= 1500 && metadata.height <= 1500 && metadata.format === 'png') {
        logger.debug('Image already optimized, skipping preprocessing');
        return imageBuffer;
      }

      // Preprocessing pipeline - optimized for speed
      let pipeline = sharp(imageBuffer);

      // 1. Aggressive resize for faster OCR
      // Smaller images = faster OCR processing
      // Fast mode: 1200px, Normal mode: 1500px
      const maxDimension = config.OCR_FAST_MODE ? 1200 : 1500;
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        pipeline = pipeline.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
          kernel: 'lanczos3', // High quality but fast
        });
        logger.debug('Image resized for optimization');
      }

      // 2. Convert to grayscale (reduces noise, improves OCR, faster processing)
      pipeline = pipeline.greyscale();

      // 3. Enhance contrast (normalize) - improves accuracy
      pipeline = pipeline.normalize();

      // 4. Light sharpening (reduced for speed, skip in fast mode)
      if (!config.OCR_FAST_MODE) {
        pipeline = pipeline.sharpen({
          sigma: 0.5, // Reduced from 1 for faster processing
          flat: 1,
          jagged: 1.5, // Reduced from 2
        });
      }

      // 5. Convert to PNG format with compression (Tesseract works best with PNG)
      // Using compression level 6 (balance between size and speed)
      const processedBuffer = await pipeline.png({ 
        compressionLevel: 6,
        quality: 90 
      }).toBuffer();

      const processingTime = Date.now() - startTime;
      logger.debug({ processingTime: `${processingTime}ms` }, 'Image preprocessing completed');

      return processedBuffer;
    } catch (error) {
      logger.logError(error, { context: 'Image preprocessing failed' });
      throw new Error('Image preprocessing failed: ' + error.message);
    }
  }

  /**
   * Validate image buffer (optimized - minimal metadata read)
   * @param {Buffer} imageBuffer - Image buffer to validate
   * @returns {Promise<boolean>} - True if valid image
   */
  async validateImage(imageBuffer) {
    try {
      // Quick validation - just check if we can read metadata
      // Using failOn: 'none' for faster processing
      const metadata = await sharp(imageBuffer, { failOn: 'none' }).metadata();
      return metadata && metadata.width > 0 && metadata.height > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new ImagePreprocessingService();
