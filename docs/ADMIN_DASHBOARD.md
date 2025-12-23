# 🛠️ Admin Dashboard Guide

The Admin Dashboard (`/admin`) is the central control panel for Finance Buddy. It provides visibility into system health, configuration management, and developer tools.

## Table of Contents
1. [System Health](#system-health)
2. [Gmail Connection Management](#gmail-connection-management)
3. [Configuration Management](#configuration-management)
4. [Developer Tools (Mock AI)](#developer-tools-mock-ai)

---

## System Health

The **System Health** section provides a real-time overview of the application's infrastructure status.

| Check | Description |
| :--- | :--- |
| **Database Connectivity** | Connection status to Supabase. |
| **RLS Status** | Verifies that Row-Level Security is enabled on critical tables. |
| **Environment Variables** | Checks for the presence of required API keys (Gmail, AI, Vercel). |
| **Cron Job Status** | Last run time and success/failure status of the Sync Cron. |

---

## Gmail Connection Management

From the Admin Dashboard, you can:
- **Link New Accounts**: Initiate OAuth flow for additional Gmail accounts.
- **Revoke Access**: Disconnect accounts and securely delete stored tokens.
- **View Sync History**: See the total number of emails processed and the last sync timestamp per account.
- **Troubleshoot Tokens**: Identity if a refresh token has expired or been revoked by the user.

---

## Configuration Management

Administrators can tune the application's behavior globally:
- **Bank Account Types**: Define the types of accounts supported (e.g., Savings, Credit Card, Prepaid).
- **Categories**: Add, edit, or delete the taxonomy used for transaction categorization.
- **Custom Account Types**: Management for specialized finance entities.

---

## Developer Tools (Mock AI)

For testing and cost-saving during development, the Admin Dashboard includes a **Mock AI Toggle**.

- **Mock AI Mode**: When enabled, the application bypasses real LLM calls (OpenAI/Anthropic) and uses pre-defined mock responses for transaction extraction.
- **Prompt Debugging**: View the raw prompts sent to the AI (with injected keywords) directly in the console logs.
- **Health Endpoints**: Access links to diagnostic routes like `/api/test/health`.
