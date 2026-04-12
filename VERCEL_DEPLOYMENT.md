# Vercel Deployment Guide - GitHub Auto-Deploy

## 🚀 How Your Deployment Works

```
1. Push code to GitHub
        ↓
2. Vercel webhook detects push
        ↓
3. Vercel runs build command (npm run build)
        ↓
4. Vite builds React app to /dist folder
        ↓
5. Vercel deploys dist/ files to CDN
        ↓
6. Your site goes live! 🌐
```

## 🔧 Setting Up Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Select your **smart-farm-ui** project

### Step 2: Navigate to Settings
1. Click **Settings** tab (top of project page)
2. Click **Environment Variables** (left sidebar)

### Step 3: Add Firebase Credentials
Add the following environment variables with these EXACT names:

```
VITE_FIREBASE_API_KEY = AIzaSyDDXolRq3i7dGuXYtfzM4iF-QJD-JJ4Si0
VITE_FIREBASE_AUTH_DOMAIN = smart-farm-30213.firebaseapp.com
VITE_FIREBASE_DATABASE_URL = https://smart-farm-30213-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID = smart-farm-30213
VITE_FIREBASE_STORAGE_BUCKET = smart-farm-30213.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 459244704750
VITE_FIREBASE_APP_ID = 1:459244704750:web:fd577bef214938e757b4ff
VITE_FIREBASE_MEASUREMENT_ID = G-9WJX9WMQMX
```

### Step 4: Add LM Studio API Variables
For the AI chat feature (if using custom URL):

```
VITE_LM_STUDIO_API_URL = https://your-lm-studio-url/v1
VITE_LM_STUDIO_API_KEY = lm-studio
VITE_LM_STUDIO_MODEL = llama-2-7b-chat
```

### Step 5: Save and Redeploy
1. Click **Save** on each variable
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click the **⋮** menu → **Redeploy** (forces build with new env vars)

## 📋 Required Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| VITE_FIREBASE_API_KEY | Your Firebase API key | Firebase authentication |
| VITE_FIREBASE_AUTH_DOMAIN | smart-farm-30213.firebaseapp.com | Firebase auth domain |
| VITE_FIREBASE_DATABASE_URL | Your RTDB URL | Realtime database connection |
| VITE_FIREBASE_PROJECT_ID | smart-farm-30213 | Firebase project identifier |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase storage bucket | Cloud storage (if used) |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase sender ID | Push notifications |
| VITE_FIREBASE_APP_ID | Firebase app ID | App identifier |
| VITE_FIREBASE_MEASUREMENT_ID | Analytics ID | Google Analytics |

## 🔐 Security Best Practices

### ✅ What I've Done:
- **Removed hardcoded credentials** from source code
- **Created `.env.example`** as a template (safe to commit)
- **Created `.env.local`** with real credentials (NOT committed to Git)
- **Updated `.gitignore`** to exclude `.env.local`
- **Changed `firebase.js`** to use environment variables
- **Changed `App.jsx`** to use environment variables

### ✅ What You Should Do:
1. **Never commit `.env.local`** - It's in `.gitignore` automatically
2. **Use Vercel's Environment Variables dashboard** - Not command line
3. **Rotate API keys annually** - For production systems
4. **Enable Firebase Security Rules** - Don't use open rules in production
5. **Use separate Firebase projects** - One for development, one for production

### ❌ What NOT to Do:
- ❌ Don't hardcode credentials in source files
- ❌ Don't share `.env` files via email/chat
- ❌ Don't commit credentials to Git
- ❌ Don't use same keys in dev/prod environments
- ❌ Don't expose API keys in browser console logs

## 🔄 GitHub → Vercel Workflow

### When You Push to GitHub:

```bash
git add .
git commit -m "Update smart farm features"
git push origin main
```

### Vercel Automatically:
1. ✅ Detects the push
2. ✅ Clones your repository
3. ✅ Installs dependencies: `npm install`
4. ✅ Runs build: `npm run build`
5. ✅ Applies environment variables
6. ✅ Deploys to CDN
7. ✅ Updates your live site

**Time**: Usually 1-3 minutes

## 📊 Checking Deployment Status

### In Vercel Dashboard:
1. Click **Deployments** tab
2. Green checkmark = Successful ✅
3. Red X = Failed ❌
4. Click deployment to see build logs

### Common Issues:

| Error | Solution |
|-------|----------|
| `Firebase configuration is missing` | Check env vars are set in Vercel |
| `Build failed` | Check Console tab for error messages |
| `Blank page` | Clear browser cache, check Firebase connection |
| `API errors` | Check LM Studio URL is accessible |

## 🔧 Environment Variable Priority

Vercel uses variables in this order:

1. **Vercel Production Dashboard** (for production builds)
2. **`.env.local`** (for local `npm run dev`)
3. **Default values** (fallback in code)

```javascript
// This will use:
// 1. Vercel env var if deployed
// 2. .env.local if running locally
// 3. "http://localhost:1234/v1" if no env var set
const apiBaseUrl = import.meta.env.VITE_LM_STUDIO_API_URL || "http://localhost:1234/v1";
```

## 🚀 Quick Deploy Checklist

- [ ] `.env.local` has your credentials locally
- [ ] `.env.local` is in `.gitignore` (no commits)
- [ ] Vercel dashboard has all required env vars
- [ ] Firebase rules allow your app to read/write
- [ ] Latest code is pushed to GitHub `main` branch
- [ ] Vercel shows green checkmark on deployment

## 🌐 Your Live Website

After deployment:
- Production URL: https://your-vercel-domain.vercel.app
- Check Vercel dashboard for exact URL
- Add custom domain in Project Settings if desired

## 🔄 Redeploy Without Changes

If you just updated environment variables:

1. Go to **Deployments**
2. Click latest deployment
3. Click **⋮** menu (three dots)
4. Click **Redeploy** (forces rebuild with new env vars)

## 📱 Testing Production Build Locally

```bash
# Build production version
npm run build

# Test it locally
npm run preview

# Opens at http://localhost:4173 (or similar)
```

## 📞 Troubleshooting

### Firebase Not Connecting?
```javascript
// Check in browser console (F12)
console.log("API Key:", import.meta.env.VITE_FIREBASE_API_KEY);
```

If undefined, environment variables aren't set in Vercel.

### LM Studio API Not Working?
1. Check VITE_LM_STUDIO_API_URL in Vercel
2. Ensure API endpoint is publicly accessible
3. Add CORS headers if needed

### Build Fails?
1. Check Vercel build logs
2. Run `npm run build` locally to debug
3. Check for syntax errors in modified files

---

**Deployment**: ✅ Automatic via GitHub  
**Environment**: 🔐 Secure via Vercel dashboard  
**Status**: 🟢 Ready to deploy
