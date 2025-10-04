# Your Vercel Deployment Steps

Follow these steps to deploy Finance Buddy to Vercel.

## ⚠️ Important Notes

- **Single-Environment Setup**: You'll use the SAME Supabase instance and credentials for both local development and production
- **Only `NEXTAUTH_URL` Changes**: This is the ONLY environment variable that will be different between local and production
- **Shared Database**: Development and production will share the same database

---

## Step 1: Verify Local Environment ✅

**Status**: Check if your local development is working

```bash
# Navigate to project directory
cd /Users/dsaraf/Documents/Repos/finance-buddy

# Check if you have a .env.local file
ls -la .env.local

# If you don't have .env.local, create it from .env.example
cp .env.example .env.local

# Edit .env.local and fill in your credentials
# (You should already have this from local development)
```

**Action Required**: 
- [ ] Ensure `.env.local` exists with all your credentials
- [ ] Verify local development works: `npm run dev`
- [ ] Test that you can sign in and connect Gmail locally

---

## Step 2: Validate Deployment Configuration ✅

**Status**: Run the validation script

```bash
# Run validation
npm run validate-deployment
```

**Expected Output**: All checks should pass ✅

**If validation fails**:
- Check that all required files exist
- Verify environment variables in `.env.local`
- Fix any issues reported by the script

---

## Step 3: Commit and Push Changes ✅

**Status**: Ensure all deployment configuration is committed

```bash
# Check current status
git status

# Add any uncommitted files
git add .

# Commit if needed
git commit -m "chore: finalize Vercel deployment configuration"

# Push to your repository
git push origin Vercel
```

**Action Required**:
- [ ] All deployment files are committed
- [ ] Changes are pushed to GitHub

---

## Step 4: Deploy to Vercel 🚀

### Option A: Via Vercel Dashboard (Recommended for First Deployment)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with your GitHub account

2. **Import Repository**
   - Click "Import Project"
   - Select your `finance-buddy` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build` (should auto-fill)
   - **Output Directory**: `apps/web/.next` (should auto-fill)
   - **Install Command**: `npm install` (should auto-fill)

4. **Add Environment Variables**
   
   Click "Environment Variables" and add these:

   **⚠️ COPY THESE FROM YOUR `.env.local` FILE**

   ```bash
   # Supabase Configuration (SAME as local)
   NEXT_PUBLIC_SUPABASE_URL=<copy from .env.local>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from .env.local>
   SUPABASE_SERVICE_ROLE_KEY=<copy from .env.local>

   # Gmail OAuth (SAME as local)
   GMAIL_CLIENT_ID=<copy from .env.local>
   GMAIL_CLIENT_SECRET=<copy from .env.local>

   # Application Configuration
   COOKIE_NAME=fb_session

   # ⚠️ THIS IS THE ONLY ONE THAT CHANGES
   # You'll update this after deployment with your actual Vercel URL
   NEXTAUTH_URL=https://your-app.vercel.app

   # Optional AI Keys (SAME as local, if you have them)
   OPENAI_API_KEY=<copy from .env.local if exists>
   ANTHROPIC_API_KEY=<copy from .env.local if exists>
   GOOGLE_AI_API_KEY=<copy from .env.local if exists>
   ```

   **For each variable**:
   - Click "Add New"
   - Enter the variable name
   - Paste the value from your `.env.local`
   - Select environments: ✅ Production, ✅ Preview, ✅ Development

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Note your deployment URL (e.g., `https://finance-buddy-xxx.vercel.app`)

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Set environment variables
# You'll be prompted to enter each value
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GMAIL_CLIENT_ID production
vercel env add GMAIL_CLIENT_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add COOKIE_NAME production

# Optional AI keys
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add GOOGLE_AI_API_KEY production

# Deploy to production
vercel --prod
```

**Action Required**:
- [ ] Deployment completed successfully
- [ ] Note your Vercel deployment URL

---

## Step 5: Update NEXTAUTH_URL ✅

**Status**: Update the environment variable with your actual Vercel URL

1. **Get Your Vercel URL**
   - From deployment output or Vercel dashboard
   - Example: `https://finance-buddy-abc123.vercel.app`

2. **Update Environment Variable**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Find `NEXTAUTH_URL`
   - Click "Edit"
   - Update value to your actual Vercel URL: `https://your-actual-url.vercel.app`
   - Save

3. **Redeploy** (to pick up the new value)
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger redeployment

**Action Required**:
- [ ] `NEXTAUTH_URL` updated with actual Vercel URL
- [ ] Redeployed to pick up the change

---

## Step 6: Update Google OAuth Redirect URIs ✅

**Status**: Add production redirect URI to your existing OAuth credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Sign in with your Google account

