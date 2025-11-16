# Finance Buddy

> **Intelligent Gmail Financial Email Automation System**

Finance Buddy is a comprehensive financial email management platform that connects multiple Gmail accounts via OAuth, automatically syncs and processes financial emails, and uses AI to extract transaction data with high accuracy. Built with Next.js, Supabase, TypeScript, and integrated with multiple AI providers (OpenAI, Anthropic, Google AI).

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Features Deep Dive](#features-deep-dive)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Performance](#performance)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Finance Buddy automates the tedious process of tracking financial transactions from emails. It connects to your Gmail accounts, automatically syncs financial emails (bank statements, credit card alerts, payment confirmations), and uses advanced AI to extract structured transaction data.

### Problem Statement
- Manual tracking of financial transactions is time-consuming
- Financial data is scattered across multiple email accounts
- Extracting transaction details from emails is error-prone
- No unified view of all financial activities

### Solution
Finance Buddy provides:
- **Automated Email Sync**: Connect multiple Gmail accounts and automatically sync financial emails
- **AI-Powered Extraction**: Extract transaction details (amount, merchant, category, etc.) with 90%+ accuracy
- **Smart Categorization**: Intelligent keyword system for organizing transactions
- **Real-time Notifications**: Get notified when new transactions are detected
- **Comprehensive Dashboard**: View, search, filter, and manage all transactions in one place

---

## ✨ Key Features

### 🔐 Authentication & Security
- **Supabase Auth**: Email/password authentication with secure session management
- **Secure Cookies**: HttpOnly, Secure, SameSite=Strict cookies with 6-month sliding refresh
- **Row Level Security (RLS)**: All user data isolated at database level
- **OAuth 2.0**: PKCE-based Gmail OAuth flow for secure access

### 📧 Gmail Integration
- **Multi-Account Support**: Connect unlimited Gmail accounts
- **OAuth-Only Access**: No password storage, token-based authentication
- **Manual Sync**: Sync emails for specific date ranges with sender filters
- **Auto-Sync**: Automatic 15-minute polling for new emails (configurable)
- **Idempotency**: Strict duplicate prevention across disconnect/reconnect flows
- **Token Management**: Automatic token refresh before expiry

### 🤖 AI Transaction Extraction
- **Multi-Provider Support**: OpenAI (GPT-4), Anthropic (Claude), Google AI (Gemini)
- **Schema-Aware Extraction**: Structured data extraction with validation
- **High Accuracy**: 90%+ confidence scores on transaction extraction
- **Smart Fallbacks**: Automatic retry with different AI providers on failure
- **Batch Processing**: Process multiple emails efficiently
- **Mock AI Mode**: Test without consuming AI credits

### 🏷️ Smart Keyword System
- **Auto-Generated Keywords**: AI suggests relevant keywords for transactions
- **Usage Tracking**: Keywords ranked by frequency (frequent, common, rare)
- **Custom Keywords**: Add your own keywords for better organization
- **Keyword Categories**: Pre-organized categories (Food, Transport, Entertainment, etc.)
- **Search & Filter**: Find transactions quickly using keywords

### 🔔 Notification System
- **Real-time Alerts**: Get notified when new transactions are extracted
- **Web Notifications**: In-app notification bell with unread count
- **Action Links**: Quick access to transaction details from notifications
- **Mark as Read**: Individual or bulk mark as read
- **Notification Types**: Transaction extracted, sync completed, errors, etc.

### 📊 Transaction Management
- **Comprehensive View**: See all transactions with filtering and sorting
- **Advanced Filters**: Filter by date, amount, merchant, category, status, keywords
- **Bulk Actions**: Approve, reject, or mark multiple transactions
- **Edit Transactions**: Modify any transaction field with validation
- **Re-extraction**: Re-run AI extraction on any email
- **Transaction Status**: Review, Approved, Rejected, Invalid states
- **Confidence Scores**: See AI confidence for each extraction

### 🎨 Dark Purple UI/UX Design
- **Modern Dark Theme**: Aesthetic dark purple color scheme throughout
- **Design System**: Comprehensive design tokens (colors, typography, spacing, shadows)
- **Purple Accents**: Primary purple (#6b4ce6) with colored highlights (pink, emerald, amber, cyan)
- **Smooth Animations**: 300ms transitions, purple glow effects, hover states
- **Mobile-First**: Optimized for iPhone 16 (393px × 852px) and all screen sizes
- **Responsive Grids**: Adaptive layouts (1→2→3 columns)
- **High Contrast**: WCAG AA compliant text colors (#f8fafc on #0f0a1a)
- **Touch-Friendly**: Minimum 44px touch targets for mobile
- **Minimalist Aesthetic**: Clean, modern, professional appearance

### 📈 Dashboard & Analytics
- **Overview Stats**: Total transactions, total amount, average confidence
- **Email Stats**: Total emails, processed count, error count
- **Connection Status**: Active Gmail connections with last sync time
- **Visual Insights**: Charts and graphs for spending patterns (planned)

### 🔍 Search & Discovery
- **Email Search**: Full-text search across email subject, sender, body
- **Transaction Search**: Search by merchant, amount, category, keywords
- **Advanced Filters**: Combine multiple filters for precise results
- **Pagination**: Efficient pagination for large datasets
- **Sorting**: Sort by date, amount, confidence, status

### ⚙️ Settings & Configuration
- **Auto-Sync Settings**: Configure sync frequency and filters per connection
- **AI Provider Selection**: Choose preferred AI provider (OpenAI, Anthropic, Google)
- **Mock AI Toggle**: Enable/disable mock AI for testing
- **Bank Account Types**: Manage custom bank account types
- **Keyword Management**: Add, edit, delete, and organize keywords

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.1
- **Design System**: Dark purple theme with comprehensive design tokens
- **UI Components**: Custom React components with dark theme
- **State Management**: React Context API
- **Forms**: Native HTML5 with validation
- **Responsive Design**: Mobile-first approach (iPhone 16 optimized)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Language**: TypeScript 5.0
- **API Style**: RESTful JSON APIs

### Database
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Supabase Client SDK
- **Migrations**: SQL migration files
- **Security**: Row Level Security (RLS) policies

### Authentication
- **Provider**: Supabase Auth
- **Method**: Email/Password
- **Session**: Secure cookies (HttpOnly, Secure, SameSite)
- **Token Refresh**: 6-month sliding window

### External Integrations
- **Gmail API**: OAuth 2.0 with PKCE flow
- **OpenAI**: GPT-4 for transaction extraction
- **Anthropic**: Claude for transaction extraction
- **Google AI**: Gemini for transaction extraction

### DevOps & Deployment
- **Hosting**: Vercel
- **CI/CD**: Vercel automatic deployments
- **Environment**: Production, Staging, Development
- **Monitoring**: Vercel Analytics

### Development Tools
- **Package Manager**: npm 9+
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript strict mode
- **Code Formatting**: Prettier (recommended)
- **Version Control**: Git

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Dashboard │  │Transactions│  │  Settings  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Frontend (React)                      │ │
│  │  • Pages  • Components  • Contexts  • Hooks            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  API Routes (Node.js)                   │ │
│  │  • Auth  • Gmail  • Emails  • Transactions  • AI       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Supabase   │ │  Gmail API   │ │   OpenAI     │ │  Anthropic   │
│  PostgreSQL  │ │   (OAuth)    │ │   (GPT-4)    │ │   (Claude)   │
│     +RLS     │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Data Flow

```
1. User Authentication
   User → Supabase Auth → Session Cookie → Protected Routes

2. Gmail Connection
   User → OAuth Flow → Gmail → Access Token → Database

3. Email Sync
   Cron/Manual → Gmail API → Fetch Emails → Store in DB

4. AI Extraction
   Email → AI Provider → Extract Transaction → Store in DB → Notify User

5. Transaction Management
   User → View/Edit → API → Database → Update UI
```

---

## 📁 Project Structure

```
finance-buddy/
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── Layout.tsx           # Main layout wrapper
│   │   ├── ProtectedRoute.tsx   # Auth guard component
│   │   ├── TransactionModal.tsx # Transaction edit modal
│   │   ├── TransactionRow.tsx   # Transaction list item
│   │   ├── InteractiveKeywordSelector.tsx  # Keyword picker
│   │   ├── KeywordManager.tsx   # Keyword management UI
│   │   ├── NotificationBell.tsx # Notification dropdown
│   │   └── ...                  # Other components
│   │
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── AIContext.tsx        # AI provider state
│   │
│   ├── lib/                      # Shared libraries
│   │   ├── ai/                  # AI integration
│   │   │   ├── manager.ts       # AI provider manager
│   │   │   ├── config.ts        # AI configuration
│   │   │   ├── extractors/      # Transaction extractors
│   │   │   │   └── transaction-schema-extractor.ts
│   │   │   └── models/          # AI model implementations
│   │   │       ├── openai.ts
│   │   │       ├── anthropic.ts
│   │   │       └── google.ts
│   │   │
│   │   ├── auth/                # Authentication
│   │   │   ├── client.ts        # Client-side auth
│   │   │   ├── middleware.ts    # Auth middleware
│   │   │   └── index.ts         # Auth utilities
│   │   │
│   │   ├── email-processing/    # Email processing
│   │   │   ├── processor.ts     # Email processor
│   │   │   ├── extractors/      # Extraction logic
│   │   │   └── prompts/         # AI prompts
│   │   │
│   │   ├── gmail-auto-sync/     # Auto-sync system
│   │   │   ├── sync-executor.ts # Sync execution logic
│   │   │   ├── types.ts         # Type definitions
│   │   │   └── index.ts         # Public API
│   │   │
│   │   ├── keywords/            # Keyword system
│   │   │   └── keyword-service.ts
│   │   │
│   │   ├── notifications/       # Notification system
│   │   │   ├── notification-manager.ts
│   │   │   ├── notification-builder.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── config/              # Configuration
│   │   │   ├── bank-account-types.ts
│   │   │   └── mock-ai-config.ts
│   │   │
│   │   ├── gmail.ts             # Gmail API client
│   │   ├── supabase.ts          # Supabase client
│   │   ├── supabase-server.ts   # Server-side Supabase
│   │   └── auth-client.ts       # Auth client utilities
│   │
│   ├── pages/                    # Next.js pages
│   │   ├── _app.tsx             # App wrapper
│   │   ├── index.tsx            # Dashboard/Home
│   │   ├── auth.tsx             # Login/Signup
│   │   ├── emails.tsx           # Email list
│   │   ├── transactions.tsx     # Transaction list
│   │   ├── notifications.tsx    # Notifications page
│   │   ├── settings.tsx         # Settings page
│   │   ├── admin.tsx            # Admin panel
│   │   │
│   │   ├── auth/                # Auth pages
│   │   │   ├── forgot-password.tsx
│   │   │   └── reset-password.tsx
│   │   │
│   │   ├── settings/            # Settings pages
│   │   │   └── auto-sync.tsx    # Auto-sync settings
│   │   │
│   │   ├── transactions/        # Transaction pages
│   │   │   └── [id].tsx         # Transaction detail
│   │   │
│   │   ├── db/                  # Database workbenches
│   │   │   ├── fb_emails.tsx
│   │   │   └── fb_extracted_transactions.tsx
│   │   │
│   │   └── api/                 # API routes
│   │       ├── auth/            # Authentication APIs
│   │       │   └── session.ts
│   │       │
│   │       ├── gmail/           # Gmail APIs
│   │       │   ├── connect.ts   # OAuth initiation
│   │       │   ├── callback.ts  # OAuth callback
│   │       │   ├── connections.ts # List connections
│   │       │   ├── disconnect.ts  # Disconnect account
│   │       │   ├── manual-sync.ts # Manual sync
│   │       │   ├── backfill.ts    # Backfill jobs
│   │       │   └── auto-sync/     # Auto-sync APIs
│   │       │
│   │       ├── emails/          # Email APIs
│   │       │   ├── search.ts    # Search emails
│   │       │   ├── [id].ts      # Get email by ID
│   │       │   ├── process.ts   # Process emails
│   │       │   └── extract-transaction.ts
│   │       │
│   │       ├── transactions/    # Transaction APIs
│   │       │   ├── search.ts    # Search transactions
│   │       │   ├── index.ts     # List/create transactions
│   │       │   ├── [id]/        # Transaction by ID
│   │       │   ├── re-extract.ts # Re-run AI extraction
│   │       │   └── update-status.ts
│   │       │
│   │       ├── keywords/        # Keyword APIs
│   │       │   ├── index.ts     # List/create keywords
│   │       │   └── [id].ts      # Update/delete keyword
│   │       │
│   │       ├── notifications/   # Notification APIs
│   │       │   ├── index.ts     # List notifications
│   │       │   ├── [id]/        # Notification by ID
│   │       │   ├── unread-count.ts
│   │       │   └── mark-all-read.ts
│   │       │
│   │       ├── ai/              # AI APIs
│   │       │   └── models.ts    # AI model info
│   │       │
│   │       ├── admin/           # Admin APIs
│   │       │   ├── mock-ai.ts   # Mock AI toggle
│   │       │   └── config/      # Configuration
│   │       │
│   │       ├── cron/            # Cron jobs
│   │       │   └── gmail-auto-sync.ts
│   │       │
│   │       └── test/            # Test endpoints
│   │
│   ├── styles/                   # Global styles
│   │   └── globals.css
│   │
│   └── types/                    # TypeScript types
│       ├── database.ts          # Database types
│       ├── gmail.ts             # Gmail types
│       ├── transaction.ts       # Transaction types
│       └── ...
│
├── infra/                        # Infrastructure
│   ├── migrations/              # Database migrations
│   │   └── 0001_init.sql       # Initial schema
│   └── supabase/               # Supabase config
│
├── docs/                         # Documentation
│   ├── Finance-Buddy-PRD-Tech.md
│   ├── Finance-Buddy-ADRs.md
│   ├── Finance-Buddy-DB-UI-Spec.md
│   ├── AUTHENTICATION.md
│   ├── SECURITY.md
│   ├── AUTO_SYNC_*.md
│   ├── GMAIL_AUTO_SYNC_*.md
│   └── ...
│
├── dev/                          # Development docs
│   ├── doc/                     # Phase documentation
│   └── wiki/                    # Phase wikis
│
├── openapi/                      # API specifications
│   └── finance-buddy-openapi.yaml
│
├── scripts/                      # Utility scripts
│   ├── apply-migration.js
│   └── test-apis.js
│
├── public/                       # Static assets
│
├── .env.local                    # Environment variables (not in git)
├── .env.example                  # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── AGENTS.md                     # AI agent guidelines
└── README.md                     # This file
```

---

## 🗄️ Database Schema

### Core Tables

#### `fb_gmail_connections`
Stores Gmail OAuth connections for users.

```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- email_address (text)
- google_user_id (text)
- granted_scopes (text[])
- access_token (text, encrypted)
- refresh_token (text, encrypted)
- token_expiry (timestamptz)
- last_sync_at (timestamptz)
- created_at, updated_at (timestamptz)
- UNIQUE(user_id, email_address)
```

#### `fb_emails`
Stores synced emails with idempotency.

```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- connection_id (uuid, FK → fb_gmail_connections, nullable)
- google_user_id (text)
- message_id (text, Gmail message ID)
- thread_id (text)
- from_address (text)
- subject (text)
- snippet (text)
- internal_date (timestamptz, from Gmail)
- labels (text[])
- headers (jsonb)
- plain_body (text)
- html_body (text)
- status (text: fetched, processed, failed, invalid)
- error_reason (text)
- processed_at (timestamptz)
- created_at, updated_at (timestamptz)
- UNIQUE(user_id, google_user_id, message_id)
```

#### `fb_extracted_transactions`
Stores AI-extracted transaction data.

```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- email_id (uuid, FK → fb_emails)
- google_user_id (text)
- txn_time (timestamptz)
- amount (numeric)
- currency (text, ISO code)
- direction (text: debit, credit, transfer)
- merchant_name (text)
- normalized_merchant (text)
- category (text)
- location (text)
- reference_id (text)
- account_hint (text, e.g., ****1234)
- account_type (text)
- transaction_type (text, e.g., Dr, Cr)
- user_notes (text)
- ai_notes (text, keywords)
- confidence (numeric, 0-1)
- extraction_version (text)
- review_state (text: review, approved, rejected, invalid)
- created_at, updated_at (timestamptz)
```

#### `fb_transaction_keywords`
Manages transaction keywords/tags.

```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- keyword (text)
- category (text)
- usage_count (integer)
- is_active (boolean)
- is_ai_generated (boolean)
- created_at, updated_at (timestamptz)
- UNIQUE(user_id, keyword)
```

#### `fb_notifications`
Stores user notifications.

```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- type (text: transaction_extracted, sync_completed, error, etc.)
- title (text)
- message (text)
- transaction_id (uuid, FK → fb_extracted_transactions, nullable)
- email_id (uuid, FK → fb_emails, nullable)
- action_url (text)
- action_label (text)
- read (boolean)
- read_at (timestamptz)
- created_at, updated_at (timestamptz)
```

#### `fb_jobs`
Manages background jobs (backfill, etc.).

```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- type (text: backfill, auto_sync, etc.)
- payload (jsonb)
- status (text: queued, running, completed, failed)
- attempts (integer)
- last_error (text)
- created_at, updated_at (timestamptz)
```

### Row Level Security (RLS)

All tables have RLS enabled with policies:
```sql
CREATE POLICY "own_data" ON table_name
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

This ensures users can only access their own data.

### Indexes

```sql
-- Email lookups
CREATE INDEX fb_emails_user_time_idx ON fb_emails(user_id, internal_date DESC);
CREATE INDEX fb_emails_user_google_msg_idx ON fb_emails(user_id, google_user_id, message_id);

-- Transaction lookups
CREATE INDEX fb_txn_user_time_idx ON fb_extracted_transactions(user_id, txn_time DESC);
CREATE INDEX fb_txn_user_google_time_idx ON fb_extracted_transactions(user_id, google_user_id, txn_time DESC);

-- Keyword lookups
CREATE INDEX fb_keywords_user_usage_idx ON fb_transaction_keywords(user_id, usage_count DESC);

-- Notification lookups
CREATE INDEX fb_notifications_user_read_idx ON fb_notifications(user_id, read, created_at DESC);
```

---

## 🔌 API Endpoints

### Authentication

#### `POST /api/auth/session`
Get current user session.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Gmail Integration

#### `GET /api/gmail/connect`
Initiate Gmail OAuth flow (PKCE).

**Query Params:**
- None

**Response:**
- Redirects to Google OAuth consent screen

#### `GET /api/gmail/callback`
Handle OAuth callback from Google.

**Query Params:**
- `code`: Authorization code
- `state`: CSRF token

**Response:**
- Redirects to dashboard with connection established

#### `GET /api/gmail/connections`
List user's Gmail connections.

**Response:**
```json
{
  "connections": [
    {
      "id": "uuid",
      "email_address": "user@gmail.com",
      "last_sync_at": "2025-11-02T10:00:00Z",
      "created_at": "2025-10-01T10:00:00Z"
    }
  ]
}
```

#### `POST /api/gmail/disconnect`
Disconnect a Gmail account.

**Request:**
```json
{
  "connection_id": "uuid",
  "revoke": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection disconnected"
}
```

#### `POST /api/gmail/manual-sync`
Manually sync emails for a date range.

**Request:**
```json
{
  "connection_id": "uuid",
  "date_from": "2024-01-01",
  "date_to": "2024-01-31",
  "senders": ["bank@example.com"],
  "page": 1,
  "pageSize": 50,
  "sort": "asc"
}
```

**Response:**
```json
{
  "items": [...],
  "nextPageToken": "page_2",
  "stats": {
    "probed": 50,
    "fetched": 25,
    "upserts": 25
  }
}
```

#### `POST /api/gmail/backfill`
Create a backfill job for large date ranges.

**Request:**
```json
{
  "connection_id": "uuid",
  "date_from": "2023-01-01",
  "date_to": "2024-12-31"
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

### Email Management

#### `POST /api/emails/search`
Search emails with filters.

**Request:**
```json
{
  "date_from": "2024-01-01",
  "date_to": "2024-12-31",
  "sender": "bank@example.com",
  "status": "processed",
  "q": "transaction",
  "page": 1,
  "pageSize": 25,
  "sort": "desc"
}
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "from_address": "bank@example.com",
      "subject": "Transaction Alert",
      "internal_date": "2024-10-30T10:00:00Z",
      "status": "processed"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 25
}
```

#### `GET /api/emails/[id]`
Get email by ID.

**Response:**
```json
{
  "id": "uuid",
  "from_address": "bank@example.com",
  "subject": "Transaction Alert",
  "plain_body": "Your account was debited...",
  "headers": {...},
  "status": "processed"
}
```

#### `POST /api/emails/process`
Process emails with AI extraction.

**Request:**
```json
{
  "email_ids": ["uuid1", "uuid2"],
  "batch_size": 10
}
```

**Response:**
```json
{
  "processed": 2,
  "success": 2,
  "failed": 0,
  "results": [...]
}
```

### Transaction Management

#### `POST /api/transactions/search`
Search transactions with filters.

**Request:**
```json
{
  "date_from": "2024-01-01",
  "date_to": "2024-12-31",
  "direction": "debit",
  "category": "Food",
  "merchant": "Starbucks",
  "min_amount": 10,
  "max_amount": 100,
  "review_state": "review",
  "keywords": ["coffee", "breakfast"],
  "page": 1,
  "pageSize": 25,
  "sort": "desc"
}
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "txn_time": "2024-10-30T10:00:00Z",
      "amount": 25.50,
      "currency": "INR",
      "direction": "debit",
      "merchant_name": "Starbucks",
      "category": "Food",
      "confidence": 0.95,
      "review_state": "review"
    }
  ],
  "total": 50,
  "stats": {
    "total_amount": 1275.00,
    "avg_confidence": 0.92
  }
}
```

#### `GET /api/transactions/[id]`
Get transaction by ID.

#### `PUT /api/transactions`
Update a transaction.

**Request:**
```json
{
  "id": "uuid",
  "merchant_name": "Starbucks Coffee",
  "category": "Food & Dining",
  "user_notes": "Morning coffee",
  "ai_notes": "coffee, breakfast, cafe"
}
```

#### `POST /api/transactions/re-extract`
Re-run AI extraction on an email.

**Request:**
```json
{
  "email_id": "uuid"
}
```

#### `POST /api/transactions/update-status`
Update transaction review status.

**Request:**
```json
{
  "transaction_ids": ["uuid1", "uuid2"],
  "review_state": "approved"
}
```

### Keyword Management

#### `GET /api/keywords`
List user's keywords.

**Query Params:**
- `active_only`: boolean (default: false)

**Response:**
```json
{
  "keywords": [
    {
      "id": "uuid",
      "keyword": "Coffee",
      "category": "Food & Dining",
      "usage_count": 25,
      "is_active": true,
      "is_ai_generated": false
    }
  ]
}
```

#### `POST /api/keywords`
Create a new keyword.

**Request:**
```json
{
  "keyword": "Groceries",
  "category": "Food & Dining"
}
```

#### `PUT /api/keywords/[id]`
Update a keyword.

#### `DELETE /api/keywords/[id]`
Delete a keyword.

### Notifications

#### `GET /api/notifications`
List user's notifications.

**Query Params:**
- `read`: boolean
- `type`: string
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "transaction_extracted",
      "title": "New Transaction",
      "message": "₹500 debit at Starbucks",
      "read": false,
      "action_url": "/transactions/uuid",
      "created_at": "2025-11-02T10:00:00Z"
    }
  ],
  "total": 10
}
```

#### `GET /api/notifications/unread-count`
Get unread notification count.

**Response:**
```json
{
  "count": 5
}
```

#### `PUT /api/notifications/[id]`
Mark notification as read.

#### `POST /api/notifications/mark-all-read`
Mark all notifications as read.

#### `DELETE /api/notifications/[id]`
Delete a notification.

### AI Management

#### `GET /api/ai/models`
Get available AI models and current selection.

**Response:**
```json
{
  "providers": ["openai", "anthropic", "google"],
  "current": "openai",
  "mock_enabled": false
}
```

### Admin

#### `GET /api/admin/mock-ai`
Get mock AI status.

#### `POST /api/admin/mock-ai`
Toggle mock AI mode.

**Request:**
```json
{
  "enabled": true
}
```

### Cron Jobs

#### `GET /api/cron/gmail-auto-sync`
Trigger auto-sync for all connections (called by Vercel Cron).

**Headers:**
- `Authorization`: Bearer token (Vercel Cron secret)

---

## 🎨 Features Deep Dive

### 1. Gmail OAuth Integration

**Flow:**
1. User clicks "Connect Gmail Account"
2. Redirected to Google OAuth consent screen
3. User grants permissions (read-only Gmail access)
4. Callback receives authorization code
5. Exchange code for access & refresh tokens
6. Store tokens securely in database
7. Connection established

**Security:**
- PKCE (Proof Key for Code Exchange) flow
- State parameter for CSRF protection
- Tokens encrypted at rest
- Automatic token refresh before expiry
- Scope validation

**Supported Scopes:**
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/userinfo.email`

### 2. Email Sync System

**Manual Sync:**
- User-initiated sync for specific date ranges
- Optional sender filters (e.g., only bank emails)
- Pagination support for large result sets
- Real-time progress feedback

**Auto-Sync:**
- Runs every 15 minutes via Vercel Cron
- Smart sync window: last processed email - 10 minutes
- Configurable per-connection filters
- Automatic retry on failure
- Rate limiting to respect Gmail API quotas

**Idempotency:**
- Unique constraint: `(user_id, google_user_id, message_id)`
- Prevents duplicates across disconnect/reconnect
- Database-level enforcement

### 3. AI Transaction Extraction

**Extraction Process:**
1. Email fetched from Gmail
2. Content cleaned and formatted
3. Sent to AI provider with schema-aware prompt
4. AI extracts structured transaction data
5. Validation against schema
6. Confidence score calculated
7. Stored in database
8. Notification sent to user

**AI Providers:**
- **OpenAI GPT-4**: High accuracy, good for complex transactions
- **Anthropic Claude**: Excellent reasoning, handles edge cases well
- **Google Gemini**: Fast, cost-effective

**Extraction Fields:**
- Transaction time
- Amount & currency
- Direction (debit/credit/transfer)
- Merchant name & normalized merchant
- Category
- Location
- Reference ID
- Account hint (e.g., ****1234)
- Account type
- Transaction type (Dr/Cr)
- AI-generated keywords
- Confidence score (0-1)

**Smart Features:**
- Automatic retry with fallback providers
- Schema validation
- Confidence thresholds
- Batch processing
- Mock AI mode for testing

### 4. Keyword System

**Auto-Generated Keywords:**
- AI suggests 3-6 relevant keywords per transaction
- Keywords auto-added to user's keyword library
- Usage count tracked automatically

**Keyword Categories:**
- Entertainment (Movies, Music, Games, etc.)
- Food & Dining (Restaurant, Coffee, Groceries, etc.)
- Transportation (Uber, Metro, Fuel, etc.)
- Shopping (Clothes, Electronics, Books, etc.)
- Utilities (Bills, Internet, Phone, etc.)
- Health & Fitness (Gym, Doctor, Medicine, etc.)
- Personal (Family, Friends, Gift, etc.)
- Other (Banking, etc.)

**Usage Tracking:**
- Frequent: Used 10+ times
- Common: Used 3-10 times
- Rare: Used 1-2 times

**Features:**
- Search keywords
- Add custom keywords
- Edit keyword categories
- Deactivate unused keywords
- Bulk keyword operations

### 5. Notification System

**Notification Types:**
- `transaction_extracted`: New transaction detected
- `sync_completed`: Email sync finished
- `sync_failed`: Sync encountered errors
- `extraction_failed`: AI extraction failed
- `connection_expired`: Gmail token expired

**Features:**
- Real-time in-app notifications
- Unread count badge
- Mark as read (individual or bulk)
- Delete notifications
- Action links (quick access to transactions)
- Notification history

**Notification Bell:**
- Shows unread count
- Dropdown with recent notifications
- Click to view details
- Mark all as read option

### 6. Transaction Management

**Review States:**
- **Review**: Needs user review (default)
- **Approved**: User confirmed transaction
- **Rejected**: User rejected transaction
- **Invalid**: Marked as invalid/spam

**Bulk Actions:**
- Approve multiple transactions
- Reject multiple transactions
- Mark as invalid
- Re-extract with AI
- Export to CSV (planned)

**Edit Transaction:**
- All fields editable
- Validation on save
- Keyword selector
- Original email preview
- Confidence score display
- Last updated timestamp

**Filters:**
- Date range
- Amount range
- Direction (debit/credit)
- Category
- Merchant (fuzzy search)
- Review state
- Keywords
- Confidence threshold

**Sorting:**
- Transaction time (asc/desc)
- Amount (asc/desc)
- Confidence (asc/desc)
- Created date (asc/desc)

### 7. Dashboard & Analytics

**Overview Cards:**
- Total transactions count
- Total amount (sum)
- Average confidence score
- Total emails synced

**Connection Status:**
- Active connections count
- Last sync time per connection
- Sync status indicators

**Quick Actions:**
- Connect new Gmail account
- Manual sync
- View recent transactions
- View notifications

**Charts (Planned):**
- Spending over time
- Category breakdown
- Merchant analysis
- Monthly trends

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account (free tier works)
- Google Cloud Project with Gmail API enabled
- OpenAI/Anthropic/Google AI API key (optional, for AI extraction)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/finance-buddy.git
cd finance-buddy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in the required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/callback

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
COOKIE_NAME=fb_session

# AI Provider Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Optional: Vercel Cron Secret (for auto-sync)
CRON_SECRET=your_secret_key
```

### 4. Setup Supabase

1. Create a new Supabase project
2. Copy the project URL and anon key to `.env.local`
3. Get the service role key from Supabase dashboard → Settings → API

### 5. Setup Gmail OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/gmail/callback`
5. Copy Client ID and Client Secret to `.env.local`

### 6. Apply Database Migrations

```bash
node scripts/apply-migration.js
```

This creates all necessary tables, indexes, and RLS policies.

### 7. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 8. Create Your Account

1. Navigate to `http://localhost:3000/auth`
2. Sign up with email and password
3. Verify email (if email verification is enabled)
4. Login to dashboard

### 9. Connect Gmail Account

1. Click "Connect Gmail Account" on dashboard
2. Authorize Finance Buddy to access your Gmail
3. Wait for redirect back to dashboard
4. Connection established!

### 10. Sync Emails

**Manual Sync:**
1. Go to Settings → Auto-Sync
2. Select connection
3. Choose date range
4. Click "Sync Now"

**Auto-Sync:**
1. Go to Settings → Auto-Sync
2. Enable auto-sync for connection
3. Configure filters (optional)
4. Save settings
5. Auto-sync runs every 15 minutes

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `GMAIL_CLIENT_ID` | Yes | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `GMAIL_REDIRECT_URI` | Yes | OAuth redirect URI |
| `NEXTAUTH_URL` | Yes | Application base URL |
| `COOKIE_NAME` | No | Session cookie name (default: fb_session) |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Anthropic API key |
| `GOOGLE_AI_API_KEY` | No | Google AI API key |
| `CRON_SECRET` | No | Secret for Vercel Cron authentication |

### AI Provider Configuration

Edit `src/lib/ai/config.ts` to configure AI providers:

```typescript
export const AI_CONFIG = {
  defaultProvider: 'openai', // or 'anthropic', 'google'
  enableMockAI: false, // Set to true for testing
  retryAttempts: 3,
  timeout: 30000, // 30 seconds
};
```

### Auto-Sync Configuration

Configure auto-sync settings per connection in the UI:
- Settings → Auto-Sync
- Enable/disable auto-sync
- Set sync frequency (default: 15 minutes)
- Configure filters (sender, subject, labels)

### Bank Account Types

Manage custom bank account types:
- Settings → Bank Account Types
- Add custom account types
- Used in transaction extraction

---

## 💻 Development

### Development Workflow

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Code Structure Guidelines

1. **Components**: Reusable React components in `src/components/`
2. **Pages**: Next.js pages in `src/pages/`
3. **API Routes**: Backend APIs in `src/pages/api/`
4. **Libraries**: Shared utilities in `src/lib/`
5. **Types**: TypeScript types in `src/types/`

### Adding New Features

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Feature**
   - Add components/pages as needed
   - Create API endpoints
   - Update types
   - Add documentation

3. **Test Locally**
   - Test all user flows
   - Verify API responses
   - Check error handling
   - Test edge cases

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Describe changes
   - Link related issues
   - Request review

### Database Migrations

To create a new migration:

1. Create SQL file in `infra/migrations/`
   ```bash
   touch infra/migrations/0002_add_new_table.sql
   ```

2. Write migration SQL
   ```sql
   -- Add new table
   CREATE TABLE fb_new_table (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL REFERENCES auth.users(id),
     ...
   );

   -- Add RLS
   ALTER TABLE fb_new_table ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "own_data" ON fb_new_table
     FOR ALL USING (user_id = auth.uid());
   ```

3. Apply migration
   ```bash
   node scripts/apply-migration.js
   ```

### Testing

#### Manual Testing

1. **Authentication Flow**
   - Sign up
   - Login
   - Logout
   - Password reset

2. **Gmail Connection**
   - Connect account
   - Disconnect account
   - Reconnect account

3. **Email Sync**
   - Manual sync
   - Auto-sync
   - Sync with filters

4. **AI Extraction**
   - Process emails
   - View transactions
   - Edit transactions
   - Re-extract

5. **Keyword System**
   - Add keywords
   - Use keywords
   - Search by keywords

6. **Notifications**
   - Receive notifications
   - Mark as read
   - Delete notifications

#### API Testing

Use the test script:
```bash
node scripts/test-apis.js
```

Or use curl/Postman to test individual endpoints.

---

## 🚢 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import Git repository
   - Select Finance Buddy repo

2. **Configure Environment Variables**
   - Add all environment variables from `.env.local`
   - Use production values for Supabase, Gmail OAuth, etc.

3. **Deploy**
   - Vercel automatically deploys on push to main
   - Preview deployments for pull requests

4. **Setup Cron Job**
   - Add `vercel.json` for cron configuration:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/gmail-auto-sync",
         "schedule": "*/15 * * * *"
       }
     ]
   }
   ```

5. **Configure Domain**
   - Add custom domain in Vercel settings
   - Update `NEXTAUTH_URL` and `GMAIL_REDIRECT_URI`

### Manual Deployment

```bash
# Build application
npm run build

