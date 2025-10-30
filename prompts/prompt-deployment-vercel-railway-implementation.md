# Deployment Implementation: Vercel + Railway

## Context

You are helping migrate a Next.js + FastAPI application from local development to production deployment using Vercel (frontend) and Railway (backend). The application is "Chat-To-PDF" - a document chat application using OpenAI for AI responses.

**Current State:**
- Next.js frontend (in `/web` directory)
- FastAPI backend (in `/api` directory)
- Docker Compose for local development
- Hardcoded `localhost` URLs in several files
- CORS configured only for `localhost:3000`
- No deployment configuration files exist

**Goal:**
- Deploy Next.js to Vercel (free tier)
- Deploy FastAPI to Railway ($10-15/month)
- Make all URLs configurable via environment variables
- Maintain backward compatibility with local development

**Technology Stack:**
- Frontend: Next.js 15.5.5, React 19, TypeScript
- Backend: FastAPI (Python), OpenAI API, FAISS vector search
- Deployment: Vercel + Railway

---

## Task 1: Update FastAPI CORS Configuration

**Objective:** Make CORS origins configurable via environment variable to support production domains.

**File:** `/api/app/main.py`

**Current code (around line 154-161):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Replace with:**
```python
import os

# Get allowed origins from environment variable (comma-separated)
# Default to localhost for development, but allow production domains
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Important Notes:**
- Place the `import os` at the top of the file if not already present
- The `ALLOWED_ORIGINS` variable definition should be placed BEFORE the `app.add_middleware()` call
- This allows multiple origins separated by commas, e.g., `http://localhost:3000,https://app.vercel.app`

---

## Task 2: Update Next.js Upload Route

**Objective:** Make API base URL configurable and prioritize environment variables correctly.

**File:** `/web/src/app/api/upload/route.ts`

**Current code (line 2):**
```typescript
const base = process.env.API_BASE_URL || 'http://localhost:8000';
```

**Replace with:**
```typescript
const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:8000';
```

**Why this order:**
1. `NEXT_PUBLIC_API_URL` - Vercel production environment variable
2. `API_BASE_URL` - Docker Compose development variable
3. `http://localhost:8000` - Fallback for plain local development

---

## Task 3: Update Next.js Index Status Route

**Objective:** Same as Task 2, make API URL configurable.

**File:** `/web/src/app/api/index/status/route.ts`

**Current code (line 2):**
```typescript
const base = process.env.API_BASE_URL || 'http://localhost:8000';
```

**Replace with:**
```typescript
const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:8000';
```

---

## Task 4: Update Next.js Query Route

**Objective:** Make API URL configurable and fix docker-specific default.

**File:** `/web/src/app/api/query/route.ts`

**Current code (line 3):**
```typescript
const API_BASE_URL = process.env.API_BASE_URL || 'http://api:8000';
```

**Replace with:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:8000';
```

**Note:** We're replacing `http://api:8000` (Docker Compose internal networking) with `http://localhost:8000` as the ultimate fallback.

---

## Task 5: Update VersionBadge Component

**Objective:** Make version endpoint URL configurable for browser-side fetches.

**File:** `/web/src/components/VersionBadge.tsx`

**Find this line (around line 28):**
```typescript
fetch('http://localhost:8000/version')
```

**Look for the full context:**
```typescript
useEffect(() => {
  fetch('http://localhost:8000/version')
    .then((res) => res.json())
    .then((data) => {
      // ... rest of code
    })
    .catch((err) => {
      // ... error handling
    });
}, []);
```

**Replace the hardcoded URL with:**
```typescript
useEffect(() => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  fetch(`${API_URL}/version`)
    .then((res) => res.json())
    .then((data) => {
      // ... rest of code (keep unchanged)
    })
    .catch((err) => {
      // ... error handling (keep unchanged)
    });
}, []);
```

**Important:** This component fetches from the browser, so it MUST use `NEXT_PUBLIC_API_URL` (the `NEXT_PUBLIC_` prefix makes it available to browser-side code).

---

## Task 6: Update docker-compose.yml

**Objective:** Add `NEXT_PUBLIC_API_URL` for browser-side API calls in local development.

**File:** `/docker-compose.yml`

**Current web service environment (around line 8-10):**
```yaml
web:
  build:
    context: .
    dockerfile: Dockerfile.web
  ports:
    - "3000:3000"
  environment:
    - NEXT_TELEMETRY_DISABLED=1
    - API_BASE_URL=http://api:8000
```

