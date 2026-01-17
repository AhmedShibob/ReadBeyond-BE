const ocrService = require("../services/ocrService");
const logger = require("../utils/logger");
const config = require("../config/env");

const uploadImage = async (req, res) => {
  // File is available at req.file after middleware validation
  // File buffer is available at req.file.buffer for OCR processing
  // File metadata: req.file.originalname, req.file.mimetype, req.file.size

  // OCR is always performed by default
  // Optional query parameters: language, preprocess
  const language = req.query.language || config.OCR_LANGUAGES;
  const preprocess = req.query.preprocess !== 'false'; // Default to true

  try {
    logger.info({
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      language,
      preprocess,
    }, 'OCR request via upload endpoint');

    // Always perform OCR on uploaded image
    const ocrResult = await ocrService.extractText(req.file.buffer, {
      language,
      preprocess,
    });

    res.status(200).json({
      status: "success",
      message: "Image processed successfully",
      data: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        language: ocrResult.language,
        processingTime: ocrResult.processingTime,
        wordCount: ocrResult.wordCount,
      },
    });
  } catch (error) {
    // Error will be caught by asyncHandler and passed to errorHandler
    throw error;
  }
};

module.exports = uploadImage;