# Start production server
npm run start
```

### Environment-Specific Configuration

**Development:**
- `NEXTAUTH_URL=http://localhost:3000`
- `GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/callback`

**Production:**
- `NEXTAUTH_URL=https://your-domain.com`
- `GMAIL_REDIRECT_URI=https://your-domain.com/api/gmail/callback`

---

## 🔒 Security

### Authentication Security

- **Supabase Auth**: Industry-standard authentication
- **Secure Cookies**: HttpOnly, Secure, SameSite=Strict
- **Session Management**: 6-month sliding refresh
- **Password Hashing**: bcrypt with salt
- **CSRF Protection**: State parameter in OAuth flow

### Data Security

- **Row Level Security (RLS)**: Database-level isolation
- **Encrypted Tokens**: Gmail tokens encrypted at rest
- **No Password Storage**: OAuth-only Gmail access
- **Input Validation**: All API inputs validated
- **SQL Injection Prevention**: Parameterized queries

### API Security

- **Authentication Required**: All APIs require valid session
- **Rate Limiting**: Gmail API rate limits respected
- **CORS**: Configured for same-origin only
- **Error Handling**: No sensitive data in error messages

### Best Practices

1. **Never commit `.env.local`** to version control
2. **Rotate API keys** regularly
3. **Use environment variables** for all secrets
4. **Enable 2FA** on Supabase and Google accounts
5. **Monitor logs** for suspicious activity
6. **Keep dependencies updated** for security patches

