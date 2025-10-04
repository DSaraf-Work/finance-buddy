// Anthropic Claude Model Implementation

import Anthropic from '@anthropic-ai/sdk';
import { BaseAIModel, AIRequest, AIResponse } from '../types';

export class AnthropicModel extends BaseAIModel {
  private client: Anthropic;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private hourlyRequestCount: number = 0;
  private hourlyResetTime: number = Date.now() + 3600000;

  constructor(config: any) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
    });
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      await this.checkRateLimit();

      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: request.maxTokens || this.config.maxTokens || 4000,
        temperature: request.temperature ?? this.config.temperature,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
      });

      this.updateRateLimitCounters();

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return {
        content: content.text,
        model: this.config.model,
        provider: this.config.provider,
        usage: {
          promptTokens: message.usage.input_tokens,
          completionTokens: message.usage.output_tokens,
          totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        },
        metadata: {
          stopReason: message.stop_reason,
          ...request.metadata,
        },
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hello' }],
      });
      return response.content.length > 0;
    } catch (error) {
      console.error(`Anthropic health check failed for ${this.config.model}:`, error);
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
      (this.config.rateLimit?.requestsPerMinute || 1000) - this.getMinuteRequestCount()
    );
    
    const hourlyRemaining = Math.max(0,
      (this.config.rateLimit?.requestsPerHour || 50000) - this.hourlyRequestCount
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
           error?.error?.type === 'rate_limit_error' ||
           error?.message?.toLowerCase().includes('rate limit');
  }

  protected isRetryableError(error: any): boolean {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(error?.status) ||
           error?.error?.type === 'api_error' ||
           error?.code === 'timeout';
  }

  protected extractRetryAfter(error: any): number | undefined {
    // Anthropic may include retry-after in error response
    const retryAfter = error?.headers?.['retry-after'] || error?.error?.retry_after;
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
