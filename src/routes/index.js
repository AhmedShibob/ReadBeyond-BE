const express = require('express');
const router = express.Router();
const workerPool = require('../utils/workerPool');

// Health check endpoint with OCR service status
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      ocr: workerPool.initialized ? 'healthy' : 'initializing',
      workerPool: {
        initialized: workerPool.initialized,
        activeWorkers: workerPool.activeWorkers.size,
        totalWorkers: workerPool.workers.length,
        queuedTasks: workerPool.queue.length,
      },
    },
  };

  const statusCode = health.services.ocr === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