---

## ⚡ Performance

### Database Optimizations

- **Indexes**: Optimized for common queries
  - User + time-based lookups
  - Message ID lookups
  - Keyword usage lookups
- **RLS Policies**: Efficient user_id filtering
- **Pagination**: Server-side pagination for all lists
- **Connection Pooling**: Supabase handles connection pooling

### API Optimizations

- **Idempotency**: Single probe query using `ANY($ids)`
- **Batch Processing**: Process multiple emails in batches
- **Caching**: Browser caching for static assets
- **Lazy Loading**: Load data on demand

### Frontend Optimizations

- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **CSS Optimization**: Tailwind CSS purging
- **Bundle Size**: Minimized production bundles

### AI Optimizations

- **Retry Logic**: Automatic retry with exponential backoff
- **Fallback Providers**: Switch providers on failure
- **Batch Extraction**: Process multiple emails together
- **Mock AI Mode**: Test without API calls

---

## 📚 Architecture Decisions (ADRs)

### ADR-01: Supabase Auth with Secure Cookies
**Status**: Accepted

**Decision**: Use Supabase Auth with dual-cookie approach (access + refresh) and 6-month sliding refresh.

**Rationale**:
- Industry-standard authentication
- Secure cookie-based sessions
- Automatic token refresh
- Built-in user management

