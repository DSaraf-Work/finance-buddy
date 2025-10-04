/**
 * Mock AI Response System
 * Provides intelligent, pattern-based transaction extraction for development and testing
 */

import { AIResponse, TransactionExtractionRequest } from './types';

interface MockTransactionData {
  txn_time: string | null;
  amount: number | null;
  currency: string;
  direction: 'debit' | 'credit' | null;
  merchant_name: string | null;
  merchant_normalized: string | null;
  category: string | null;
  account_hint: string | null;
  reference_id: string | null;
  location: string | null;
  account_type: string | null;
  transaction_type: 'Dr' | 'Cr' | null;
  ai_notes: string | null;
  confidence: number;
}

export class MockAIResponses {
  private static readonly AMOUNT_PATTERNS = [
    /(?:Rs\.?\s*|₹\s*|INR\s*)([0-9,]+(?:\.[0-9]{2})?)/gi,
    /(?:USD?\s*|\$\s*)([0-9,]+(?:\.[0-9]{2})?)/gi,
    /(?:EUR?\s*|€\s*)([0-9,]+(?:\.[0-9]{2})?)/gi,
    /([0-9,]+(?:\.[0-9]{2})?)\s*(?:Rs\.?|₹|INR)/gi,
  ];

  private static readonly MERCHANT_PATTERNS = [
    /(?:at|from|to)\s+([A-Z][A-Z\s&]+[A-Z])/g,
    /(?:transaction at|payment to|purchase from)\s+([A-Z][A-Z\s&]+)/gi,
    /([A-Z]{2,}(?:\s+[A-Z]{2,})*(?:\s+(?:FOOD|DELIVERY|STORE|MART|BANK|ATM|PVT|LTD))*)/g,
  ];

  private static readonly DEBIT_KEYWORDS = [
    'debited', 'debit', 'charged', 'withdrawn', 'payment', 'purchase', 'spent'
  ];

  private static readonly CREDIT_KEYWORDS = [
    'credited', 'credit', 'received', 'deposited', 'refund', 'cashback', 'salary'
  ];

  private static readonly ACCOUNT_PATTERNS = [
    /(?:account|a\/c|acc).*?(\d{4})/gi,
    /(?:ending|last)\s*(\d{4})/gi,
    /[X*]{4,}(\d{4})/g,
  ];

  private static readonly REFERENCE_PATTERNS = [
    /(?:ref|reference|txn|transaction|utr)[\s:]*([A-Z0-9]{6,})/gi,
    /([A-Z]{3}\d{6,})/g,
    /(\d{12,})/g,
  ];

  private static readonly DATE_PATTERNS = [
    /(\d{4}-\d{2}-\d{2})/g,
    /(\d{2}\/\d{2}\/\d{4})/g,
    /(\d{2}-\d{2}-\d{4})/g,
  ];

  private static readonly TIME_PATTERNS = [
    /(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/gi,
  ];

  private static readonly BANK_ACCOUNT_MAPPING = {
    'dcb': 'DCB_4277',
    'hdfc': 'HDFC_7712',
    'icici': 'ICICI_DEBIT',
    'sbi': 'SBI_DEBIT',
    'axis': 'AXIS_DEBIT',
    'kotak': 'KOTAK_DEBIT',
  };

  private static readonly MERCHANT_CATEGORIES = {
    'swiggy': 'food',
    'zomato': 'food',
    'uber': 'transport',
    'ola': 'transport',
    'amazon': 'shopping',
    'flipkart': 'shopping',
    'netflix': 'entertainment',
    'spotify': 'entertainment',
    'apollo': 'health',
    'medplus': 'health',
    'irctc': 'travel',
    'makemytrip': 'travel',
    'electricity': 'bills',
    'gas': 'bills',
    'water': 'bills',
    'mobile': 'bills',
    'internet': 'bills',
  };

  /**
   * Generate mock AI response based on email content analysis
   */
  static async generateMockResponse(request: TransactionExtractionRequest): Promise<AIResponse> {
    console.log('🎭 Mock AI: Analyzing email content for pattern-based extraction...');
    
    // Simulate realistic processing time
    const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));

    const content = this.extractEmailContent(request);
    const mockData = this.extractTransactionData(content, request);
    
    const response: AIResponse = {
      content: JSON.stringify(mockData),
      model: 'mock-pattern-extractor',
      provider: 'mock',
      usage: {
        promptTokens: content.length / 4, // Rough token estimation
        completionTokens: JSON.stringify(mockData).length / 4,
        totalTokens: (content.length + JSON.stringify(mockData).length) / 4,
      },
      processingTime,
      metadata: {
        extractionType: 'mock-pattern-based',
        schemaVersion: '2.0.0',
        mockAI: true,
        patternsMatched: this.getMatchedPatterns(content),
      }
    };

