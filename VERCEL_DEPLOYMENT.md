# Finance Buddy - Vercel Deployment Guide

This guide provides comprehensive instructions for deploying Finance Buddy to Vercel.

## ⚠️ Important: Single-Environment Configuration

**This deployment uses the SAME Supabase instance and credentials for both local development and production.**

### What This Means

- ✅ **Simplified Setup**: Use your existing `.env.local` credentials
- ✅ **Quick Deployment**: No need to set up separate production services
- ⚠️ **Shared Database**: Development and production data are in the same database
- ⚠️ **Shared Resources**: All API keys and services are shared

### Implications

1. **Data Sharing**: Test data and production data coexist in the same database
2. **User Accounts**: Users created locally will exist in production
3. **Gmail Connections**: OAuth connections are shared between environments
4. **API Quotas**: Development and production share the same API rate limits

---

## Quick Start

### Prerequisites

- Working local development environment
- `.env.local` file with all credentials
- Vercel account connected to GitHub

### Deployment Steps

1. **Validate Configuration**
   ```bash
   npm run validate-deployment
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Copy environment variables from `.env.local`
   - **Only change**: `NEXTAUTH_URL` to your Vercel URL
   - Deploy

3. **Update OAuth Redirect URI**
   - Add production callback URL to Google Cloud Console
   - Keep both local and production URIs

4. **Verify Deployment**
   ```bash
   curl https://your-app.vercel.app/api/test/health
   ```

---

## Environment Variables

### Copy from `.env.local` (Same for Both Environments)

```bash
NEXT_PUBLIC_SUPABASE_URL=<same as local>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as local>
SUPABASE_SERVICE_ROLE_KEY=<same as local>
GMAIL_CLIENT_ID=<same as local>
GMAIL_CLIENT_SECRET=<same as local>
COOKIE_NAME=fb_session
OPENAI_API_KEY=<same as local, if configured>
ANTHROPIC_API_KEY=<same as local, if configured>
GOOGLE_AI_API_KEY=<same as local, if configured>
```

### Only This Changes

```bash
# Local
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://your-app.vercel.app
```

---

## OAuth Configuration

### Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your existing OAuth 2.0 Client ID
3. Add production redirect URI:
   ```
   https://your-app.vercel.app/api/gmail/callback
   ```
4. You should have BOTH:
   - `http://localhost:3000/api/gmail/callback` (local)
   - `https://your-app.vercel.app/api/gmail/callback` (production)

---

## Verification

### Health Check

```bash
curl https://your-app.vercel.app/api/test/health
```

Expected: HTTP 200 with `"status": "healthy"`

### Manual Testing

1. Visit your deployment URL
2. Sign in (see same users as local)
3. Connect Gmail (see same connections as local)
4. Sync emails (see same emails as local)

---

## Troubleshooting

### Build Fails

```bash
vercel --force  # Clear cache and redeploy
```

### OAuth Errors

- Verify redirect URI matches exactly
- Check `NEXTAUTH_URL` is correct
- Wait a few minutes after updating OAuth settings

### Database Errors

- Verify Supabase credentials are correct
- Check Supabase project is not paused
- Verify RLS policies are enabled

---

## Important Warnings

⚠️ **Shared Database**:
- Development and production share the same database
- Test data will appear in production
- Be careful with destructive operations

⚠️ **Future Recommendation**:
- Create a separate Supabase project for production when you have real users
- Use different API keys for production services
- Implement proper environment separation

---

## Support

- **Step-by-Step Guide**: `YOUR_DEPLOYMENT_STEPS.md`
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

**Last Updated**: 2025-01-05  
**Version**: 1.0.0