### ADR-02: Gmail OAuth-Only Access
**Status**: Accepted

**Decision**: Use OAuth 2.0 with PKCE for Gmail access. Store tokens with granted scopes.

**Rationale**:
- No password storage
- User-controlled permissions
- Automatic token refresh
- Secure token exchange

### ADR-03: Manual Sync Only (No Polling/Webhooks)
**Status**: Accepted

**Decision**: Use manual sync with `messages.list` + `messages.get`. No Gmail watch/history/polling.

**Rationale**:
- Simpler implementation
- User-controlled sync
- No webhook infrastructure needed
- Easier to debug

**Update**: Auto-sync added later via Vercel Cron (15-minute polling).

### ADR-04: Idempotency via Unique Constraints
**Status**: Accepted

**Decision**: Enforce `UNIQUE (user_id, google_user_id, message_id)` on `fb_emails`.

**Rationale**:
- Database-level duplicate prevention
- Works across disconnect/reconnect
- No application-level deduplication needed

### ADR-05: Gmail internal_date Fidelity
**Status**: Accepted

**Decision**: Store `internal_date` from Gmail's `internalDate` field (milliseconds → UTC).

**Rationale**:
- Accurate transaction timestamps
- Consistent with Gmail's data
- No timezone conversion issues

### ADR-06: Hard Delete Connections on Disconnect
**Status**: Accepted

