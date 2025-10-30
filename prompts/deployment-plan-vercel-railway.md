# Deployment Plan: Vercel + Railway (Option 1)

## Overview

**Architecture:**
- **Frontend:** Vercel (Next.js with automatic HTTPS, CDN, edge network)
- **Backend:** Railway (FastAPI container with automatic HTTPS)
- **Storage:** Railway volumes (or upgrade to S3 later)
- **State:** In-memory (MVP) → Redis (future enhancement)
- **Secrets:** Platform environment variables

**Total Time Estimate:** 3-4 hours
**Cost Estimate:** $15-35/month (vs. $120-140 AWS EC2)

---

## Phase 1: Preparation & Code Changes

### 🤖 **What I WILL DO (Agent Tasks)**

#### Task 1.1: Create Railway Configuration
**File:** `/api/railway.json` (new file)

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

**Status:** ✅ I'll create this file

---

#### Task 1.2: Update FastAPI CORS Configuration
**File:** `/api/app/main.py`

**Current (lines 154-161):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Updated:**
```python
import os

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,https://pdf-chat.vercel.app,https://*.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Status:** ✅ I'll make this change

---

#### Task 1.3: Create Environment Variable Configuration
**File:** `/api/.env.example` (new file)

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://*.vercel.app

# Railway-specific (auto-provided by Railway)
PORT=8000
RAILWAY_ENVIRONMENT=production
```

**Status:** ✅ I'll create this file

---

#### Task 1.4: Update Next.js API Client
**File:** `/web/src/lib/api/client.ts` (or wherever API calls are made)

**Current:** Hardcoded `http://localhost:8000`

**Updated:**
```typescript
// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// All fetch calls should use API_BASE_URL
export async function uploadFiles(files: FileList) {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('files', file));
  
  const response = await fetch(`${API_BASE_URL}/fastapi/upload`, {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}

// Apply to all other API calls...
```

**Status:** ✅ I'll update all API calls

---

#### Task 1.5: Create Vercel Configuration
**File:** `/web/.env.example` (new file)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Next.js Configuration
NEXT_TELEMETRY_DISABLED=1
```

**Status:** ✅ I'll create this file

---

#### Task 1.6: Create Vercel Deployment Configuration
**File:** `/vercel.json` (new file)

```json
{
  "buildCommand": "cd web && npm run build",
  "outputDirectory": "web/.next",
  "framework": "nextjs",
  "installCommand": "cd web && npm install",
  "devCommand": "cd web && npm run dev",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url"
  },
  "regions": ["iad1"]
}
```

**Status:** ✅ I'll create this file

---

#### Task 1.7: Update Railway Dockerfile for PORT Variable
**File:** `/Dockerfile.api`

**Add at the end (before CMD):**
```dockerfile
# Railway provides PORT environment variable
ENV PORT=8000
EXPOSE $PORT

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
```

**Status:** ✅ I'll update this

---

#### Task 1.8: Add Health Check Improvements
**File:** `/api/app/main.py`

**Update healthz endpoint (around line 174-177):**
```python
@app.get("/healthz")
def healthz():
    """Health check endpoint with Railway compatibility."""
    return {
        "status": "ok", 
        "version": get_version(),
        "service": "fastapi",
        "timestamp": datetime.now().isoformat()
    }
```

**Status:** ✅ I'll make this change

---

#### Task 1.9: Update API Routes to Remove Hardcoded URLs
**Files to check:**
- `/web/src/app/api/upload/route.ts`
- `/web/src/app/api/query/route.ts`
- `/web/src/app/api/index/status/route.ts`

**Pattern to replace:**
```typescript
// OLD
const response = await fetch('http://localhost:8000/fastapi/...')

