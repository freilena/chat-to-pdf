
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
# Value: http://localhost:3000,http://127.0.0.1:3000
# Note: We'll update this after deploying to Vercel

CORS_ORIGIN_REGEX
# Value: ^https://([a-z0-9-]+)\.vercel\.app$
# Optional: Enables wildcard matching for Vercel preview deployments
# Note: Use strict regex pattern to prevent security issues

OPENAI_HEALTHCHECK_DISABLED
# Value: true
# IMPORTANT: Set to 'true' in production to save costs
# Railway pings health check every 30 seconds = 87,000+ OpenAI API calls/month!
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

**Important note on health checks:**
Railway pings `/healthz` every ~30 seconds. This is fine. However, the `/fastapi/openai/health` endpoint hits the OpenAI API, which costs money. We've configured `OPENAI_HEALTHCHECK_DISABLED=true` to skip those expensive calls in production while still verifying basic service health.

---

### Step 1.6: Test OpenAI Configuration

**Note:** With `OPENAI_HEALTHCHECK_DISABLED=true` (recommended for production), the health check returns a static response:

```bash
curl https://your-app-name.up.railway.app/fastapi/openai/health

# Expected response (with OPENAI_HEALTHCHECK_DISABLED=true):
# {"status":"healthy","api_available":true,"model":"gpt-4o-mini","healthcheck":"skipped"}
```

**To test actual OpenAI connectivity** (temporarily set `OPENAI_HEALTHCHECK_DISABLED=false` in Railway):
- This will make real API calls to verify the key works
- Remember to set it back to `true` after testing to save costs

If you see errors:
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
http://localhost:3000,http://127.0.0.1:3000,https://your-app.vercel.app
```

**Replace `your-app` with your actual Vercel app name!**

7. **Optional:** Add `CORS_ORIGIN_REGEX` variable for preview deployments:

```bash
CORS_ORIGIN_REGEX
# Value: ^https://([a-z0-9-]+)\.vercel\.app$
```

This enables wildcard support for Vercel preview URLs like `https://chat-pdf-git-branch-name-user.vercel.app`

**Why use regex?** With `allow_origin_regex` set, you don't need to manually update CORS for each preview deployment. Any valid Vercel preview URL will automatically be allowed.

8. **IMPORTANT:** Add `OPENAI_HEALTHCHECK_DISABLED` variable to save costs:

```bash
OPENAI_HEALTHCHECK_DISABLED
# Value: true
```

**Cost savings:** Railway pings `/fastapi/openai/health` every 30 seconds. Without this toggle, that's ~87,000 OpenAI API calls per month just for health checks! Setting this to `true` returns a static response and saves money.

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

## Part 5: Understanding Backend State Management

### ⚠️ Important: In-Memory Session Storage

**Your backend uses in-memory state**, which means:

**What gets stored in memory:**
- 📁 Uploaded PDF sessions (`SESSION_STATUS`, `SESSION_RETRIEVERS`)
- 🔍 FAISS vector indexes for each session
- 💬 Conversation history (if implemented)

**What this means:**
- ✅ **Normal operations:** Everything works perfectly
- ✅ **During uptime:** Sessions persist across requests
- ❌ **Railway restarts:** All session data is lost
- ❌ **Redeployments:** Users need to re-upload their PDFs

**When does Railway restart?**
- When you deploy new code (intentional)
- Container crashes (rare)
- Railway maintenance (very rare)
- Memory/resource limits exceeded (shouldn't happen with typical use)

**User experience during restart:**
1. User's session becomes invalid
2. Frontend shows "Session not found" or similar error
3. User needs to re-upload their PDF (~30 seconds)
4. Everything works again

**Is this acceptable for MVP?**
- ✅ **Yes** - Most users complete their work in one session
- ✅ Railway is stable (restarts are rare)
- ✅ Re-uploading is quick (30 seconds)
- ⚠️ Consider upgrading later if restarts become annoying

**Future enhancement (not needed for MVP):**
If you want persistent sessions that survive restarts, consider:
- **Option 1:** Railway Postgres + pgvector (stores vectors in database)
- **Option 2:** Redis for session state (stores sessions in memory cache)
- **Option 3:** S3 + persistent volume (stores files and indexes)

For now, **in-memory state is perfectly fine for MVP**. Most users won't notice, and you can always upgrade later if needed.

---

## Part 6: Monitoring & Logs

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

## Part 7: Custom Domain (Optional)

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
http://localhost:3000,http://127.0.0.1:3000,https://chat.yourdomain.com
```
- And/or set `CORS_ORIGIN_REGEX` if using Vercel preview deployments:
```bash
CORS_ORIGIN_REGEX=^https://([a-z0-9-]+)\.vercel\.app$
```

**Why the regex pattern?** The strict pattern `^https://([a-z0-9-]+)\.vercel\.app$` prevents security issues by only matching valid Vercel domains, not malicious lookalikes.

---

## Troubleshooting

### Issue: CORS Error in Browser

**Symptoms:** 
- Browser console shows: `Access-Control-Allow-Origin` error
- Frontend can't reach backend

**Solutions:**
1. Check Railway `ALLOWED_ORIGINS` includes your Vercel URL (or set `CORS_ORIGIN_REGEX` for wildcard support)
2. Verify Railway has redeployed after updating variables
3. Clear browser cache and try again
4. Test Railway directly: `curl -I https://your-railway-url.railway.app/healthz -H "Origin: https://your-vercel-url.vercel.app"`
5. For Vercel preview deployments, use `CORS_ORIGIN_REGEX=^https://([a-z0-9-]+)\.vercel\.app$`

**Why this regex?** The pattern with anchors (`^...$`) and character class (`[a-z0-9-]`) only matches legitimate Vercel domains, preventing attacks from malicious domains like `https://evil.com.vercel.app.fake.com`.

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

### Issue: "Session not found" Error

**Symptoms:**
- User gets "Session not found" when trying to query
- Upload worked but queries fail

**Likely causes:**
1. **Railway restarted** (most common)
   - Solution: Re-upload the PDF (sessions are in-memory)
   - This is expected behavior with current architecture
   
2. **Session timeout** (if implemented)
   - Solution: Check session timeout settings
   
3. **Different session ID** (cookie/storage issue)
   - Solution: Check browser cookies/local storage

**Long-term solution:** Migrate to persistent storage (Postgres + pgvector) if restarts become frequent.

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