**Decision**: On disconnect, revoke token then DELETE connection. Emails/transactions persist with `connection_id` set to NULL.

**Rationale**:
- Clean data model
- Historical data preserved
- No orphaned connections
- Clear user intent

### ADR-07: Row Level Security (RLS)
**Status**: Accepted

**Decision**: All `fb_*` tables enforce `user_id = auth.uid()` via RLS policies.

**Rationale**:
- Database-level security
- No application-level filtering needed
- Prevents data leaks
- Supabase best practice

See `docs/Finance-Buddy-ADRs.md` for detailed explanations.

---

## 🧪 Testing

### Test Credentials

For testing, use:
- **Email**: `dheerajsaraf1996@gmail.com`
- **Password**: `Abcd1234`

### Test Scenarios

1. **Authentication**
   - ✅ Sign up with new email
   - ✅ Login with existing account
   - ✅ Logout
   - ✅ Password reset flow

2. **Gmail Connection**
   - ✅ Connect Gmail account
   - ✅ View connections list
   - ✅ Disconnect account
   - ✅ Reconnect same account

3. **Email Sync**
   - ✅ Manual sync with date range
   - ✅ Sync with sender filter
   - ✅ Pagination through results
   - ✅ Idempotency (no duplicates)

4. **AI Extraction**
   - ✅ Process single email
   - ✅ Batch process emails
   - ✅ View extracted transactions
   - ✅ Edit transaction details
   - ✅ Re-extract with AI

