// Mock AI Model for Testing (No API Key Required)

import { BaseAIModel, AIRequest, AIResponse } from '../types';

export class MockAIModel extends BaseAIModel {
  constructor(config: any) {
    super(config);
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    console.log('🧪 Mock AI Model processing request...');
    
    // Simulate processing delay
    await this.sleep(500 + Math.random() * 1000);
    
    // Generate mock transaction data based on email content
    const mockTransaction = this.generateMockTransaction(request);
    
    return {
      content: JSON.stringify(mockTransaction),
      model: this.config.model,
      provider: this.config.provider,
      usage: {
        promptTokens: request.prompt.length / 4, // Rough estimate
        completionTokens: JSON.stringify(mockTransaction).length / 4,
        totalTokens: (request.prompt.length + JSON.stringify(mockTransaction).length) / 4,
      },
      metadata: {
        isMock: true,
        ...request.metadata,
      },
    };
  }

  async isHealthy(): Promise<boolean> {
    return true; // Mock model is always healthy
  }

  async getRateLimitStatus(): Promise<{ remaining: number; resetTime: Date }> {
    return {
      remaining: 1000, // Mock unlimited requests
      resetTime: new Date(Date.now() + 3600000), // 1 hour from now
    };
  }

  protected isRateLimitError(error: any): boolean {
    return false; // Mock model never rate limits
  }

  protected isRetryableError(error: any): boolean {
    return false; // Mock model never has retryable errors
  }

  protected extractRetryAfter(error: any): number | undefined {
    return undefined;
  }

  private generateMockTransaction(request: AIRequest): any {
    const content = request.prompt.toLowerCase();
    const subject = request.metadata?.subject?.toLowerCase() || '';
    
    console.log('🎭 Generating mock transaction from content:', {
      contentPreview: content.substring(0, 100) + '...',
      subject: subject.substring(0, 50) + '...',
    });
    
    // Extract patterns from content
    const amountMatch = content.match(/(?:rs\.?\s*|₹\s*|inr\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
    
    // Detect transaction type
    let direction = 'debit';
    if (content.includes('credit') || content.includes('deposit') || content.includes('received')) {
      direction = 'credit';
    }
    
    // Extract merchant/description
    let merchantName = null;
    let category = 'other';
    
    if (content.includes('starbucks')) {
      merchantName = 'Starbucks';
      category = 'food';
    } else if (content.includes('uber') || content.includes('ola')) {
      merchantName = content.includes('uber') ? 'Uber' : 'Ola';
      category = 'transport';
    } else if (content.includes('amazon') || content.includes('flipkart')) {
      merchantName = content.includes('amazon') ? 'Amazon' : 'Flipkart';
      category = 'shopping';
    } else if (content.includes('atm') || content.includes('withdrawal')) {
      merchantName = 'ATM Withdrawal';
      category = 'finance';
    } else if (content.includes('transfer')) {
      merchantName = 'Bank Transfer';
      category = 'finance';
    } else if (content.includes('bill') || content.includes('payment')) {
      merchantName = 'Bill Payment';
      category = 'bills';
    }
    
    // Extract reference ID
    const refMatch = content.match(/(?:ref|reference|txn|transaction)[\s:]*([a-z0-9]+)/i);
    const referenceId = refMatch ? refMatch[1].toUpperCase() : null;
    
    // Extract account hint
    const accountMatch = content.match(/(?:account|a\/c)[\s:]*\*?(\d{4})/i);
    const accountHint = accountMatch ? accountMatch[1] : null;
    
    // Generate transaction time (use current time as fallback)
    const txnTime = new Date().toISOString();
    
    // Calculate confidence based on extracted data
    let confidence = 0.7; // Base confidence for mock
    if (amount) confidence += 0.2;
    if (merchantName) confidence += 0.1;
    if (referenceId) confidence += 0.05;
    if (accountHint) confidence += 0.05;
    confidence = Math.min(confidence, 0.95); // Cap at 95% for mock
    
    const mockTransaction = {
      txnTime,
      amount,
      currency: amount ? 'INR' : null,
      direction,
      merchantName,
      merchantNormalized: merchantName,
      category,
      accountHint,
      referenceId,
      location: null,
      confidence,
    };
    
    console.log('🎭 Generated mock transaction:', mockTransaction);
    
    return mockTransaction;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
