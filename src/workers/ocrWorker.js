const { parentPort } = require('worker_threads');
const Tesseract = require('tesseract.js');
const tesseractConfig = require('../config/tesseract');

// Initialize Tesseract worker when this worker thread starts
let tesseractWorker = null;

// Initialize Tesseract worker
async function initializeTesseract() {
  if (!tesseractWorker) {
    tesseractWorker = await Tesseract.createWorker(
      tesseractConfig.options.lang,
      1, // OEM_LSTM_ONLY
      tesseractConfig.workerOptions
    );

    // Set OCR options
    await tesseractWorker.setParameters(tesseractConfig.options);
  }
  return tesseractWorker;
}

// Initialize Tesseract on worker startup
(async () => {
  try {
    await initializeTesseract();
    // Signal that worker is ready
    parentPort.postMessage({ type: 'ready' });
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      error: `Worker initialization failed: ${error.message}`,
    });
  }
})();

// Handle messages from main thread
parentPort.on('message', async (message) => {
  if (message.type === 'task') {
    try {
      const { imageBuffer, options } = message.data;

      // Ensure worker is initialized
      const worker = await initializeTesseract();

      // Perform OCR with optimized options
      // Using recognize() with minimal options for faster processing
      const { data } = await worker.recognize(imageBuffer, {
        rectangle: undefined, // Process entire image (faster than region detection)
      });

      // Send result back to main thread
      parentPort.postMessage({
        type: 'result',
        data: {
          text: data.text.trim(),
          confidence: data.confidence,
          words: data.words,
        },
      });
    } catch (error) {
      // Send error back to main thread
      parentPort.postMessage({
        type: 'error',
        error: error.message,
      });
    }
  } else if (message.type === 'shutdown') {
    // Cleanup
    if (tesseractWorker) {
      await tesseractWorker.terminate();
      tesseractWorker = null;
    }
    process.exit(0);
  }
});

// Handle worker errors
process.on('uncaughtException', (error) => {
  parentPort.postMessage({
    type: 'error',
    error: error.message,
  });
});
