// Google AI (Gemini) Model Implementation

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIModel, AIRequest, AIResponse } from '../types';

export class GoogleModel extends BaseAIModel {
  private client: GoogleGenerativeAI;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private hourlyRequestCount: number = 0;
  private hourlyResetTime: number = Date.now() + 3600000;

  constructor(config: any) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      await this.checkRateLimit();

      const model = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: request.maxTokens || this.config.maxTokens,
          temperature: request.temperature ?? this.config.temperature,
        },
      });

      // Combine system prompt and user prompt
      let fullPrompt = request.prompt;
      if (request.systemPrompt) {
        fullPrompt = `${request.systemPrompt}\n\n${request.prompt}`;
      }

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      
      this.updateRateLimitCounters();

      const content = response.text();
      if (!content) {
        throw new Error('No content in Google AI response');
      }

      return {
        content,
        model: this.config.model,
        provider: this.config.provider,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        metadata: {
          finishReason: response.candidates?.[0]?.finishReason,
          ...request.metadata,
        },
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: 5,
        },
      });
      
      const result = await model.generateContent('Hello');
      const response = await result.response;
      return !!response.text();
    } catch (error) {
      console.error(`Google AI health check failed for ${this.config.model}:`, error);
      return false;
    }
  }

  async getRateLimitStatus(): Promise<{ remaining: number; resetTime: Date }> {
    const now = Date.now();
    
    if (now > this.hourlyResetTime) {
      this.hourlyRequestCount = 0;
      this.hourlyResetTime = now + 3600000;
    }

    const minuteRemaining = Math.max(0, 
      (this.config.rateLimit?.requestsPerMinute || 60) - this.getMinuteRequestCount()
    );
    
    const hourlyRemaining = Math.max(0,
      (this.config.rateLimit?.requestsPerHour || 1500) - this.hourlyRequestCount
    );

    return {
      remaining: Math.min(minuteRemaining, hourlyRemaining),
      resetTime: new Date(Math.max(
        this.lastRequestTime + 60000,
        this.hourlyResetTime
      )),
    };
  }

  protected isRateLimitError(error: any): boolean {
    return error?.status === 429 || 
           error?.code === 'RATE_LIMIT_EXCEEDED' ||
           error?.message?.toLowerCase().includes('rate limit') ||
           error?.message?.toLowerCase().includes('quota exceeded');
  }

  protected isRetryableError(error: any): boolean {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(error?.status) ||
           error?.code === 'UNAVAILABLE' ||
           error?.code === 'DEADLINE_EXCEEDED' ||
           error?.message?.toLowerCase().includes('timeout');
  }

  protected extractRetryAfter(error: any): number | undefined {
    // Google AI may include retry information in error
    const retryAfter = error?.headers?.['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }
    
    if (this.isRateLimitError(error)) {
      return 60000; // 1 minute default
    }
    
    return undefined;
  }

  private async checkRateLimit(): Promise<void> {
    const status = await this.getRateLimitStatus();
    if (status.remaining <= 0) {
      const waitTime = status.resetTime.getTime() - Date.now();
      throw new Error(`Rate limit exceeded. Retry after ${waitTime}ms`);
    }
  }

  private updateRateLimitCounters(): void {
    const now = Date.now();
    this.lastRequestTime = now;
    this.requestCount++;
    this.hourlyRequestCount++;
  }

  private getMinuteRequestCount(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    if (this.lastRequestTime < oneMinuteAgo) {
      return 0;
    }
    
    return this.requestCount;
  }
}
