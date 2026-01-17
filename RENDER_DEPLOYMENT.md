# Render Deployment Guide

This guide will help you deploy ReadBeyond to Render.

## Prerequisites

- GitHub/GitLab account with your ReadBeyond repository
- Render account (sign up at [render.com](https://render.com))

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create a new Blueprint in Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub/GitLab repository
   - Render will automatically detect `render.yaml` and configure the service

3. **Review and Deploy**
   - Review the service configuration
   - Click "Apply" to deploy
   - Render will build and deploy your application

### Option 2: Manual Configuration

1. **Create a new Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub/GitLab repository

2. **Configure the Service**
   - **Name**: `readbeyond-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or `./` if needed)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: 
     - `Free` for testing (512MB RAM, spins down after inactivity)
     - `Starter` for production ($7/month, 512MB-2GB RAM, always on)
     - `Standard` for high traffic ($25/month, 2GB+ RAM, always on)

3. **Set Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   NODE_ENV=production
   PORT=10000
   OCR_WORKER_THREADS=2
   OCR_TIMEOUT_MS=30000
   IMAGE_PREPROCESSING_ENABLED=true
   TRANSLATION_PROVIDER=mymemory
   TRANSLATION_TIMEOUT_MS=15000
   RATE_LIMIT_WINDOW_MS=1800000
   RATE_LIMIT_MAX_REQUESTS=20
   LOG_LEVEL=info
   ```

4. **Configure Health Check**
   - **Health Check Path**: `/health`
   - Render will automatically monitor this endpoint

5. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete (usually 2-5 minutes)
   - Your API will be live at `https://your-app-name.onrender.com`

## Post-Deployment

### Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-app-name.onrender.com/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "services": {
       "api": "healthy",
       "ocr": "healthy"
     }
   }
   ```

2. **Test OCR Endpoint**
   ```bash
   curl -X POST https://your-app-name.onrender.com/api/upload \
     -F "image=@test-image.jpg"
   ```

3. **Test Translation Endpoint**
   ```bash
   curl -X POST https://your-app-name.onrender.com/api/translate \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello", "targetLanguage": "ar"}'
   ```

### Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions
5. Render will automatically provision SSL certificate

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port (Render sets automatically) |
| `OCR_WORKER_THREADS` | `2` | Number of OCR worker threads |
| `OCR_TIMEOUT_MS` | `30000` | OCR processing timeout |
| `IMAGE_PREPROCESSING_ENABLED` | `true` | Enable image preprocessing |
| `TRANSLATION_PROVIDER` | `mymemory` | Translation provider |
| `TRANSLATION_TIMEOUT_MS` | `15000` | Translation timeout |
| `RATE_LIMIT_WINDOW_MS` | `1800000` | Rate limit window (30 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `20` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging level |

## Troubleshooting

### Service Won't Start

1. **Check Build Logs**
   - Go to your service → "Logs"
   - Look for build errors
   - Common issues: missing dependencies, Node version mismatch

2. **Check Runtime Logs**
   - Look for startup errors
   - Verify environment variables are set correctly

3. **Verify PORT**
   - Render automatically sets `PORT` environment variable
   - Make sure your app uses `process.env.PORT`

### Health Check Failing

1. **Verify Health Endpoint**
   - Test locally: `curl http://localhost:3000/health`
   - Should return `200 OK`

2. **Check Service Logs**
   - Look for errors in the health check endpoint
   - Verify worker pool initialization

### High Memory Usage

1. **Reduce Worker Threads**
   - Set `OCR_WORKER_THREADS=1` for free tier
   - Free tier has 512MB RAM limit

2. **Upgrade Plan**
   - Consider `Starter` plan for production
   - Provides more memory and always-on service

### Slow Response Times

1. **Free Tier Spin-down**
   - Free tier services spin down after 15 min inactivity
   - First request after spin-down takes 30-60 seconds
   - Upgrade to `Starter` for always-on service

2. **Check Logs**
   - Look for timeout errors
   - Adjust `OCR_TIMEOUT_MS` if needed

## Production Recommendations

1. **Upgrade to Starter Plan**
   - Always-on service (no spin-down)
   - More memory for OCR processing
   - Better performance

2. **Set Appropriate Worker Threads**
   - `OCR_WORKER_THREADS=2` for Starter plan
   - `OCR_WORKER_THREADS=4` for Standard plan

3. **Monitor Logs**
   - Regularly check service logs
   - Set up alerts for errors

4. **Use Custom Domain**
   - More professional API endpoint
   - Better for production use

5. **Enable Auto-Deploy**
   - Render can auto-deploy on git push
   - Enable in service settings

## Support

- [Render Documentation](https://render.com/docs)
- [Render Status](https://status.render.com)
- [Render Community](https://community.render.com)
