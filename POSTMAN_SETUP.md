# Postman Collection Setup Guide

## Importing the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select the `ReadBeyond_API.postman_collection.json` file
4. The collection will appear in your Postman sidebar

## Environment Variables

The collection uses the following variables:

- `base_url`: Base URL of your API (default: `http://localhost:3000`)
- `ocr_extracted_text`: Used for pipeline testing (set manually)

### Setting Variables

1. Click on the collection name
2. Go to **Variables** tab
3. Update `base_url` if your server runs on a different port
4. For production, create a Postman Environment with:
   - `base_url`: Your production URL

## API Endpoints

### 1. Health Check
- **GET** `/health`
- Checks server and OCR service status

### 2. Upload & OCR
- **POST** `/api/upload`
- Uploads an image and automatically performs OCR
- **Query Parameters**:
  - `language`: OCR language code (optional, default: `eng`)
  - `preprocess`: Enable preprocessing (optional, default: `true`)
- **Body**: `form-data` with `image` field (file type)

**Example Response:**
```json
{
  "status": "success",
  "message": "Image processed successfully",
  "data": {
    "filename": "image.jpg",
    "mimetype": "image/jpeg",
    "size": 12345,
    "text": "Extracted text...",
    "confidence": 95.5,
    "language": "eng",
    "processingTime": 1234,
    "wordCount": 10
  }
}
```

### 3. Translation
- **POST** `/api/translate`
- Translates text to target language
- **Body** (JSON):
  ```json
  {
    "text": "Hello, world!",
    "targetLanguage": "ar"
  }
  ```
- **Optional**: `sourceLanguage` (auto-detected if not provided)

**Example Response:**
```json
{
  "original": "Hello, world!",
  "translated": "مرحبا بالعالم",
  "targetLanguage": "ar",
  "sourceLanguage": "en",
  "confidence": 0.95
}
```

## Testing Workflows

### Basic OCR Test
1. Use **Upload Image with OCR** request
2. Select an image file (JPEG, PNG, or WebP)
3. Send request
4. Check response for extracted text

### Basic Translation Test
1. Use **Translate Text - English to Arabic** request
2. Modify the text if needed
3. Send request
4. Check translated text

### OCR → Translation Pipeline
1. Run **Upload Image with OCR** request
2. Copy the `text` field from response
3. Open **Complete Pipeline - OCR then Translate** request
4. Replace `{{ocr_extracted_text}}` with the copied text
5. Or manually update the JSON body with the extracted text
6. Send translation request

### Error Testing
The collection includes error test cases:
- Missing file upload
- Invalid file type
- Missing text in translation
- Missing target language
- Invalid language codes

## Supported Languages

### OCR Languages
Common language codes:
- `eng` - English
- `ara` - Arabic
- `spa` - Spanish
- `fra` - French
- `deu` - German
- `chi_sim` - Chinese (Simplified)
- `jpn` - Japanese
- `kor` - Korean

### Translation Languages
Supported language codes include:
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
- And many more (see `SUPPORTED_LANGUAGES` in config)

## Tips

1. **File Upload**: Make sure to select "File" type (not "Text") for the image field in form-data
2. **Content-Type**: Translation requests require `Content-Type: application/json` header
3. **Error Responses**: Check the `error.message` field for detailed error information
4. **Rate Limiting**: The API has rate limiting (100 requests per 15 minutes by default)
5. **Timeouts**: OCR requests may take 10-30 seconds depending on image complexity

## Troubleshooting

### Connection Refused
- Make sure the server is running: `npm start` or `npm run dev`
- Check if the port matches `base_url` variable (default: 3000)

### Validation Errors
- Check request body format matches examples
- Ensure required fields are present
- Verify language codes are supported

### Translation Service Errors
- Check if LibreTranslate API is accessible
- Verify `LIBRETRANSLATE_API_URL` environment variable is set correctly
- Check network connectivity

### OCR Timeout
- Large images may take longer to process
- Try enabling preprocessing (default: enabled)
- Reduce image size if possible
