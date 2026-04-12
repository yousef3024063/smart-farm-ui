# Push to Vercel in 3 Steps

## Option 1: Using GitHub Desktop (Easiest)

1. **Open GitHub Desktop**
2. Select **smart-farm-ui** repository
3. You should see the changed files listed:
   - `src/firebase.js` (environment variables)
   - `src/App.jsx` (API configuration)
   - `.env.local` (local credentials)
   - `.env.example` (template)
   - `vercel.json` (Vercel config)
   - `.gitignore` (updated)
   - `VERCEL_DEPLOYMENT.md` (guide)

4. **Bottom left**: Write commit message:
   ```
   Configure environment variables for Vercel deployment
   ```

5. Click **Commit to main**

6. Click **Push origin** (top right)

**Done!** ✅ Vercel will automatically build and deploy!

---

## Option 2: Using Git Command Line

```powershell
cd "c:\Users\Lenovo\Documents\GitHub\smart-farm-ui"

# Add all changes
git add .

# Commit with message
git commit -m "Configure environment variables for Vercel deployment"

# Push to GitHub
git push origin main
```

---

## Option 3: Using VS Code

1. Click **Source Control** icon (left sidebar)
2. In the input box, type commit message:
   ```
   Configure environment variables for Vercel deployment
   ```
3. Click **Commit** button
4. Click **Sync Changes** button

---

## ✅ What Happens Next

**After you push to GitHub:**

1. Vercel webhook triggers automatically
2. Vercel pulls latest code
3. Runs: `npm install`
4. Runs: `npm run build`
5. Applies environment variables from Vercel dashboard
6. Deploys to CDN
7. Your site updates live! 🚀

**Time**: Usually 1-3 minutes

---

## 🔐 IMPORTANT: Add Environment Variables to Vercel First!

**Before pushing, make sure:**

1. Go to https://vercel.com/dashboard
2. Select **smart-farm-ui** project
3. Go to **Settings** → **Environment Variables**
4. Add these 8 variables:

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

5. **Click Save** on each one
6. Then push to GitHub

---

## 🔍 Check Deployment Status

After pushing:

1. Go to https://vercel.com/dashboard
2. Click **smart-farm-ui** project
3. Click **Deployments** tab
4. You should see a new deployment in progress:
   - 🟡 Building... → 🟢 Ready

---

## ✨ Result

Once deployed, your website:
- ✅ Uses secure environment variables
- ✅ Connects to Firebase automatically
- ✅ Works on your Vercel domain
- ✅ Auto-updates on GitHub pushes