// NEW
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const response = await fetch(`${API_URL}/fastapi/...`)
```

**Status:** ✅ I'll update all routes

---

#### Task 1.10: Create Deployment Documentation
**File:** `/docs/deployment-vercel-railway.md`

Complete guide with:
- Prerequisites
- Account setup steps
- Deployment steps
- Environment variable configuration
- Testing procedures
- Rollback procedures
- Troubleshooting guide

**Status:** ✅ I'll create comprehensive documentation

---

#### Task 1.11: Create Local Development Setup for New Config
**File:** `/web/.env.local.example`

```bash
# Local development configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Status:** ✅ I'll create this

---

#### Task 1.12: Update package.json Scripts (if needed)
**File:** `/web/package.json`

Add deployment-friendly scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "vercel-build": "next build"
  }
}
```

**Status:** ✅ I'll verify/update scripts

---

### 📝 **Summary of Agent Work (Phase 1)**

**Files I'll Create:**
- ✅ `/api/railway.json`
- ✅ `/api/.env.example`
- ✅ `/web/.env.example`
- ✅ `/web/.env.local.example`
- ✅ `/vercel.json`
- ✅ `/docs/deployment-vercel-railway.md`

**Files I'll Modify:**
- ✅ `/api/app/main.py` (CORS + health check)
- ✅ `/Dockerfile.api` (PORT variable)
- ✅ `/web/src/app/api/upload/route.ts` (API URL)
- ✅ `/web/src/app/api/query/route.ts` (API URL)
- ✅ `/web/src/app/api/index/status/route.ts` (API URL)
- ✅ Any other files with hardcoded localhost URLs

**Testing I'll Add:**
- ✅ Environment variable validation
- ✅ API connectivity checks

**Time Estimate:** 2-3 hours of my work

---

## Phase 2: Platform Setup & Configuration

### 👤 **What YOU WILL DO (Manual Steps)**

#### Step 2.1: Create Railway Account
**Time:** 5 minutes

1. Go to https://railway.app
2. Click "Login" → Choose GitHub authentication
3. Authorize Railway to access your repositories
4. Complete profile setup

**Why GitHub Auth:** Railway can auto-deploy from your GitHub repo

**Cost:** Free tier includes $5 credit/month, then $5+ per month for usage

---

#### Step 2.2: Create Vercel Account
**Time:** 5 minutes

1. Go to https://vercel.com
2. Click "Sign Up" → Choose GitHub authentication
3. Authorize Vercel to access your repositories
4. Complete profile setup

**Why GitHub Auth:** Vercel can auto-deploy from your GitHub repo

**Cost:** Free tier includes unlimited deployments for personal projects

---

#### Step 2.3: Push Code Changes to GitHub
**Time:** 5 minutes

**Prerequisites:** All Phase 1 changes are complete

```bash
# Review changes
git status
git diff

# Stage all changes
git add .

# Commit
git commit -m "Configure for Vercel + Railway deployment

- Add Railway configuration
- Update CORS for production domains
- Make API URLs configurable via environment variables
- Add deployment documentation
- Add environment variable examples

AI Co-author: Cursor"

# Push to main (or your deployment branch)
git push origin main
```

**What I Cannot Do:** I cannot execute git commands on your machine

---

#### Step 2.4: Deploy Backend to Railway
**Time:** 10-15 minutes

**Step 2.4.1: Create New Project**
1. Go to Railway dashboard: https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `Chat-To-PDF/code/pdf-chat`
5. Railway will detect the Dockerfile automatically

**Step 2.4.2: Configure Build Settings**
1. Railway should auto-detect `Dockerfile.api`
2. If not, click "Settings" → "Build"
3. Set "Dockerfile Path" to `Dockerfile.api`
4. Set "Root Directory" to `/` (or leave empty)

**Step 2.4.3: Configure Environment Variables**
1. Click "Variables" tab
2. Add these variables:

```bash
OPENAI_API_KEY=your_actual_openai_api_key
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=https://your-app-name.vercel.app,https://*.vercel.app
```

**Note:** Replace `your-app-name` with your actual Vercel app name (you'll get this in Step 2.5)

**Step 2.4.4: Deploy**
1. Railway will automatically start deploying
2. Wait for build to complete (5-10 minutes first time)
3. Check deployment logs for any errors

**Step 2.4.5: Get Your Railway URL**
1. Once deployed, click "Settings" → "Domains"
2. Railway provides a default domain like: `pdf-chat-production.up.railway.app`
3. **COPY THIS URL** - you'll need it for Vercel configuration

**Step 2.4.6: Test Backend**
```bash
# Test health endpoint
curl https://your-railway-app.railway.app/healthz

