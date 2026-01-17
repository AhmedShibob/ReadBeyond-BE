const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const workerPool = require('./utils/workerPool');
const indexRoutes = require('./routes/index');
const translateRoutes = require('./routes/translate');
const uploadRoutes = require('./routes/upload');
const ocrRoutes = require('./routes/ocr');

// Initialize Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  logger.logRequest(req);

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logResponse(req, res, responseTime);
  });

  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/api', translateRoutes);
app.use('/api', uploadRoutes);
app.use('/api', ocrRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize worker pool and start server
async function startServer() {
  try {
    // Initialize worker pool
    logger.info('Initializing OCR worker pool...');
    await workerPool.initialize();
    logger.info('OCR worker pool initialized');

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info({
        port: config.PORT,
        environment: config.NODE_ENV,
        workerThreads: config.OCR_WORKER_THREADS,
      }, 'Server started successfully');
      console.log(`Server is running on port ${config.PORT}`);
      console.log(`Environment: ${config.NODE_ENV}`);
      console.log(`Health check: http://localhost:${config.PORT}/health`);
      console.log(`OCR endpoint: http://localhost:${config.PORT}/api/ocr`);
    });

    return server;
  } catch (error) {
    logger.logError(error, { context: 'Server startup failed' });
    process.exit(1);
  }
}

const server = startServer();

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown initiated');
  
  try {
    // Close HTTP server
    const s = await server;
    s.close(() => {
      logger.info('HTTP server closed');
    });

    // Shutdown worker pool
    await workerPool.shutdown();
    logger.info('Worker pool shut down');
  } catch (error) {
    logger.logError(error, { context: 'Graceful shutdown error' });
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.logError(new Error(reason), { context: 'Unhandled promise rejection' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.logError(error, { context: 'Uncaught exception' });
  gracefulShutdown('uncaughtException');
});

module.exports = app;