**Add the new environment variable:**
```yaml
web:
  build:
    context: .
    dockerfile: Dockerfile.web
  ports:
    - "3000:3000"
  environment:
    - NEXT_TELEMETRY_DISABLED=1
    - API_BASE_URL=http://api:8000
    - NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Why:** VersionBadge component needs this for browser-side fetches even in local development.

---

## Task 7: Update Dockerfile.api for Railway PORT

**Objective:** Make FastAPI listen on Railway's dynamic PORT variable.

**File:** `/Dockerfile.api`

**Find the end of the file (should have a CMD instruction):**

**Current (example - yours may vary):**
```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Replace the CMD and add PORT handling:**
```dockerfile
# Railway provides PORT environment variable dynamically
# Default to 8000 for local development
ENV PORT=${PORT:-8000}
EXPOSE $PORT

# Use shell form to allow variable substitution
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Important Notes:**
- Use shell form (without brackets) for CMD to allow variable substitution
- `${PORT:-8000}` means "use PORT if set, otherwise use 8000"
- This works for both Railway (dynamic port) and local development (port 8000)

---

## Task 8: Create Railway Configuration File

**Objective:** Tell Railway how to build and deploy the FastAPI backend.

**Create new file:** `/railway.json`

**Full contents:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.api"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/healthz",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Explanation:**
- `builder: DOCKERFILE` - Railway will use the Dockerfile
- `dockerfilePath` - Points to the FastAPI Dockerfile
- `healthcheckPath` - Railway pings this endpoint to verify service health
- `restartPolicyType` - Automatically restart if the service crashes

---

## Task 9: Create Backend Environment Variables Example

**Objective:** Document required environment variables for backend deployment.

**Create new file:** `/api/.env.example`

**Full contents:**
```bash
# OpenAI Configuration
# Required: Get your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# CORS Configuration
# Comma-separated list of allowed origins (no spaces)
# Include your Vercel domain here after deployment
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app,https://*.vercel.app

# Railway Configuration
# These are automatically provided by Railway - DO NOT set manually
# PORT=8000
# RAILWAY_ENVIRONMENT=production

# Note: Never commit .env files with actual secrets!
```

**Important:** This is an EXAMPLE file. Users should copy values to their actual Railway dashboard.

---

## Task 10: Create Frontend Environment Variables Example

**Objective:** Document required environment variables for frontend deployment.

**Create new file:** `/web/.env.example`

**Full contents:**
```bash
# API URL Configuration
# Points to your FastAPI backend

# For local development (with docker-compose or local FastAPI)
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production deployment on Vercel
# Set this in Vercel dashboard to your Railway backend URL
# Example: NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app

# Next.js Configuration
NEXT_TELEMETRY_DISABLED=1

# Note: NEXT_PUBLIC_* variables are exposed to the browser
# Do NOT put secrets here!
```

---

## Task 11: Create Local Development Environment Example

**Objective:** Provide a template for local development environment variables.

**Create new file:** `/web/.env.local.example`

**Full contents:**
```bash
# Local Development Configuration
# Copy this file to .env.local for local development
# .env.local is gitignored and won't be committed

# API URL for local FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED=1

