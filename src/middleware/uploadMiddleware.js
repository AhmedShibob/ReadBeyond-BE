const multer = require('multer');
const config = require('../config/env');

// Configure multer with memory storage
// Memory storage stores files in Buffer objects in RAM
// This is ideal for immediate processing (OCR pipeline) without disk I/O overhead
const storage = multer.memoryStorage();

// Configure multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 1, // Only allow one file
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (config.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed'), false);
    }
  },
});

// Middleware to handle single file upload with field name 'image'
const uploadMiddleware = upload.single('image');

// Wrapper middleware to handle errors and validation
const handleUpload = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      // Handle multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: {
            message: 'File size exceeds maximum limit of 5MB',
          },
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          error: {
            message: 'Unexpected file field. Use "image" as the field name.',
          },
        });
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: {
            message: 'Only one file is allowed per request',
          },
        });
      }

      // Handle MIME type validation errors
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
          error: {
            message: err.message,
          },
        });
      }

      // Pass other errors to error handler
      return next(err);
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'No file uploaded',
        },
      });
    }

    // File is valid, proceed to controller
    next();
  });
};

module.exports = handleUpload;