# Expected response:
# {"status":"ok","version":"...","service":"fastapi","timestamp":"..."}
```

**What I Cannot Do:** 
- Click buttons in Railway dashboard
- Create the Railway project
- Configure environment variables in Railway
- However, I CAN provide exact values to copy/paste

---

#### Step 2.5: Deploy Frontend to Vercel
**Time:** 10-15 minutes

**Step 2.5.1: Create New Project**
1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `Chat-To-PDF`
4. Vercel will detect Next.js automatically

**Step 2.5.2: Configure Project Settings**
1. **Framework Preset:** Next.js (should be auto-detected)
2. **Root Directory:** `web`
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Install Command:** `npm install` (default)

**Step 2.5.3: Configure Environment Variables**
1. In "Environment Variables" section
2. Add this variable:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

**Note:** Use the Railway URL from Step 2.4.5

3. Select which environments: Production, Preview, Development (check all)

**Step 2.5.4: Deploy**
1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Check deployment logs for any errors

**Step 2.5.5: Get Your Vercel URL**
1. Once deployed, Vercel shows your live URL
2. Default format: `your-app-name.vercel.app`
3. **COPY THIS URL** - you'll need it for Railway CORS

**Step 2.5.6: Update Railway CORS**
1. Go back to Railway dashboard
2. Click on your backend service
3. Click "Variables"
4. Update `ALLOWED_ORIGINS` to include your Vercel URL:

```bash
ALLOWED_ORIGINS=https://your-app-name.vercel.app,https://*.vercel.app
```

5. Railway will automatically redeploy with new settings

**What I Cannot Do:**
- Click buttons in Vercel dashboard
- Create the Vercel project
- Configure environment variables in Vercel
- However, I CAN provide exact configuration values

---

#### Step 2.6: Configure Custom Domain (Optional)
**Time:** 15-30 minutes

**For Vercel (Frontend):**
1. Go to Vercel project → "Settings" → "Domains"
2. Add your custom domain (e.g., `pdf-chat.yourdomain.com`)
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificate

**For Railway (Backend):**
1. Go to Railway project → "Settings" → "Domains"
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions
5. Railway automatically provisions SSL certificate

**Update Environment Variables:**
- In Vercel: Update `NEXT_PUBLIC_API_URL` to your custom backend domain
- In Railway: Update `ALLOWED_ORIGINS` to include your custom frontend domain

**What I Cannot Do:**
- Configure DNS records in your domain provider
- However, I CAN provide exact DNS record values

---

## Phase 3: Testing & Validation

### 🤝 **What WE DO TOGETHER**

#### Step 3.1: Smoke Tests
**Time:** 10 minutes

**Test 1: Health Check**
```bash
# Backend health
curl https://your-railway-app.railway.app/healthz

# Expected: {"status":"ok",...}
```

**Test 2: Frontend Loading**
1. Open browser to your Vercel URL
2. Check that page loads without errors
3. Open browser console (F12) → Check for errors

**Test 3: CORS**
```bash
# Check CORS headers
curl -I https://your-railway-app.railway.app/healthz \
  -H "Origin: https://your-app.vercel.app"

