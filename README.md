# ReadBeyond

<div align="center">

**Break language barriers with AI-powered OCR and Translation**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

</div>

---

## 📖 Business Description

**ReadBeyond** is a production-ready API service that combines Optical Character Recognition (OCR) and Machine Translation to help businesses and developers extract text from images and translate it across multiple languages. 

### The Problem We Solve

In today's globalized world, businesses and individuals frequently encounter content in foreign languages embedded in images—from documents, screenshots, signs, menus, and more. Manually transcribing and translating this content is time-consuming, error-prone, and doesn't scale.

### Our Solution

ReadBeyond provides a unified API that:
- **Extracts text from images** using advanced OCR technology (Tesseract.js)
- **Translates text** into 100+ languages using free translation services
- **Processes everything in real-time** with optimized performance
- **Scales efficiently** with worker thread pools and proper architecture

### Use Cases

- **Document Processing**: Extract and translate text from scanned documents, PDFs, and images
- **Mobile Apps**: Enable users to translate text from camera captures
- **Content Management**: Automate translation of image-based content
- **Accessibility**: Make image-based content accessible in multiple languages
- **E-commerce**: Translate product descriptions and labels from images
- **Travel & Tourism**: Translate signs, menus, and information boards
- **Education**: Help students learn by translating educational materials

### Key Differentiators

✅ **Free Translation Service** - Uses MyMemory API (no API keys required)  
✅ **Production-Ready** - Clean architecture, error handling, logging, security  
✅ **High Performance** - Worker threads, image preprocessing, connection pooling  
✅ **Scalable** - Stateless design, Docker-ready, horizontal scaling support  
✅ **Developer-Friendly** - RESTful API, comprehensive documentation, Postman collection  

---

## ✨ Features

### OCR Capabilities
- Extract text from JPEG, PNG, and WebP images
- Support for 100+ languages
- Automatic image preprocessing for better accuracy
- Configurable OCR language detection
- Confidence scores for extracted text

### Translation Capabilities
- Translate text to 100+ languages
- Automatic source language detection
- Fast heuristic-based language detection
- Free translation service (MyMemory API)
- Support for multiple translation providers

### Technical Features
- **Clean Architecture**: Controller → Service → Provider pattern
- **Worker Thread Pool**: Non-blocking OCR processing
- **Image Preprocessing**: Grayscale, contrast enhancement, sharpening
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Rate Limiting**: Configurable rate limits per IP
- **Security**: Helmet.js, CORS, input validation
- **Logging**: Structured logging with Pino
- **Docker Support**: Multi-stage builds, health checks
- **Timeout Handling**: Prevents hanging requests

---

## 🏗️ Architecture

ReadBeyond follows a clean, layered architecture:

```
┌─────────────────────────────────────────┐
│         HTTP Layer (Express)            │
│  Routes → Controllers → Middleware      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  OCR Service | Translation Service      │
│  (Business Logic & Orchestration)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Provider Layer                  │
│  Tesseract.js | MyMemory API            │
│  (External API Abstraction)             │
└─────────────────────────────────────────┘
```

### Key Design Principles

- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Injection**: Easy to swap providers or mock for testing
- **Provider Abstraction**: Switch translation providers without code changes
- **Non-blocking**: Worker threads prevent event loop blocking
- **Stateless**: Enables horizontal scaling

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- (Optional) Docker for containerized deployment

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ReadBeyond
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your preferred settings (optional)
```

4. **Start the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

### Verify Installation

```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T00:00:00.000Z",
  "services": {
    "api": "healthy",
    "ocr": "healthy",
    "workerPool": {
      "initialized": true,
      "activeWorkers": 0,
      "totalWorkers": 2,
      "queuedTasks": 0
    }
  }
}
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T00:00:00.000Z",
  "services": {
    "api": "healthy",
    "ocr": "healthy",
    "workerPool": {
      "initialized": true,
      "activeWorkers": 0,
      "totalWorkers": 2,
      "queuedTasks": 0
    }
  }
}
```

#### 2. Upload & OCR
```http
POST /api/upload
Content-Type: multipart/form-data
```

**Parameters:**
- `image` (file, required): Image file (JPEG, PNG, or WebP)
- `language` (query, optional): OCR language code (default: `eng`)
- `preprocess` (query, optional): Enable preprocessing (default: `true`)

**Example:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "image=@document.jpg" \
  -F "language=eng" \
  -F "preprocess=true"
```

**Response:**
```json
{
  "status": "success",
  "message": "Image processed successfully",
  "data": {
    "filename": "document.jpg",
    "mimetype": "image/jpeg",
    "size": 123456,
    "text": "Extracted text from image...",
    "confidence": 95.5,
    "language": "eng",
    "processingTime": 1234,
    "wordCount": 42
  }
}
```

#### 3. Translation
```http
POST /api/translate
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hello, world!",
  "targetLanguage": "ar",
  "sourceLanguage": "en"  // Optional, auto-detected if not provided
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, world!",
    "targetLanguage": "ar"
  }'
```

**Response:**
```json
{
  "original": "Hello, world!",
  "translated": "مرحبا بالعالم",
  "targetLanguage": "ar",
  "sourceLanguage": "en",
  "confidence": 0.95
}
```

### Error Responses

