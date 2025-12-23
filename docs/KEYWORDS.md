# 🧠 Smart Keyword System

The Smart Keyword System is a core feature of Finance Buddy that bridges the gap between raw email data and meaningful transaction categorization. It uses a combination of user-defined keywords and AI-powered extraction to ensure high accuracy.

## Table of Contents
1. [How it Works](#how-it-works)
2. [Keyword Types](#keyword-types)
3. [AI Integration](#ai-integration)
4. [Management](#management)
5. [Technical Details](#technical-details)

---

## How it Works

Finance Buddy uses keywords to:
1. **Identify Transactions**: Quickly scan emails for known financial indicators (e.g., "OTP", "Spent", "Debited").
2. **Categorize Automatically**: Map specific merchants or services to categories (e.g., "Starbucks" -> "Food & Dining").
3. **Guide AI Extraction**: Keywords are passed to AI models as "hints" to improve field extraction accuracy.

---

## Keyword Types

### 1. System Keywords (Default)
Pre-configured keywords that cover common financial terms and major merchants. These provide out-of-the-box functionality.

### 2. User-Defined Keywords
Keywords manually added by the user to handle niche merchants or personal preferences.

### 3. AI-Suggested Keywords
The system periodically suggests new keywords based on frequently appearing terms in your synced emails that haven't been categorized yet.

---

## AI Integration

Keywords are a critical part of the AI prompt. When an email is sent for extraction, the system:
1. **Scans Content**: Finds all matching keywords in the email.
2. **Injects Hints**: Includes the matched keywords and their associated categories in the AI prompt.
3. **Refines Results**: The AI uses these hints to resolve ambiguities in merchant names or categories.

---

## Management

Users can manage keywords through the **Admin Dashboard** or **Settings**:
- **Add/Delete Keywords**: Manually tune the system.
- **Assign Categories**: Link keywords to specific transaction categories.
- **Frequency Ranking**: View which keywords are triggered most often.

---

## Technical Details

### Service Definition
The system is managed by the `KeywordService` (`src/lib/keywords/keyword-service.ts`).

### Database Schema
Keywords are stored in the `fb_keywords` table:
- `text`: The raw keyword string.
- `category_id`: (Optional) Linked category.
- `usage_count`: Tracked for ranking.
- `user_id`: For personalized keyword sets.

### Key Functions
- `getProcessedKeywords()`: Retrieves and ranks keywords for AI prompts.
- `updateKeywordUsage()`: Increments usage counts after successful extraction.
- `autoGenerateKeywords()`: (Admin only) Uses AI to bulk-generate keywords for a new category.
