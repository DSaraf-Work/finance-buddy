// OpenAI Model Implementation

import OpenAI from 'openai';
import { BaseAIModel, AIRequest, AIResponse, AIError } from '../types';

export class OpenAIModel extends BaseAIModel {
  private client: OpenAI;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private hourlyRequestCount: number = 0;
  private hourlyResetTime: number = Date.now() + 3600000; // 1 hour from now

  constructor(config: any) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
    });
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      // Rate limiting check
      await this.checkRateLimit();

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
        response_format: request.responseFormat === 'json' 
          ? { type: 'json_object' }
          : undefined,
      });

      // Update rate limiting counters
      this.updateRateLimitCounters();

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        content: choice.message.content,
        model: this.config.model,
        provider: this.config.provider,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
        metadata: {
          finishReason: choice.finish_reason,
          ...request.metadata,
        },
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error(`OpenAI health check failed for ${this.config.model}:`, error);
      return false;
    }
  }

  async getRateLimitStatus(): Promise<{ remaining: number; resetTime: Date }> {
    const now = Date.now();
    
    // Reset hourly counter if needed
    if (now > this.hourlyResetTime) {
      this.hourlyRequestCount = 0;
      this.hourlyResetTime = now + 3600000;
    }

    const minuteRemaining = Math.max(0, 
      (this.config.rateLimit?.requestsPerMinute || 500) - this.getMinuteRequestCount()
    );
    
    const hourlyRemaining = Math.max(0,
      (this.config.rateLimit?.requestsPerHour || 10000) - this.hourlyRequestCount
    );

    return {
      remaining: Math.min(minuteRemaining, hourlyRemaining),
      resetTime: new Date(Math.max(
        this.lastRequestTime + 60000, // Next minute
        this.hourlyResetTime // Next hour
      )),
    };
  }

  protected isRateLimitError(error: any): boolean {
    return error?.status === 429 || 
           error?.code === 'rate_limit_exceeded' ||
           error?.message?.toLowerCase().includes('rate limit');
  }

  protected isRetryableError(error: any): boolean {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(error?.status) ||
           error?.code === 'timeout' ||
           error?.code === 'network_error';
  }

  protected extractRetryAfter(error: any): number | undefined {
    // OpenAI returns retry-after in headers
    const retryAfter = error?.headers?.['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000; // Convert to milliseconds
    }
    
    // Default retry delay for rate limits
    if (this.isRateLimitError(error)) {
      return 60000; // 1 minute
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
    // This is a simplified implementation
    // In production, you might want to use a sliding window
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    if (this.lastRequestTime < oneMinuteAgo) {
      return 0;
    }
    
    return this.requestCount;
  }
}