# Should include: Access-Control-Allow-Origin
```

**What I Do:** Provide test commands and expected outputs
**What You Do:** Run tests and share results

---

#### Step 3.2: End-to-End Upload Test
**Time:** 5 minutes

1. Open your Vercel app in browser
2. Upload a small test PDF
3. Check browser network tab:
   - Upload request should go to Railway URL
   - Should return session_id
4. Wait for indexing to complete
5. Check that "Ask Questions" button becomes enabled

**What I Do:** Debug any errors if you share console logs
**What You Do:** Perform the test, screenshot any errors

---

#### Step 3.3: End-to-End Query Test
**Time:** 5 minutes

1. Navigate to chat page
2. Ask a test question
3. Verify:
   - Question appears immediately
   - Loading indicator shows
   - Response appears from OpenAI
   - Response is displayed correctly

**What I Do:** Debug issues if test fails
**What You Do:** Test and report results

---

#### Step 3.4: Monitor Logs
**Time:** 5 minutes

**Railway Logs:**
1. Railway dashboard → Your service → "Deployments" → "View Logs"
2. Check for any errors during upload/query

**Vercel Logs:**
1. Vercel dashboard → Your project → "Logs"
2. Check for any runtime errors

**What I Do:** Interpret log errors and suggest fixes
**What You Do:** Access and share relevant log excerpts

---

#### Step 3.5: Performance Check
**Time:** 5 minutes

**Test Cold Start:**
1. Wait 10 minutes with no activity
2. Make a request
3. Measure response time (should be <3 seconds)

**Test Warm Performance:**
1. Make several requests in succession
2. Response time should be <1 second

**What I Do:** Suggest optimizations if performance is poor
**What You Do:** Measure and report timings

---

## Phase 4: Configuration Finalization

### 👤 **What YOU DO**

#### Step 4.1: Set Up GitHub Actions for CI/CD (Optional)
**Time:** 15 minutes

**File:** `.github/workflows/deploy.yml` (I'll create this)

**Benefits:**
- Run tests before deploying
- Automatic deployment on push
- Build validation

**Your Steps:**
1. Review the workflow file I create
2. Commit and push to GitHub
3. GitHub Actions will run automatically

**What I Do:** Create the workflow file
**What You Do:** Review and enable it

---

#### Step 4.2: Configure Alerts (Optional)
**Time:** 10 minutes

**Railway Alerts:**
1. Settings → Notifications
2. Enable email/Slack notifications for:
   - Deployment failures
   - Service health issues
   - Resource usage alerts

**Vercel Alerts:**
1. Project Settings → Notifications
2. Enable notifications for:
   - Build failures
   - Production errors

**What I Cannot Do:** Configure notifications in the platforms
**What I Can Do:** Recommend what to monitor

---

#### Step 4.3: Document Production URLs
**Time:** 5 minutes

Create a `.env.production` file (not committed) with:
```bash
# Production Configuration
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-railway-app.railway.app
OPENAI_API_KEY=<stored in Railway>
```

Keep this file secure and local!

---

## Phase 5: Ongoing Operations

### 🔄 **Continuous Operations**

#### Deployment Process (Future Updates)

**Automatic Deployment:**
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Both Railway and Vercel will automatically:
# 1. Detect the push
# 2. Build new version
# 3. Run tests (if configured)
# 4. Deploy to production
# 5. Send notification
```

**Time:** 0 minutes (fully automated!)

---

#### Rollback Procedure

**Vercel Rollback:**
1. Go to Vercel dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback (< 1 minute)

**Railway Rollback:**
1. Go to Railway dashboard → Deployments
2. Find the previous working deployment
3. Click "Redeploy"
4. Rollback completes in ~2 minutes

**What I Do:** Guide you through rollback if needed
**What You Do:** Execute the rollback

---

#### Monitoring

**Daily:**
- Check Railway dashboard for any health issues
- Check Vercel analytics for traffic patterns

**Weekly:**
- Review error logs in both platforms
- Check resource usage and costs

**Monthly:**
- Review and optimize costs
- Update dependencies
- Security patches

**What I Do:** Create monitoring dashboards/scripts
**What You Do:** Review and act on alerts

---

## Cost Breakdown

### Monthly Costs

**Railway (Backend):**
- Free tier: $5 credit/month
- After free tier: ~$5-20/month depending on usage
- Estimated: **$10-15/month** for low-moderate traffic