5. **Keyword System**
   - ✅ View keywords
   - ✅ Add custom keyword
   - ✅ Use keywords in transactions
   - ✅ Search by keywords

6. **Notifications**
   - ✅ Receive transaction notification
   - ✅ Mark as read
   - ✅ Delete notification
   - ✅ Mark all as read

### API Testing

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/session \
  -H "Cookie: fb_session=..." \
  -H "Content-Type: application/json"

# Test email search
curl -X POST http://localhost:3000/api/emails/search \
  -H "Cookie: fb_session=..." \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pageSize": 10}'

# Test transaction search
curl -X POST http://localhost:3000/api/transactions/search \
  -H "Cookie: fb_session=..." \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pageSize": 10}'
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Code Style

- **TypeScript**: Use strict mode
- **Formatting**: Follow existing code style
- **Naming**: Use descriptive variable/function names
- **Comments**: Add comments for complex logic

### Pull Request Process

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'feat: add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add password reset flow
fix(gmail): handle token refresh error
docs(readme): update setup instructions
```

### Development Guidelines

1. **Follow established patterns** in the codebase
2. **Maintain TypeScript strict mode** compliance
3. **Add tests** for new functionality
4. **Update documentation** for API changes
5. **Ensure RLS policies** are properly enforced
6. **Test thoroughly** before submitting PR

---

## 📖 Documentation

### Available Documentation

- **README.md**: This file (overview and setup)
- **AGENTS.md**: AI agent development guidelines
- **docs/Finance-Buddy-PRD-Tech.md**: Product requirements and technical design
- **docs/Finance-Buddy-ADRs.md**: Architecture decision records
- **docs/Finance-Buddy-DB-UI-Spec.md**: Database and UI specifications
- **docs/AUTHENTICATION.md**: Authentication flow details
- **docs/SECURITY.md**: Security best practices
- **docs/AUTO_SYNC_*.md**: Auto-sync implementation docs
- **docs/GMAIL_AUTO_SYNC_*.md**: Gmail auto-sync architecture
- **openapi/finance-buddy-openapi.yaml**: OpenAPI specification

### Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com)

---

## 🗺️ Roadmap

### Phase 1: Core Features (✅ Completed)
- ✅ Authentication & user management
- ✅ Gmail OAuth integration
- ✅ Manual email sync
- ✅ AI transaction extraction
- ✅ Transaction management UI
- ✅ Keyword system
- ✅ Notification system
- ✅ Auto-sync (15-minute polling)

### Phase 2: Enhanced Features (🚧 In Progress)
- 🚧 Advanced analytics dashboard
- 🚧 Spending insights & trends
- 🚧 Budget tracking
- 🚧 Category-based reports
- 🚧 Export to CSV/Excel
- 🚧 Mobile-responsive UI improvements

### Phase 3: Advanced Features (📋 Planned)
- 📋 Gmail push notifications (webhooks)
- 📋 Real-time sync
- 📋 Multi-currency support
- 📋 Recurring transaction detection
- 📋 Bill reminders
- 📋 Receipt attachment handling
- 📋 Bank statement parsing (PDF)

### Phase 4: Integrations (💡 Ideas)
- 💡 Bank API integrations
- 💡 Credit card API integrations
- 💡 Payment app integrations (PayPal, Venmo, etc.)
- 💡 Accounting software export (QuickBooks, Xero)
- 💡 Tax preparation export
- 💡 Investment tracking

---

## 📄 License

**Private - Finance Buddy Project**

This is a private project. All rights reserved.

---

## 👥 Team

**Developed by**: Finance Buddy Team

**Contact**: dheerajsaraf1996@gmail.com

---

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend as a service
- **Vercel** - Hosting and deployment
- **OpenAI** - AI transaction extraction
- **Anthropic** - AI transaction extraction
- **Google** - Gmail API and AI services
- **Tailwind CSS** - Styling framework

---

## 📝 Changelog

### v1.0.0 (2025-11-02)
- ✨ Initial release
- ✨ Gmail OAuth integration
- ✨ Manual and auto email sync
- ✨ AI-powered transaction extraction
- ✨ Transaction management UI
- ✨ Keyword system
- ✨ Notification system
- ✨ Dashboard and analytics

---

**Made with ❤️ by Finance Buddy Team**