# Instructions:
# 1. Copy this file: cp .env.local.example .env.local
# 2. Adjust URLs if your backend runs on a different port
# 3. Never commit .env.local to git
```

---

## Task 12: Create Vercel Configuration File

**Objective:** Configure Vercel deployment settings and monorepo structure.

**Create new file:** `/vercel.json`

**Full contents:**
```json
{
  "buildCommand": "cd web && npm run build",
  "outputDirectory": "web/.next",
  "framework": "nextjs",
  "installCommand": "cd web && npm install",
  "devCommand": "cd web && npm run dev",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": {
      "description": "Backend API URL from Railway deployment",
      "value": "https://your-backend.up.railway.app"
    },
    "NEXT_TELEMETRY_DISABLED": {
      "description": "Disable Next.js telemetry",
      "value": "1"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

**Important Notes:**
- This assumes your Next.js app is in the `/web` subdirectory
- Update the `value` for `NEXT_PUBLIC_API_URL` after deploying to Railway
- `regions: ["iad1"]` deploys to US East (Virginia) - change if needed

---

## Task 13: Create Comprehensive Deployment Guide

**Objective:** Provide step-by-step instructions for Kate to deploy the application.

**Create new file:** `/docs/deployment-guide-vercel-railway.md`

**Full contents:**
```markdown
# Deployment Guide: Vercel + Railway

## Overview

This guide walks you through deploying the Chat-To-PDF application to production:
- **Frontend (Next.js):** Vercel (free tier)
- **Backend (FastAPI):** Railway (~$10-15/month)

**Total deployment time:** ~30-45 minutes
**Monthly cost:** $10-15 (vs $130+ on AWS EC2)

---

## Prerequisites

Before starting, ensure you have:
- ✅ GitHub account with this repository
- ✅ OpenAI API key (from https://platform.openai.com)
- ✅ All code changes from deployment implementation committed

---

## Part 1: Deploy Backend to Railway (15 minutes)

### Step 1.1: Create Railway Account

1. Go to **https://railway.app**
2. Click **"Login"**
3. Choose **"Login with GitHub"**
4. Authorize Railway to access your GitHub repositories
5. Complete profile setup if prompted

**Cost:** Free tier includes $5 credit/month, then ~$10-15/month for your backend

---

### Step 1.2: Create New Railway Project

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: **Chat-To-PDF**
4. Railway will automatically detect:
   - `railway.json` configuration
   - `Dockerfile.api` for building
5. Wait for Railway to initialize (30 seconds)

---

### Step 1.3: Configure Environment Variables

In Railway dashboard:

1. Click on your service name
2. Click **"Variables"** tab
3. Click **"Add Variable"** and add these **one by one:**

```bash
OPENAI_API_KEY
# Value: your_actual_openai_api_key_from_platform.openai.com

OPENAI_MODEL
# Value: gpt-4o-mini

ALLOWED_ORIGINS
# Value: http://localhost:3000
# Note: We'll update this after deploying to Vercel
```

4. Click **"Add Variable"** after each entry
5. Railway will automatically redeploy with new variables

---

### Step 1.4: Wait for Deployment

1. Click **"Deployments"** tab
2. Watch the build logs (5-10 minutes for first deployment)
3. Look for: **"Build successful"** and **"Deployment live"**

**Common issues:**
- If build fails, check logs for missing dependencies
- Ensure `requirements.txt` includes all packages

---

### Step 1.5: Get Your Railway URL

1. Click **"Settings"** tab
2. Scroll to **"Domains"** section
3. Railway provides a default domain like: `your-app-name.up.railway.app`
4. **COPY THIS URL** (you'll need it for Vercel)
5. Click the URL to test it

**Test the backend:**
```bash
curl https://your-app-name.up.railway.app/healthz

# Expected response:
# {"status":"ok","version":"1.0.0","service":"fastapi","timestamp":"..."}
```

If you get an error, check:
- Deployment is complete (green status)
- Environment variables are set correctly
- Build logs for errors

---

### Step 1.6: Test OpenAI Integration

```bash
curl https://your-app-name.up.railway.app/fastapi/openai/health

# Expected response:
# {"status":"healthy","api_available":true,"model":"gpt-4o-mini",...}
```

If `status: "unhealthy"`:
- Check `OPENAI_API_KEY` is correct
- Verify key has credits in OpenAI dashboard

---

## Part 2: Deploy Frontend to Vercel (15 minutes)

### Step 2.1: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub repositories

**Cost:** Free tier (unlimited deployments for hobby projects)

---

### Step 2.2: Import Your Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find and import: **Chat-To-PDF** repository
3. Vercel detects Next.js automatically

---

### Step 2.3: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `web` ⚠️ **IMPORTANT**
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)
- **Node.js Version:** 18.x (default)

If Root Directory is not set to `web`, click **Edit** and set it.

---

### Step 2.4: Configure Environment Variables

In the **"Environment Variables"** section, add:

**Variable 1:**
```
Name: NEXT_PUBLIC_API_URL
Value: https://your-app-name.up.railway.app
       (use YOUR Railway URL from Part 1, Step 1.5)
```

**Variable 2:**
```
Name: NEXT_TELEMETRY_DISABLED
Value: 1
```

**Important:** 
- Use your actual Railway URL (not the example)
- No trailing slash on the URL
- Select all environments: Production, Preview, Development

---

### Step 2.5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Watch the build logs for errors

**Common issues:**
- Build fails: Check that Root Directory is set to `web`
- Module not found: Ensure `package.json` is in `web/` directory

---

### Step 2.6: Get Your Vercel URL

1. After deployment completes, Vercel shows your live URL
2. Format: `your-app-name.vercel.app` or custom domain
3. **COPY THIS URL** (you'll need it for Railway CORS)

**Test the frontend:**
1. Click the Vercel URL to open your app
2. You should see the upload page
3. Check browser console (F12) for any errors

---

## Part 3: Update Railway CORS (5 minutes)

**Why:** Railway backend needs to allow requests from your Vercel domain.

### Step 3.1: Update ALLOWED_ORIGINS

1. Go back to **Railway dashboard**
2. Click on your backend service
3. Click **"Variables"** tab
4. Find the `ALLOWED_ORIGINS` variable
5. Click **"Edit"**
6. Update the value to include your Vercel URL:

```bash
http://localhost:3000,https://your-app.vercel.app,https://*.vercel.app
```

**Replace `your-app` with your actual Vercel app name!**

7. Click **"Save"**
8. Railway will automatically redeploy (~1 minute)

---

## Part 4: End-to-End Testing (10 minutes)

### Test 1: Frontend Loads

1. Open your Vercel URL in browser
2. ✅ Page loads without errors
3. ✅ No CORS errors in browser console (F12 → Console)

---

### Test 2: Backend Connectivity

1. Open browser console (F12)
2. Check Network tab
3. Look for requests to your Railway URL
4. ✅ Should see 200 status codes
5. ❌ If 403/CORS errors: Check ALLOWED_ORIGINS in Railway

---

### Test 3: Upload PDF

1. Click **"Choose Files"** or drag & drop a PDF
2. Click **"Upload"**
3. ✅ File uploads successfully
4. ✅ Indexing progress shows
5. ✅ "Ask Questions" button becomes enabled

**If upload fails:**
- Check browser console for errors
- Check Railway logs: Dashboard → Deployments → View Logs
- Verify OPENAI_API_KEY is set in Railway

---

### Test 4: Ask a Question

1. Click **"Ask Questions"** or go to `/chat`
2. Type a question about your PDF
3. Click **"Send"** or press Enter
4. ✅ Question appears immediately
5. ✅ Loading indicator shows
6. ✅ AI response appears within 5-10 seconds

**If query fails:**
- Check browser console for error details
- Check Railway logs for OpenAI errors
- Verify OpenAI API key has credits

---

### Test 5: Verify Version Badge

1. Look at bottom-right corner of the page
2. ✅ Version number should appear
3. ✅ Should match your VERSION file

**If version shows "Error":**
- Check NEXT_PUBLIC_API_URL is correct in Vercel
- Verify `/version` endpoint works: `curl https://your-railway-url.railway.app/version`

---

## Part 5: Monitoring & Logs

### Railway Logs

View backend logs:
1. Railway dashboard → Your service
2. Click **"Deployments"**
3. Click on the latest deployment
4. Click **"View Logs"**

**Useful for:**
- Debugging API errors
- Monitoring OpenAI API calls
- Checking indexing progress

---

### Vercel Logs

View frontend logs:
1. Vercel dashboard → Your project
2. Click **"Logs"** tab
3. Filter by: Runtime Logs, Build Logs, etc.

**Useful for:**
- Build failures
- Runtime errors
- API route debugging

---

## Part 6: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Vercel dashboard → Your project → **"Settings"** → **"Domains"**
2. Click **"Add"**
3. Enter your domain: `chat.yourdomain.com`
4. Follow DNS configuration instructions
5. Vercel automatically provisions SSL certificate

### Add Custom Domain to Railway

1. Railway dashboard → Your service → **"Settings"** → **"Domains"**
2. Click **"Add Custom Domain"**
3. Enter your domain: `api.yourdomain.com`
4. Follow DNS configuration instructions
5. Railway automatically provisions SSL certificate

### Update Environment Variables

After adding custom domains:

**In Vercel:**
- No changes needed (custom domain works automatically)

**In Railway:**
- Update `ALLOWED_ORIGINS` to include your custom frontend domain:
```bash
http://localhost:3000,https://chat.yourdomain.com,https://*.vercel.app
```

---

## Troubleshooting

### Issue: CORS Error in Browser

**Symptoms:** 
- Browser console shows: `Access-Control-Allow-Origin` error
- Frontend can't reach backend

**Solutions:**
1. Check Railway `ALLOWED_ORIGINS` includes your Vercel URL
2. Verify Railway has redeployed after updating variables
3. Clear browser cache and try again
4. Test Railway directly: `curl -I https://your-railway-url.railway.app/healthz -H "Origin: https://your-vercel-url.vercel.app"`

---

### Issue: 404 Not Found on API Calls

**Symptoms:**
- API calls return 404
- Backend seems unreachable

**Solutions:**
1. Verify `NEXT_PUBLIC_API_URL` in Vercel is correct
2. Test Railway URL directly in browser
3. Check Railway deployment is successful (green status)
4. Verify Railway health check: `curl https://your-railway-url.railway.app/healthz`

---

### Issue: Build Fails on Vercel

**Symptoms:**
- Deployment fails during build step
- Shows error in build logs

**Solutions:**
1. Verify Root Directory is set to `web`
2. Check `package.json` exists in `web/` directory
3. Ensure all dependencies are in `package.json`
4. Check build logs for specific error messages
5. Try building locally: `cd web && npm run build`

---

### Issue: Build Fails on Railway

**Symptoms:**
- Railway deployment fails
- Shows error in build logs

**Solutions:**
1. Verify `Dockerfile.api` exists and is valid
2. Check all dependencies in `requirements.txt`
3. Ensure Python version is compatible (3.9+)
4. Check build logs for specific error messages
5. Try building locally: `docker build -f Dockerfile.api .`

---

### Issue: OpenAI API Errors

**Symptoms:**
- Queries fail with authentication or rate limit errors
- Health check shows `unhealthy`

**Solutions:**
1. Verify `OPENAI_API_KEY` is correct in Railway
2. Check API key has credits in OpenAI dashboard
3. Verify key permissions in OpenAI settings
4. Test key directly: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

---

### Issue: Upload Fails

**Symptoms:**
- File upload returns error
- Progress bar doesn't show

**Solutions:**
1. Check file size (must be < 50MB)
2. Verify PDF is not scanned (must have text layer)
3. Check Railway logs for backend errors
4. Verify session management is working
5. Test upload directly: `curl -X POST https://your-railway-url.railway.app/fastapi/upload -F "files=@test.pdf"`

---

## Cost Optimization

### Railway Cost Control

**Current usage:** ~$10-15/month

**To reduce costs:**
1. Use Railway's "Sleep" feature for inactive services
2. Monitor usage in Railway dashboard
3. Set up billing alerts: Settings → Billing → Alerts
4. Consider scaling down during low traffic periods

---

### Vercel Cost (Free Tier)

**Free tier includes:**
- Unlimited deployments
- 100GB bandwidth/month
- 100 hours serverless function execution/month

**If you exceed free tier:**
- Upgrade to Pro ($20/month)
- Or optimize: reduce bandwidth, cache assets

---

## Rollback Procedure

### Rollback Vercel Deployment

1. Vercel dashboard → Your project → **"Deployments"**
2. Find the previous working deployment
3. Click **"..."** menu → **"Promote to Production"**
4. Confirm promotion
5. **Rollback completes in < 1 minute**

---

### Rollback Railway Deployment

1. Railway dashboard → Your service → **"Deployments"**
2. Find the previous working deployment
3. Click **"Redeploy"**
4. Confirm redeployment
5. **Rollback completes in ~2-3 minutes**

---

## Next Steps After Deployment

1. **Monitor Performance:**
   - Check Railway metrics for CPU/memory usage
   - Check Vercel analytics for traffic patterns

2. **Set Up Alerts:**
   - Railway: Settings → Notifications
   - Vercel: Settings → Notifications

3. **Configure Custom Domain** (if desired):
   - Follow Part 6 instructions above

4. **Implement CI/CD** (optional):
   - Push to GitHub → Automatic deployment
   - Already configured by default!

5. **Test from Different Locations:**
   - Use VPN or ask friends to test
   - Verify global performance

---

## Support

**Railway Support:**
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Email: team@railway.app

**Vercel Support:**
- Documentation: https://vercel.com/docs
- Discord: https://vercel.com/discord
- Email: support@vercel.com

**OpenAI Support:**
- Documentation: https://platform.openai.com/docs
- Help Center: https://help.openai.com

---

## Summary

**What you deployed:**
- ✅ Next.js frontend on Vercel (global CDN)
- ✅ FastAPI backend on Railway (containerized)
- ✅ Automatic HTTPS on both platforms
- ✅ Auto-deploy on git push
- ✅ Environment variables configured
- ✅ CORS configured correctly

**Monthly costs:**
- Vercel: FREE
- Railway: $10-15
- OpenAI: Pay-per-use (separate)
- **Total: $10-15/month**

**vs AWS EC2:** Saving $115-120/month (88% reduction)

**Deployment time:**
- Initial: ~30-45 minutes
- Future: < 5 minutes (automatic on git push!)

🎉 **Congratulations! Your app is now live in production!**
```

---

## Requirements

### Testing Requirements

After making all changes, verify:

1. **Local Development Still Works:**
   ```bash
   # Start backend
   cd api && uvicorn app.main:app --reload
   
   # In another terminal, start frontend
   cd web && npm run dev
   
   # Test:
   # - Open http://localhost:3000
   # - Upload a PDF
   # - Ask a question
   # - Verify response works
   ```

2. **All Tests Pass:**
   ```bash
   # Frontend tests
   cd web && npm test
   
   # Backend tests
   cd api && pytest
   ```

3. **No Linting Errors:**
   ```bash
   # Frontend linting
   cd web && npm run lint
   
   # Backend linting
   cd api && ruff check .
   ```

4. **Docker Compose Still Works:**
   ```bash
   docker compose up -d
   # Wait for services to start
   # Test at http://localhost:3000
   docker compose down
   ```

---

### Success Criteria

All changes are successful if:

- ✅ All 7 existing files are updated correctly
- ✅ All 6 new files are created with complete contents
- ✅ No syntax errors in any file
- ✅ Local development works (`docker compose up`)
- ✅ All existing tests still pass
- ✅ No linting errors introduced
- ✅ Git commit message is clear and includes "AI Co-author: Cursor"

---

### Commit Message

After completing all changes, commit with this message:

```
Configure deployment for Vercel + Railway

Backend changes:
- Update CORS to use ALLOWED_ORIGINS environment variable
- Add PORT variable support in Dockerfile.api for Railway
- Create railway.json configuration

Frontend changes:
- Update all API routes to use NEXT_PUBLIC_API_URL
- Fix VersionBadge to use configurable API URL
- Update docker-compose.yml for local development

Configuration:
- Add .env.example files for backend and frontend
- Add vercel.json for Vercel deployment configuration
- Create comprehensive deployment guide

This maintains backward compatibility with local development
while enabling production deployment to Vercel + Railway.

Estimated deployment cost: $10-15/month (vs $130 AWS EC2)

AI Co-author: Cursor
```

---

## Notes for LLM Implementation

1. **Preserve Existing Code:** Only change what's specified. Don't refactor or optimize other parts.

2. **Exact String Matching:** When replacing code, match the exact spacing and formatting shown.

3. **Complete Files:** Create new files with ALL contents shown, not partial code.

4. **No Breaking Changes:** These changes should not break local development or tests.

5. **Environment Variables:** All new environment variables have sensible defaults for local development.

6. **Testing:** After all changes, the application should still work locally with `docker compose up`.

7. **Documentation:** The deployment guide should be complete and actionable without additional context.

---

## Validation Checklist

Before marking this task complete, verify:

- [ ] Task 1: CORS updated in `/api/app/main.py`
- [ ] Task 2: Upload route updated in `/web/src/app/api/upload/route.ts`
- [ ] Task 3: Status route updated in `/web/src/app/api/index/status/route.ts`
- [ ] Task 4: Query route updated in `/web/src/app/api/query/route.ts`
- [ ] Task 5: VersionBadge updated in `/web/src/components/VersionBadge.tsx`
- [ ] Task 6: docker-compose.yml updated
- [ ] Task 7: Dockerfile.api updated with PORT support
- [ ] Task 8: `/railway.json` created
- [ ] Task 9: `/api/.env.example` created
- [ ] Task 10: `/web/.env.example` created
- [ ] Task 11: `/web/.env.local.example` created
- [ ] Task 12: `/vercel.json` created
- [ ] Task 13: `/docs/deployment-guide-vercel-railway.md` created
- [ ] All files have correct syntax
- [ ] No placeholder text remains (like "your-app-name")
- [ ] Local development tested: `docker compose up` works
- [ ] Tests pass: `cd web && npm test` and `cd api && pytest`
- [ ] Changes committed with proper message

---

## Expected Outcome

After completing all tasks:

1. **Developers can deploy in 3 steps:**
   - Push code to GitHub
   - Connect Railway to GitHub (backend auto-deploys)
   - Connect Vercel to GitHub (frontend auto-deploys)

2. **Future deployments are automatic:**
   - Git push → both platforms deploy automatically
   - No manual steps required

3. **Cost savings:**
   - From $130/month (AWS EC2)
   - To $10-15/month (Railway + Vercel free)

4. **Better developer experience:**
   - No SSH required
   - No manual server management
   - Built-in logging and monitoring
   - Easy rollbacks (one click)

