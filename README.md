# ReadBeyond

Express server with translation API endpoints.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (optional, defaults are provided).

## Running the Server

### Development Mode
```bash
npm run dev
```
This uses nodemon for auto-reload on file changes.

### Production Mode
```bash
npm start
```

The server will start on port 3000 by default (configurable via `PORT` environment variable).

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status and timestamp
- Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Translate
- **POST** `/api/translate`
- Accepts translation request
- Request body:
```json
{
  "text": "Hello, world!",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```
- Response:
```json
{
  "translated": "dummy translation",
  "original": "Hello, world!",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

## Project Structure

```
ReadBeyond/
├── src/
│   ├── server.js          # Main server entry point
│   ├── routes/
│   │   ├── index.js       # Health endpoint
│   │   └── translate.js   # Translate endpoint
│   ├── middleware/
│   │   └── errorHandler.js # Error handling middleware
│   └── config/
│       └── env.js         # Environment configuration
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment file
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: development)

## Error Handling

The server includes centralized error handling middleware that:
- Returns appropriate HTTP status codes
- Provides error messages
- Logs detailed errors in development mode