All errors follow this format:
```json
{
  "error": {
    "message": "Error description",
    "details": []  // Optional, for validation errors
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors, missing parameters)
- `408` - Request Timeout
- `413` - Payload Too Large (file exceeds 5MB)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OCR Configuration
OCR_TIMEOUT_MS=30000
OCR_WORKER_THREADS=2
OCR_LANGUAGES=eng
IMAGE_PREPROCESSING_ENABLED=true

# Translation Configuration
TRANSLATION_PROVIDER=mymemory  # 'mymemory' or 'libretranslate'
LIBRETRANSLATE_API_URL=https://libretranslate.com  # Only if using LibreTranslate
TRANSLATION_TIMEOUT_MS=15000
TRANSLATION_MAX_RETRIES=2
TRANSLATION_RETRY_DELAY_MS=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

### Supported OCR Languages

Common language codes:
- `eng` - English
- `ara` - Arabic
- `spa` - Spanish
- `fra` - French
- `deu` - German
- `chi_sim` - Chinese (Simplified)
- `jpn` - Japanese
- `kor` - Korean

[Full list of Tesseract languages](https://tesseract-ocr.github.io/tessdoc/Data-Files.html)

### Supported Translation Languages

100+ languages including:
- `en` - English
- `ar` - Arabic
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- And many more...

---

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t readbeyond .

# Run the container
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  readbeyond
```

### Docker Compose

```bash
docker-compose up -d
```

The `docker-compose.yml` file includes:
- Multi-stage build optimization
- Health checks
- Resource limits
- Environment variable configuration

---

## 📁 Project Structure

```
ReadBeyond/
├── src/
│   ├── server.js                    # Application entry point
│   ├── routes/                      # Route definitions
│   │   ├── index.js                # Health check
│   │   ├── upload.js               # Upload & OCR endpoint
│   │   ├── ocr.js                  # OCR endpoint (alternative)
│   │   └── translate.js            # Translation endpoint
│   ├── controllers/                 # Thin HTTP handlers
│   │   ├── uploadController.js
│   │   ├── ocrController.js
│   │   └── translateController.js
│   ├── services/                    # Business logic layer
│   │   ├── ocrService.js
│   │   ├── translationService.js
│   │   └── imagePreprocessingService.js
│   ├── providers/                   # External API abstractions
│   │   ├── translationProvider.js  # Abstract base class
│   │   ├── myMemoryProvider.js    # MyMemory implementation
│   │   └── libreTranslateProvider.js  # LibreTranslate implementation
│   ├── validators/                  # Input validation
│   │   ├── ocrValidator.js
│   │   └── translateValidator.js
│   ├── middleware/                  # Express middleware
│   │   ├── errorHandler.js
│   │   ├── uploadMiddleware.js
│   │   ├── timeoutMiddleware.js
│   │   └── asyncHandler.js
│   ├── workers/                     # Worker threads
│   │   └── ocrWorker.js
│   ├── utils/                       # Utilities
│   │   ├── logger.js
│   │   └── workerPool.js
│   └── config/                      # Configuration
│       ├── env.js
│       └── tesseract.js
├── Dockerfile                       # Docker configuration
├── docker-compose.yml               # Docker Compose setup
├── .dockerignore                    # Docker ignore rules
├── .env.example                     # Environment variables template
├── package.json                     # Dependencies
├── ReadBeyond_API.postman_collection.json  # Postman collection
└── README.md                        # This file
```

---

## 🧪 Testing

### Using Postman

1. Import `ReadBeyond_API.postman_collection.json` into Postman
2. Set the `base_url` variable to `http://localhost:3000`
3. Start testing the endpoints

See `POSTMAN_SETUP.md` for detailed instructions.

### Manual Testing

**Test OCR:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "image=@test-image.jpg"
```

**Test Translation:**
```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "targetLanguage": "ar"}'
```

---

## 🔒 Security

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes)
- **Input Validation**: All inputs are validated
- **File Type Validation**: Only allowed image types accepted
- **File Size Limits**: Maximum 5MB per file
- **Error Handling**: No sensitive information leaked in errors

---

## 📊 Performance

### Optimizations

- **Worker Thread Pool**: OCR runs in separate threads (non-blocking)
- **Image Preprocessing**: Optimizes images before OCR (faster processing)
- **Connection Pooling**: HTTP keep-alive for translation API
- **Fast Language Detection**: Heuristic-based (no API calls)
- **Response Compression**: Gzip compression for responses

### Benchmarks

- **OCR Processing**: ~1-3 seconds per image (depending on size/complexity)
- **Translation**: ~1-2 seconds per request
- **Language Detection**: <1ms (heuristic-based)

---

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for automatic server restart on file changes.

### Adding a New Translation Provider

1. Create a new provider class extending `TranslationProvider`
2. Implement required methods: `translate()`, `detectLanguage()`, `getSupportedLanguages()`
3. Update `translationService.js` to support the new provider
4. Set `TRANSLATION_PROVIDER` environment variable

Example:
```javascript
// src/providers/googleTranslateProvider.js
class GoogleTranslateProvider extends TranslationProvider {
  async translate(text, targetLanguage, sourceLanguage) {
    // Implementation
  }
}
```

---

## 📝 License

ISC License

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the documentation
- Review the Postman collection for API examples

---

## 🎯 Roadmap

- [ ] Add caching layer (Redis) for translations
- [ ] Support for batch OCR processing
- [ ] WebSocket support for real-time processing
- [ ] Additional translation providers (Google Translate, DeepL)
- [ ] PDF document support
- [ ] Image quality enhancement
- [ ] Multi-language OCR (detect multiple languages in one image)
- [ ] API authentication and user management

---

## 🙏 Acknowledgments

- [Tesseract.js](https://github.com/naptha/tesseract.js) - OCR engine
- [MyMemory Translation API](https://mymemory.translated.net/) - Free translation service
- [Express.js](https://expressjs.com/) - Web framework
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing

---

<div align="center">

**Made with ❤️ for breaking language barriers**

[⬆ Back to Top](#readbeyond)

</div>
