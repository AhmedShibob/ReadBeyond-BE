const { Worker } = require('worker_threads');
const path = require('path');
const logger = require('./logger');
const config = require('../config/env');

class WorkerPool {
  constructor(workerPath, poolSize) {
    this.workerPath = workerPath;
    this.poolSize = poolSize || config.OCR_WORKER_THREADS;
    this.workers = [];
    this.queue = [];
    this.activeWorkers = new Set();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    logger.info({ poolSize: this.poolSize }, 'Initializing worker pool');

    // Create worker pool
    for (let i = 0; i < this.poolSize; i++) {
      await this.createWorker();
    }

    this.initialized = true;
    logger.info('Worker pool initialized');
  }

  async createWorker() {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.workerPath);

      worker.on('message', (result) => {
        if (result.type === 'ready') {
          this.workers.push(worker);
          logger.debug({ workerId: worker.threadId }, 'Worker ready');
          resolve(worker);
        }
      });

      worker.on('error', (error) => {
        logger.logError(error, { workerId: worker.threadId });
        this.removeWorker(worker);
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          logger.warn({ workerId: worker.threadId, exitCode: code }, 'Worker exited');
          this.removeWorker(worker);
          // Restart worker if pool is below size
          if (this.workers.length < this.poolSize) {
            this.createWorker().catch((err) => {
              logger.logError(err, { context: 'Worker restart failed' });
            });
          }
        }
      });
    });
  }

  removeWorker(worker) {
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }
    this.activeWorkers.delete(worker);
  }

  async executeTask(taskData, timeout = config.OCR_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      // Check if pool is initialized
      if (!this.initialized) {
        return reject(new Error('Worker pool not initialized'));
      }

      // Find available worker
      const worker = this.workers.find(w => !this.activeWorkers.has(w));

      if (!worker) {
        // All workers busy, queue the task
        logger.debug('All workers busy, queuing task');
        this.queue.push({ taskData, resolve, reject, timeout });
        return;
      }

      // Execute task immediately
      this.runTask(worker, taskData, timeout, resolve, reject);
    });
  }

  runTask(worker, taskData, timeout, resolve, reject) {
    this.activeWorkers.add(worker);

    const timeoutId = setTimeout(() => {
      logger.warn({ workerId: worker.threadId }, 'Task timeout, terminating worker');
      worker.terminate();
      this.removeWorker(worker);
      // Restart worker
      this.createWorker().catch((err) => {
        logger.logError(err, { context: 'Worker restart after timeout failed' });
      });
      reject(new Error('OCR processing timeout'));
    }, timeout);

    const messageHandler = (result) => {
      if (result.type === 'result') {
        clearTimeout(timeoutId);
        this.activeWorkers.delete(worker);
        resolve(result.data);
        // Process next queued task
        this.processQueue();
      } else if (result.type === 'error') {
        clearTimeout(timeoutId);
        this.activeWorkers.delete(worker);
        reject(new Error(result.error));
        // Process next queued task
        this.processQueue();
      }
    };

    const errorHandler = (error) => {
      clearTimeout(timeoutId);
      this.activeWorkers.delete(worker);
      logger.logError(error, { workerId: worker.threadId });
      reject(error);
      // Process next queued task
      this.processQueue();
    };

    worker.once('message', messageHandler);
    worker.once('error', errorHandler);

    // Send task to worker
    worker.postMessage({ type: 'task', data: taskData });
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const worker = this.workers.find(w => !this.activeWorkers.has(w));
    if (!worker) return;

    const { taskData, resolve, reject, timeout } = this.queue.shift();
    this.runTask(worker, taskData, timeout, resolve, reject);
  }

  async shutdown() {
    logger.info('Shutting down worker pool');
    const shutdownPromises = this.workers.map(worker => {
      return new Promise((resolve) => {
        worker.once('exit', () => resolve());
        worker.terminate();
      });
    });

    await Promise.all(shutdownPromises);
    this.workers = [];
    this.activeWorkers.clear();
    this.queue = [];
    this.initialized = false;
    logger.info('Worker pool shut down');
  }
}

// Create singleton instance
const ocrWorkerPool = new WorkerPool(
  path.join(__dirname, '../workers/ocrWorker.js'),
  config.OCR_WORKER_THREADS
);

module.exports = ocrWorkerPool;