**Vercel (Frontend):**
- Hobby plan: **$0/month** (free for personal projects)
- Pro plan: **$20/month** (if you need more features)
- Estimated: **$0-20/month**

**Other:**
- Domain (optional): ~$12/year ($1/month)
- OpenAI API: Pay per use (separate)

**Total Monthly: $10-35** (vs. $120-140 on AWS EC2)

**Savings: $85-130/month (70-85% reduction)**

---

## Timeline Summary

| Phase | Who | Time | Details |
|-------|-----|------|---------|
| **Phase 1: Code Changes** | 🤖 Agent | 2-3 hours | All configuration and code updates |
| **Phase 2: Platform Setup** | 👤 You | 30-45 min | Create accounts, configure platforms |
| **Phase 3: Testing** | 🤝 Together | 30 min | Validate deployment works |
| **Phase 4: Finalization** | 👤 You | 30 min | Optional but recommended |
| **Total** | - | **3-4 hours** | One-time setup |

**Future Deployments:** < 5 minutes (automatic on git push!)

---

## Rollback Plan

### If Something Goes Wrong

**Immediate Actions:**

1. **Keep AWS EC2 running** during initial deployment (parallel)
2. Test on Railway/Vercel first
3. Only shut down AWS once fully validated

**Rollback to AWS:**

1. Point DNS back to AWS EC2 (if using custom domain)
2. Or: Keep both running and switch URLs in .env
3. No code changes needed to go back

**Rollback Timeline:** 5-10 minutes

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Railway deployment fails | Low | Medium | Keep AWS running, rollback |
| CORS issues | Medium | Low | I'll provide correct config |
| Cold start latency | Medium | Low | Railway keeps instances warm |
| Environment variables wrong | Low | Medium | I'll provide exact values |
| Cost exceeds estimate | Low | Low | Billing alerts in both platforms |

---

## Support & Troubleshooting

### What I Can Help Debug

**If You See These Errors:**

✅ **CORS errors in browser console**
- I'll provide correct CORS configuration

✅ **Build failures**
- I'll review build logs and fix code issues

✅ **API connection errors**
- I'll verify configuration and provide fixes

✅ **Environment variable issues**
- I'll check configuration values

✅ **404 or routing errors**
- I'll review routing configuration

### What I Need From You

**To Help Debug:**
1. 📸 Screenshots of errors
2. 📋 Log excerpts (copy/paste)
3. 🌐 URL you're testing
4. 💻 Browser console errors
5. ⚙️ Environment variable values (sanitized)

### What I Cannot Do

❌ Access your Railway/Vercel dashboards
❌ Run commands on your machine
❌ Configure billing/payment methods
❌ Access production logs directly

**However:** I can provide exact commands and configurations for you to use!

---

## Next Steps

### To Proceed With This Plan:

**1. Confirm You Want Option 1**
   - Reply "Yes, proceed with Option 1"
   - I'll start Phase 1 immediately

**2. I'll Complete Phase 1 (2-3 hours)**
   - Create all configuration files
   - Update all code
   - Create comprehensive documentation
   - Notify you when ready

**3. You'll Execute Phase 2 (30-45 minutes)**
   - Follow my step-by-step guide
   - Create Railway and Vercel accounts
   - Deploy both services
   - Share any errors with me

**4. We'll Test Together (30 minutes)**
   - Validate everything works
   - Debug any issues
   - Document success!

---

## Alternatives If This Seems Too Complex

**Option 1A: Start with Railway Only**
- Deploy both frontend and backend to Railway
- Simpler (single platform)
- Slightly higher cost (~$15-25/month)
- Can migrate frontend to Vercel later

**Option 1B: Use Vercel + Render (instead of Railway)**
- Same approach, different backend platform
- Render is slightly cheaper ($7/month minimum)
- Very similar process

**Option 1C: Stay on AWS but Simplify**
- Keep current setup but add automation
- Use GitHub Actions for deployment
- Less change, but still manual

Let me know which option you prefer, or if you have questions about any step!

