# 💰 Transaction Management Guide

Finance Buddy provides a powerful interface for tracking and managing your financial transactions extracted from Gmail.

## Table of Contents
1. [Overview](#overview)
2. [How Transactions are Created](#how-transactions-are-created)
3. [Managing Transactions](#managing-transactions)
4. [Transaction Status](#transaction-status)
5. [Categorization](#categorization)
6. [Troubleshooting](#troubleshooting)

---

## Overview

A **Transaction** in Finance Buddy represents a single financial event (debit or credit) extracted from an email or created manually. Each transaction is linked to its source email to maintain a clear audit trail.

---

## How Transactions are Created

### 1. AI Extraction (Automatic)
When an email is synced, Finance Buddy uses AI to extract:
- **Amount & Currency**
- **Merchant Name**
- **Transaction Date**
- **Direction** (Debit/Credit)
- **Account Used** (Hinted from email content)

### 2. Manual Creation (Developer/Admin)
Transactions can be created manually via the API or specific workbench tools for edge cases.

---

## Managing Transactions

### The Transactions List
The main page highlights your recent spending with:
- **Search**: Find transactions by merchant or reference ID.
- **Filters**: Filter by Category, Account, or Date Range.
- **Sticky Stats Bar**: Real-time summary of your total spending.

### Editing a Transaction
If the AI makes a mistake, you can manually override any field:
1. Click on a transaction to view **Details**.
2. Click **Edit**.
3. Update the Amount, Merchant, Category, or Date.
4. Save your changes.

### Re-Extraction
If an email was processed incorrectly, you can trigger **Re-Extraction** from the Transaction Detail page. This will re-run the AI model (using any updated keywords/hints) to strive for better accuracy.

---

## Transaction Status

| Status | Description |
| :--- | :--- |
| **Pending** | Newly extracted transactions awaiting user review. |
| **Confirmed** | Verified by the user. These are included in reports. |
| **Rejected** | Flagged as incorrect or duplicate. Hidden by default. |

---

## Categorization

Categories are assigned automatically based on **Smart Keywords**. You can override these manually, and the system will "learn" your preference by suggesting updated keywords in the Admin Dashboard.

---

## Troubleshooting

- **Amount is zero?** Check the source email body. If it's a complex statement, the AI might need better extraction prompts.
- **Missing merchant?** Ensure the merchant name is present in the email text.
- **Wrong category?** Add the merchant name to the Smart Keyword list in the Admin Dashboard.
