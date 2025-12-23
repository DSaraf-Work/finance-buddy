# 🛠️ Developer Tools & Diagnostics

This guide covers the internal tools and utilities available for developing, testing, and troubleshooting Finance Buddy.

## Table of Contents
1. [Health Endpoints](#health-endpoints)
2. [Database Workbenches](#database-workbenches)
3. [System Checks (Admin)](#system-checks-admin)
4. [PWA & Mobile Debugging](#pwa--mobile-debugging)

---

## Health Endpoints

The application provides several API endpoints for quick health checks:

| Endpoint | Description |
| :--- | :--- |
| `/api/test/health` | Verifies the basic API connectivity and runtime status. |
| `/api/ai/models` | Lists available AI providers and their current status (Up/Down). |
| `/api/debug/env` | (Admin Only) Dumps non-sensitive environment variable presence status. |

---

## Database Workbenches

For direct data manipulation and testing without using the main UI, the following workbenches are available:

### Categorization Workbench
- **Location**: `/admin` (Category section)
- **Features**: Batch update transaction categories, test keyword matching logic.

### AI Extraction Workbench
- **Features**: Force re-extraction of transactions using different models or prompt versions. Helpful for fine-tuning the `transaction-extraction` prompt.

---

## System Checks (Admin)

The **Admin Dashboard** (`/admin`) performs several automated checks on every visit:

### 🏰 Security & RLS
- Verifies that **Row Level Security (RLS)** is enabled on all tables in the `public` schema.
- Checks that no tables are accessible without a valid `user_id` context.

### 🧬 Database Schema
- Validates the presence of required tables and columns.
- Checks if the `fb_emails` and `fb_extracted_transactions` relationship is healthy.

### 🌍 Environment Variables
- Ensures `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and at least one AI API key are properly set.

---

## PWA & Mobile Debugging

Finance Buddy is built as a **Mobile-First PWA**.

### Local Testing
1. Ensure you are running on `localhost:3000`.
2. Use Chrome DevTools (F12) and toggle the **Device Toolbar** (Ctrl+Shift+M).
3. Select "iPhone 12 Pro" or "Pixel 7" for the best representation of the target UI.

### Service Workers
- The service worker facilitates push notifications and offline caching.
- To debug, go to Chrome DevTools → **Application** → **Service Workers**.
- Use the "Push" button to simulate an incoming web push notification.