2. **Edit OAuth 2.0 Client ID**
   - Find your existing OAuth 2.0 Client ID (the one you use for local development)
   - Click on it to edit

3. **Add Production Redirect URI**
   - Under "Authorized redirect URIs", you should see:
     ```
     http://localhost:3000/api/gmail/callback
     ```
   - Click "Add URI"
   - Add your production callback URL:
     ```
     https://your-actual-vercel-url.vercel.app/api/gmail/callback
     ```
   - You should now have BOTH URIs listed

4. **Save Changes**
   - Click "Save"
   - Wait a few minutes for changes to propagate

**Action Required**:
- [ ] Production redirect URI added to Google OAuth
- [ ] Both local and production URIs are configured

---

## Step 7: Verify Deployment ✅

**Status**: Test that everything works

### 7.1 Health Check

```bash
# Test health endpoint
curl https://your-actual-vercel-url.vercel.app/api/test/health

# Expected response: HTTP 200 with JSON containing "status": "healthy"
```

### 7.2 Manual Testing

1. **Visit Your Deployment**
   - Go to: `https://your-actual-vercel-url.vercel.app`
   - Homepage should load

2. **Test Authentication**
   - Click "Sign In" or "Sign Up"
   - Create an account or sign in
   - ✅ You should see the same users as in local development (shared database)

3. **Test Gmail OAuth**
   - Go to Settings or Gmail Connections
   - Click "Connect Gmail Account"
   - Complete OAuth flow
   - ✅ You should see the same Gmail connections as in local development (shared database)

4. **Test Email Sync**
   - Sync some emails
   - ✅ Emails should appear in both production and local development (shared database)

5. **Check Vercel Logs**
   - Go to Vercel Dashboard → Your Project → Deployments → Latest → Logs
   - Verify no errors

**Action Required**:
- [ ] Health check returns 200
- [ ] Can sign in/sign up
- [ ] Gmail OAuth works
- [ ] Email sync works
- [ ] No errors in Vercel logs

---

## Step 8: Optional - Configure Custom Domain

**Status**: If you want to use a custom domain

1. **Add Domain in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Click "Add"
   - Enter your domain (e.g., `finance-buddy.yourdomain.com`)
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   - Update `NEXTAUTH_URL` to use your custom domain
   - Redeploy

3. **Update OAuth Redirect URIs**
   - Add custom domain callback URL to Google Cloud Console:
     ```
     https://finance-buddy.yourdomain.com/api/gmail/callback
     ```
   - You'll now have three URIs total

**Action Required** (if using custom domain):
- [ ] Domain configured in Vercel
- [ ] DNS records updated
- [ ] `NEXTAUTH_URL` updated
- [ ] OAuth redirect URI added

---

## ✅ Deployment Complete!

Your Finance Buddy application is now deployed to Vercel!

### What You Have

- ✅ Production deployment on Vercel
- ✅ Same Supabase database for local and production
- ✅ Same Gmail OAuth credentials for both environments
- ✅ Automatic deployments on git push (if configured)

### Important Reminders

⚠️ **Shared Database**:
- Development and production share the same database
- Test data will appear in production
- Be careful with destructive operations

⚠️ **Future Recommendation**:
- When you have real users, create a separate production Supabase instance
- See `VERCEL_DEPLOYMENT.md` → "Migration to Separate Environments"

### Useful Commands

```bash
# View deployment logs
vercel logs

# Redeploy
vercel --prod

# Check deployment status
vercel inspect <deployment-url>

# Pull environment variables to local
vercel env pull
```

### Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Deployment Logs**: Project → Deployments → Latest → Logs
- **Analytics**: Project → Analytics (enable if needed)

### Support

- **Quick Start**: `DEPLOYMENT_QUICKSTART.md`
- **Comprehensive Guide**: `VERCEL_DEPLOYMENT.md`
- **Single-Environment Guide**: `SINGLE_ENVIRONMENT_SETUP.md`
- **Troubleshooting**: `VERCEL_DEPLOYMENT.md` → Troubleshooting section

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and redeploy
vercel --force
```

### OAuth Redirect Errors

- Verify redirect URI in Google Cloud Console matches exactly
- Check `NEXTAUTH_URL` is correct
- Wait a few minutes after updating OAuth settings

### Database Connection Errors

- Verify Supabase credentials are correct
- Check Supabase project is not paused
- Verify RLS policies are enabled

### Environment Variables Not Working

```bash
# List all environment variables
vercel env ls

# Pull latest environment variables
vercel env pull

# Redeploy to pick up changes
vercel --prod
```

---

**Deployment Date**: _____________  
**Vercel URL**: _____________  
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