    console.log('🎭 Mock AI: Generated response with confidence:', mockData.confidence);
    return response;
  }

  private static extractEmailContent(request: TransactionExtractionRequest): string {
    const parts = [];

    console.log('🎭 Mock AI: Input Analysis:');
    console.log('  - Subject:', request.subject || 'N/A');
    console.log('  - From Address:', request.fromAddress || 'N/A');
    console.log('  - Content Length:', request.content?.length || 0);
    console.log('  - Content:', request.content || 'NULL/EMPTY');
    console.log('  - Snippet:', request.snippet || 'N/A');

    if (request.subject) parts.push(request.subject);
    if (request.fromAddress) parts.push(request.fromAddress);
    if (request.content) parts.push(request.content);
    if (request.snippet) parts.push(request.snippet);

    const content = parts.join(' ').toLowerCase();
    console.log('🎭 Mock AI: Combined content for analysis:', content.substring(0, 200) + '...');
    return content;
  }

  private static extractTransactionData(content: string, request: TransactionExtractionRequest): MockTransactionData {
    const amount = this.extractAmount(content);
    const merchant = this.extractMerchant(content);
    const direction = this.extractDirection(content);
    const accountHint = this.extractAccountHint(content);
    const referenceId = this.extractReferenceId(content);
    const accountType = this.extractAccountType(content, request.fromAddress);
    const category = this.extractCategory(content, merchant);
    const txnTime = this.extractDateTime(content);
    
    // Calculate confidence based on extracted data quality
    const confidence = this.calculateConfidence({
      amount,
      merchant_name: merchant,
      direction,
      account_hint: accountHint,
      reference_id: referenceId,
      account_type: accountType
    });

    return {
      txn_time: txnTime,
      amount,
      currency: 'INR',
      direction,
      merchant_name: merchant,
      merchant_normalized: this.normalizeMerchant(merchant),
      category,
      account_hint: accountHint,
      reference_id: referenceId,
      location: null, // Could be enhanced with location patterns
      account_type: accountType,
      transaction_type: direction === 'debit' ? 'Dr' : direction === 'credit' ? 'Cr' : null,
      ai_notes: this.generateAINotes(merchant, category, direction),
      confidence,
    };
  }

  private static extractAmount(content: string): number | null {
    for (const pattern of this.AMOUNT_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern));
      if (matches.length > 0) {
        const amountStr = matches[0][1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    }
    
    // Fallback: generate realistic mock amount based on merchant type
    if (content.includes('swiggy') || content.includes('zomato')) {
      return Math.floor(Math.random() * 800) + 200; // 200-1000 for food
    } else if (content.includes('uber') || content.includes('ola')) {
      return Math.floor(Math.random() * 500) + 100; // 100-600 for transport
    } else if (content.includes('amazon') || content.includes('flipkart')) {
      return Math.floor(Math.random() * 2000) + 500; // 500-2500 for shopping
    }
    
    return Math.floor(Math.random() * 1000) + 100; // Default range
  }

  private static extractMerchant(content: string): string | null {
    for (const pattern of this.MERCHANT_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern));
      if (matches.length > 0) {
        const merchant = matches[0][1].trim();
        if (merchant.length > 2 && merchant.length < 50) {
          return merchant.toUpperCase();
        }
      }
    }
    
    // Check for known merchants
    const knownMerchants = Object.keys(this.MERCHANT_CATEGORIES);
    for (const merchant of knownMerchants) {
      if (content.includes(merchant)) {
        return merchant.toUpperCase();
      }
    }
    
    return null;
  }

  private static extractDirection(content: string): 'debit' | 'credit' | null {
    const debitScore = this.DEBIT_KEYWORDS.reduce((score, keyword) => 
      score + (content.includes(keyword) ? 1 : 0), 0);
    const creditScore = this.CREDIT_KEYWORDS.reduce((score, keyword) => 
      score + (content.includes(keyword) ? 1 : 0), 0);
    
    if (debitScore > creditScore) return 'debit';
    if (creditScore > debitScore) return 'credit';
    
    // Default to debit for most transaction emails
    return 'debit';
  }

  private static extractAccountHint(content: string): string | null {
    for (const pattern of this.ACCOUNT_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern));
      if (matches.length > 0) {
        return matches[0][1];
      }
    }
    return null;
  }

  private static extractReferenceId(content: string): string | null {
    for (const pattern of this.REFERENCE_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern));
      if (matches.length > 0) {
        const ref = matches[0][1];
        if (ref.length >= 6 && ref.length <= 20) {
          return ref;
        }
      }
    }
    
    // Generate mock reference ID
    const prefixes = ['TXN', 'REF', 'UTR', 'SWG', 'AMZ', 'UBR'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 900000) + 100000;
    return `${prefix}${number}`;
  }

  private static extractAccountType(content: string, fromAddress?: string): string | null {
    const email = (fromAddress || '').toLowerCase();
    
    for (const [bank, accountType] of Object.entries(this.BANK_ACCOUNT_MAPPING)) {
      if (email.includes(bank) || content.includes(bank)) {
        return accountType;
      }
    }
    
    return 'OTHER';
  }

  private static extractCategory(content: string, merchant: string | null): string | null {
    // Check merchant-based categories
    if (merchant) {
      const merchantLower = merchant.toLowerCase();
      for (const [key, category] of Object.entries(this.MERCHANT_CATEGORIES)) {
        if (merchantLower.includes(key)) {
          return category;
        }
      }
    }
    
    // Check content-based categories
    for (const [key, category] of Object.entries(this.MERCHANT_CATEGORIES)) {
      if (content.includes(key)) {
        return category;
      }
    }
    
    return 'other';
  }

  private static extractDateTime(content: string): string | null {
    const dateMatches = Array.from(content.matchAll(this.DATE_PATTERNS[0]));
    const timeMatches = Array.from(content.matchAll(this.TIME_PATTERNS[0]));
    
    if (dateMatches.length > 0) {
      const date = dateMatches[0][1];
      const time = timeMatches.length > 0 ? timeMatches[0][1] : '12:00:00';
      
      try {
        const dateTime = new Date(`${date}T${time}`);
        return dateTime.toISOString();
      } catch (error) {
        // Fallback to current date
        return new Date().toISOString();
      }
    }
    
    // Default to current date with some random offset
    const now = new Date();
    const daysOffset = Math.floor(Math.random() * 7); // 0-7 days ago
    now.setDate(now.getDate() - daysOffset);
    return now.toISOString();
  }

  private static normalizeMerchant(merchant: string | null): string | null {
    if (!merchant) return null;
    
    const normalized = merchant.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b(pvt|ltd|limited|inc|corp|company)\b/g, '')
      .trim();
    
    // Capitalize first letter of each word
    return normalized.replace(/\b\w/g, l => l.toUpperCase());
  }

  private static generateAINotes(merchant: string | null, category: string | null, direction: string | null): string | null {
    const notes = [];
    
    if (direction) notes.push(direction === 'debit' ? 'expense' : 'income');
    if (category) notes.push(category);
    if (merchant?.toLowerCase().includes('online')) notes.push('online');
    if (merchant?.toLowerCase().includes('delivery')) notes.push('delivery');
    
    notes.push('transaction', 'automated_extraction');
    
    return notes.join(', ');
  }

  private static calculateConfidence(data: Partial<MockTransactionData>): number {
    let score = 0;
    let maxScore = 0;
    
    // Amount (high importance)
    maxScore += 30;
    if (data.amount && data.amount > 0) score += 30;
    
    // Merchant (high importance)
    maxScore += 25;
    if (data.merchant_name) score += 25;
    
    // Direction (medium importance)
    maxScore += 20;
    if (data.direction) score += 20;
    
    // Account hint (medium importance)
    maxScore += 15;
    if (data.account_hint) score += 15;
    
    // Reference ID (low importance)
    maxScore += 10;
    if (data.reference_id) score += 10;
    
    const confidence = Math.min(score / maxScore, 1.0);
    
    // Add some randomness to make it more realistic
    const randomFactor = (Math.random() - 0.5) * 0.1; // ±5%
    return Math.max(0.1, Math.min(0.99, confidence + randomFactor));
  }

  private static getMatchedPatterns(content: string): string[] {
    const patterns = [];
    
    if (this.AMOUNT_PATTERNS.some(p => p.test(content))) patterns.push('amount');
    if (this.MERCHANT_PATTERNS.some(p => p.test(content))) patterns.push('merchant');
    if (this.ACCOUNT_PATTERNS.some(p => p.test(content))) patterns.push('account');
    if (this.REFERENCE_PATTERNS.some(p => p.test(content))) patterns.push('reference');
    if (this.DATE_PATTERNS.some(p => p.test(content))) patterns.push('date');
    if (this.TIME_PATTERNS.some(p => p.test(content))) patterns.push('time');
    
    return patterns;
  }
}
