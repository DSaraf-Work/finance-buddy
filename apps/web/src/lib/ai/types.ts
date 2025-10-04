// AI Model System Types

export interface AIModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface AIModelHierarchy {
  primary: AIModelConfig;
  secondary?: AIModelConfig;
  tertiary?: AIModelConfig;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json';
  metadata?: Record<string, any>;
}



export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface AIError {
  code: string;
  message: string;
  provider: string;
  model: string;
  isRateLimit: boolean;
  isRetryable: boolean;
  retryAfter?: number;
}

export abstract class BaseAIModel {
  protected config: AIModelConfig;
  
  constructor(config: AIModelConfig) {
    this.config = config;
  }

  abstract generateResponse(request: AIRequest): Promise<AIResponse>;
  abstract isHealthy(): Promise<boolean>;
  abstract getRateLimitStatus(): Promise<{
    remaining: number;
    resetTime: Date;
  }>;

  protected handleError(error: any): AIError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      provider: this.config.provider,
      model: this.config.model,
      isRateLimit: this.isRateLimitError(error),
      isRetryable: this.isRetryableError(error),
      retryAfter: this.extractRetryAfter(error),
    };
  }

  protected abstract isRateLimitError(error: any): boolean;
  protected abstract isRetryableError(error: any): boolean;
  protected abstract extractRetryAfter(error: any): number | undefined;
}

// Transaction Extraction Types
export interface TransactionExtractionRequest {
  emailId: string;
  subject?: string;
  fromAddress?: string;
  plainBody?: string;
  content?: string;
  snippet?: string;
  internalDate?: Date;
}

export interface ExtractedTransaction {
  txnTime?: Date;
  amount?: number;
  currency?: string;
  direction?: 'debit' | 'credit' | 'transfer';
  merchantName?: string;
  merchantNormalized?: string;
  category?: string;
  accountHint?: string;
  referenceId?: string;
  location?: string;
  accountType?: string; // Account type classification (DCB_4277, HDFC_SWIGGY_7712, etc.)
  transactionType?: 'Dr' | 'Cr'; // Transaction type (Dr for debit, Cr for credit)
  aiNotes?: string; // AI-generated comma-separated keywords
  confidence: number; // 0-1 confidence score
  extractionVersion: string;
  rawExtraction?: Record<string, any>; // Raw AI response for debugging
}

export interface TransactionExtractionResponse {
  success: boolean;
  transaction?: ExtractedTransaction;
  error?: string;
  modelUsed: string;
  processingTime: number;
}

// Model Selection Strategy
export type ModelSelectionStrategy = 
  | 'hierarchy' // Try primary -> secondary -> tertiary
  | 'load_balance' // Distribute across available models
  | 'cost_optimize' // Use cheapest available model
  | 'quality_first'; // Use highest quality model available

export interface AIManagerConfig {
  hierarchy: AIModelHierarchy;
  strategy: ModelSelectionStrategy;
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  enableFallback: boolean;
}
