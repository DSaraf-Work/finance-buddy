# Onboarding & Setup Guide

Welcome to Finance Buddy! This guide will walk you through setting up the project locally and in production.

## 🚀 Quick Start (5 Minutes)

### 1. Database Migration
1. Go to your **Supabase Dashboard** → **SQL Editor**.
2. Run the initial migration from `infra/migrations/0001_init.sql`.
3. Run the notifications and auto-sync migration from `infra/migrations/0002_notifications_and_auto_sync.sql`.

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in the following:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gmail OAuth
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret

# AI Providers (At least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Security
CRON_SECRET=$(openssl rand -hex 32)
COOKIE_NAME=fb_session
```

### 3. Local Development
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`.

---

## 🔧 Core Features Setup

### Gmail Integration
1. Configure your Google Cloud Console project.
2. Add `http://localhost:3000/api/gmail/callback` to **Authorized redirect URIs**.
3. Connect your Gmail account(s) via the App UI.

### Gmail Auto-Sync & Notifications
Finance Buddy automatically syncs new financial emails and notifies you.

1. **Enable Auto-Sync**: Go to `/settings/auto-sync` in the app and toggle it on for your connection.
2. **Cron Job**: In production (Vercel), ensure the cron job is active (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
3. **Notification Bell**: Ensure the `<NotificationBell />` is included in your `src/components/Layout.tsx`.

---

## 🧪 Verification & Testing

### Test Credentials
Use these for internal testing:
- **Email**: `dheerajsaraf1996@gmail.com`
- **Password**: `Abcd1234`

### Trigger Manual Sync
You can manually test the cron job via:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/gmail-auto-sync
```

---

## 📚 Further Reading
- [Deployment Guide](./DEPLOYMENT.md)
- [Gmail Sync & Filters](./docs/GMAIL_SYNC.md)
- [Transaction Management](./docs/TRANSACTION_MANAGEMENT.md)
- [AI Setup & Strategies](./docs/AI_SETUP.md)
- [Admin Dashboard](./docs/ADMIN_DASHBOARD.md)
- [Developer Tools](./docs/DEVELOPER_TOOLS.md)

