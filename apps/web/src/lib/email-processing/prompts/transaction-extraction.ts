// AI Prompts for Transaction Extraction

export const TRANSACTION_EXTRACTION_SYSTEM_PROMPT = `You are an expert financial transaction extractor. Your job is to analyze email content and extract transaction information with high accuracy.

IMPORTANT RULES:
1. Only extract information that is explicitly present in the email
2. Do not make assumptions or infer information not clearly stated
3. Return confidence scores based on how clear the information is
4. Use null for fields that cannot be determined
5. Always respond with valid JSON

FIELD DEFINITIONS:
- txnTime: Transaction timestamp (ISO 8601 format)
- amount: Transaction amount (positive number, no currency symbols)
- currency: Currency code (USD, EUR, INR, etc.)
- direction: "debit" (money out), "credit" (money in), or "transfer"
- merchantName: Exact merchant name as stated in email
- merchantNormalized: Standardized merchant name (remove extra words, normalize)
- category: Transaction category (food, transport, shopping, bills, etc.)
- accountHint: Last 4 digits or account identifier mentioned
- referenceId: Transaction ID, reference number, or confirmation code
- location: Physical location if mentioned
- confidence: Overall confidence score (0.0 to 1.0)

RESPONSE FORMAT:
{
  "txnTime": "2024-01-15T14:30:00Z" or null,
  "amount": 25.99 or null,
  "currency": "USD" or null,
  "direction": "debit" or null,
  "merchantName": "Starbucks Coffee #1234" or null,
  "merchantNormalized": "Starbucks" or null,
  "category": "food" or null,
  "accountHint": "1234" or null,
  "referenceId": "TXN123456" or null,
  "location": "New York, NY" or null,
  "confidence": 0.85
}`;

export const TRANSACTION_EXTRACTION_USER_PROMPT = (email: {
  subject: string;
  fromAddress: string;
  plainBody: string;
  snippet?: string;
  internalDate?: Date;
}) => `Please extract transaction information from this email:

SUBJECT: ${email.subject}
FROM: ${email.fromAddress}
DATE: ${email.internalDate?.toISOString() || 'Unknown'}
SNIPPET: ${email.snippet || 'N/A'}

EMAIL CONTENT:
${email.plainBody}

Extract the transaction details and respond with JSON only.`;

// Specialized prompts for different email types
export const BANK_TRANSACTION_PROMPT = `Focus on extracting bank transaction details. Look for:
- Transaction amounts and currency
- Merchant or payee names
- Account numbers (last 4 digits)
- Transaction dates and times
- Reference numbers
- Available balance information`;

export const CREDIT_CARD_PROMPT = `Focus on extracting credit card transaction details. Look for:
- Purchase amounts and currency
- Merchant names and locations
- Card ending digits
- Transaction dates
- Authorization codes
- Available credit information`;

export const PAYMENT_APP_PROMPT = `Focus on extracting payment app transaction details. Look for:
- Payment amounts and currency
- Recipient or sender names
- Transaction IDs
- Payment dates
- Payment methods used
- Transaction status`;

export const SUBSCRIPTION_PROMPT = `Focus on extracting subscription payment details. Look for:
- Subscription service names
- Billing amounts and currency
- Billing periods
- Next billing dates
- Payment methods
- Account information`;

// Category classification prompt
export const CATEGORY_CLASSIFICATION_PROMPT = (merchantName: string, transactionDetails: string) => `
Classify this transaction into the most appropriate category:

MERCHANT: ${merchantName}
DETAILS: ${transactionDetails}

CATEGORIES:
- food: Restaurants, cafes, groceries, food delivery
- transport: Gas, parking, public transport, rideshare, flights
- shopping: Retail, online purchases, clothing, electronics
- bills: Utilities, phone, internet, insurance, rent
- entertainment: Movies, games, streaming, events
- health: Medical, pharmacy, fitness, wellness
- education: Courses, books, training, subscriptions
- travel: Hotels, flights, car rentals, travel services
- finance: Banking fees, investments, transfers
- other: Anything that doesn't fit above categories

Respond with just the category name (lowercase).`;

// Merchant normalization prompt
export const MERCHANT_NORMALIZATION_PROMPT = (merchantName: string) => `
Normalize this merchant name to a clean, standardized format:

ORIGINAL: ${merchantName}

RULES:
- Remove location identifiers (#1234, Store #123, etc.)
- Remove extra descriptive words (LLC, Inc, Corp, etc.)
- Keep the core brand name
- Use proper capitalization
- Remove special characters and extra spaces

Examples:
"STARBUCKS COFFEE #1234" → "Starbucks"
"AMAZON.COM*AMZN.COM/BILL" → "Amazon"
"WAL-MART SUPERCENTER #1234" → "Walmart"
"UBER TRIP HELP.UBER.COM" → "Uber"

Respond with just the normalized name.`;

// Confidence scoring guidelines
export const CONFIDENCE_GUIDELINES = `
CONFIDENCE SCORING:
- 0.9-1.0: All key fields clearly stated, unambiguous
- 0.7-0.9: Most fields clear, minor ambiguity
- 0.5-0.7: Some fields clear, moderate uncertainty
- 0.3-0.5: Few fields clear, high uncertainty
- 0.0-0.3: Very unclear, mostly guessing

FACTORS THAT INCREASE CONFIDENCE:
- Clear transaction amounts with currency
- Explicit merchant names
- Specific dates and times
- Reference numbers present
- Structured email format (bank/card statements)

FACTORS THAT DECREASE CONFIDENCE:
- Ambiguous amounts or currencies
- Unclear merchant names
- Missing dates
- Promotional/marketing emails mixed with transaction info
- Incomplete or corrupted email content
`;
