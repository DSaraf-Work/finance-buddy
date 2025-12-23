# Deployment Guide

Finance Buddy is optimized for deployment on **Vercel**.

## 🚀 Deployment Process

### 1. Automatic Deployment
The project is configured to automatically deploy when you push to the `main` branch on GitHub.

### 2. Manual Deployment
You can trigger a manual deployment from the Vercel dashboard.

---

## ⚙️ Environment Variables

Configure the following variables in **Vercel Dashboard** → **Settings** → **Environment Variables**:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (Secret) |
| `GMAIL_CLIENT_ID` | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth client secret (Secret) |
| `CRON_SECRET` | Secret for authenticating cron jobs (Secret) |
| `COOKIE_NAME` | Session cookie name (default: `fb_session`) |
| `OPENAI_API_KEY` | (Optional) OpenAI key for AI features |
| `ANTHROPIC_API_KEY` | (Optional) Anthropic key for AI features |
| `GOOGLE_AI_API_KEY` | (Optional) Google AI key for AI features |

---

## 🔑 Google OAuth Configuration

After deploying, update your [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Add your Vercel deployment URL to **Authorized redirect URIs**:
   - `https://your-app.vercel.app/api/gmail/callback`

---

## 🕐 Cron Job Configuration

Vercel automatically picks up the cron configuration from `vercel.json`.
- **Path**: `/api/cron/gmail-auto-sync`
- **Schedule**: Every 15 minutes (`*/15 * * * *`)

Verify status in **Vercel Dashboard** → **Cron Jobs**.

---

## 🛠️ Troubleshooting
- **Build Failures**: Check Vercel logs for specific error messages.
- **Runtime Errors**: Ensure all environment variables are correctly set and Google OAuth redirect URIs match your deployment URL.
