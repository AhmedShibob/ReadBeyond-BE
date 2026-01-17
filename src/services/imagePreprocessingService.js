const sharp = require('sharp');
const logger = require('../utils/logger');

class ImagePreprocessingService {
  /**
   * Preprocess image for better OCR accuracy and speed
   * @param {Buffer} imageBuffer - Original image buffer
   * @returns {Promise<Buffer>} - Preprocessed image buffer
   */
  async preprocess(imageBuffer) {
    const startTime = Date.now();

    try {
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      logger.debug({ 
        width: metadata.width, 
        height: metadata.height, 
        format: metadata.format 
      }, 'Original image metadata');

      // Preprocessing pipeline
      let pipeline = sharp(imageBuffer);

      // 1. Resize if too large (max 2000px on longest side)
      const maxDimension = 2000;
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        pipeline = pipeline.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        });
        logger.debug('Image resized for optimization');
      }

      // 2. Convert to grayscale (reduces noise, improves OCR)
      pipeline = pipeline.greyscale();

      // 3. Enhance contrast
      pipeline = pipeline.normalize();

      // 4. Apply sharpening filter
      pipeline = pipeline.sharpen({
        sigma: 1,
        flat: 1,
        jagged: 2,
      });

      // 5. Convert to PNG format (Tesseract works best with PNG)
      const processedBuffer = await pipeline.png().toBuffer();

      const processingTime = Date.now() - startTime;
      logger.debug({ processingTime: `${processingTime}ms` }, 'Image preprocessing completed');

      return processedBuffer;
    } catch (error) {
      logger.logError(error, { context: 'Image preprocessing failed' });
      throw new Error('Image preprocessing failed: ' + error.message);
    }
  }

  /**
   * Validate image buffer
   * @param {Buffer} imageBuffer - Image buffer to validate
   * @returns {Promise<boolean>} - True if valid image
   */
  async validateImage(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return metadata.width > 0 && metadata.height > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new ImagePreprocessingService();
