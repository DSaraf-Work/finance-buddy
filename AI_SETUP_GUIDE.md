# AI-Powered Email Processing Setup Guide

## 🎯 Overview

This system uses AI models to automatically extract transaction information from emails and convert them into structured data in the `fb_extracted_transactions` table.

## 🏗️ Architecture

### **Modular AI System**
```
/src/lib/ai/
├── models/          # AI model implementations
│   ├── openai.ts    # GPT-4, GPT-3.5 Turbo
│   ├── anthropic.ts # Claude 3 Sonnet, Haiku
│   └── google.ts    # Gemini Pro
├── manager.ts       # Model selection & fallback
├── config.ts        # Model hierarchy configuration
└── types.ts         # Interfaces & types
```

### **Email Processing Pipeline**
```
/src/lib/email-processing/
├── processor.ts           # Main email processor
├── extractors/
│   └── transaction-extractor.ts  # AI-powered extraction
└── prompts/
    └── transaction-extraction.ts # AI prompts
```

## 🔧 Environment Setup

### **1. AI Model API Keys**

Add these environment variables to your `.env.local`:

```bash
# OpenAI (GPT-4, GPT-3.5)
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your-google-ai-key-here
```

### **2. Model Hierarchy Configuration**

The system uses a 3-tier fallback hierarchy:
1. **Primary**: GPT-4 (highest quality)
2. **Secondary**: Claude 3 Sonnet (backup)
3. **Tertiary**: GPT-3.5 Turbo (cost-effective fallback)

## 🚀 Usage

### **1. Check AI Model Status**
```bash
curl -X GET http://localhost:3000/api/ai/models \
  -H "Cookie: fb_session=your-session-token"
```

### **2. Extract Transaction from Single Email**
```bash
curl -X POST http://localhost:3000/api/emails/extract-transaction \
  -H "Content-Type: application/json" \
  -H "Cookie: fb_session=your-session-token" \
  -d '{
    "emailId": "email-uuid-here",
    "saveToDatabase": true
  }'
```

### **3. Process Multiple Emails**
```bash
curl -X POST http://localhost:3000/api/emails/process \
  -H "Content-Type: application/json" \
  -H "Cookie: fb_session=your-session-token" \
  -d '{
    "batchSize": 10,
    "forceReprocess": false
  }'
```

## 📊 Extracted Fields

The AI extracts these fields from emails:

| Field | Type | Description |
|-------|------|-------------|
| `txn_time` | timestamp | Transaction date/time |
| `amount` | numeric | Transaction amount |
| `currency` | text | Currency code (USD, EUR, etc.) |
| `direction` | text | debit/credit/transfer |
| `merchant_name` | text | Original merchant name |
| `merchant_normalized` | text | Cleaned merchant name |
| `category` | text | Transaction category |
| `account_hint` | text | Last 4 digits of account |
| `reference_id` | text | Transaction reference |
| `location` | text | Transaction location |
| `confidence` | numeric | AI confidence (0-1) |

## 🎛️ Configuration Options

### **Model Selection Strategies**
- `hierarchy`: Try primary → secondary → tertiary
- `load_balance`: Distribute across available models
- `cost_optimize`: Use cheapest available model
- `quality_first`: Use highest quality model

### **Rate Limiting**
- Automatic rate limit detection
- Fallback to secondary models on rate limits
- Configurable retry delays and max attempts

### **Confidence Scoring**
- AI-generated confidence scores (0.0 - 1.0)
- Field-based confidence adjustment
- Configurable confidence thresholds

## 🧪 Testing

Run the comprehensive test script:
```bash
node test-ai-email-processing.js
```

This will:
1. Check available emails
2. Test AI model status
3. Extract transaction from sample email
4. Display results and next steps

## 🔍 Monitoring & Debugging

### **Server Logs**
The system provides detailed logging:
- AI model selection and fallbacks
- Extraction confidence scores
- Processing times and token usage
- Error details and retry attempts

### **Database Queries**
Check processing status:
```sql
-- Email processing stats
SELECT status, COUNT(*) 
FROM fb_emails 
GROUP BY status;

-- Recent extractions
SELECT * FROM fb_extracted_transactions 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎯 Next Steps

1. **Set up API keys** for at least one AI provider
2. **Test with sample emails** using the extraction endpoint
3. **Process email batches** using the processing endpoint
4. **Monitor confidence scores** and adjust prompts if needed
5. **Scale up processing** for larger email volumes

## 🔧 Customization

### **Adding New AI Providers**
1. Create new model class extending `BaseAIModel`
2. Add to `createModel()` in `manager.ts`
3. Update configuration in `config.ts`

### **Improving Extraction Prompts**
Edit prompts in `/src/lib/email-processing/prompts/transaction-extraction.ts`:
- Add domain-specific prompts
- Improve field definitions
- Add few-shot examples

### **Custom Transaction Fields**
1. Add fields to database schema
2. Update `ExtractedTransaction` interface
3. Modify extraction prompts
4. Update field mapping logic

## 🚨 Important Notes

- **API Costs**: Monitor AI model usage and costs
- **Rate Limits**: Respect provider rate limits
- **Data Privacy**: Ensure email content is handled securely
- **Accuracy**: Review extracted transactions for accuracy
- **Fallbacks**: Always have backup models configured
