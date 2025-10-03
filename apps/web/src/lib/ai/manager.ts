// AI Model Manager - Handles model selection, fallbacks, and retries

import { BaseAIModel, AIRequest, AIResponse, AIError, AIManagerConfig, ModelSelectionStrategy } from './types';
import { OpenAIModel } from './models/openai';
import { AnthropicModel } from './models/anthropic';
import { GoogleModel } from './models/google';
import { MockAIModel } from './models/mock';
import { getAIManagerConfig } from './config';

export class AIModelManager {
  private config: AIManagerConfig;
  private models: Map<string, BaseAIModel> = new Map();
  private healthStatus: Map<string, boolean> = new Map();
  private lastHealthCheck: number = 0;

  constructor(config?: Partial<AIManagerConfig>) {
    this.config = { ...getAIManagerConfig(), ...config };
    this.initializeModels();
  }

  private initializeModels(): void {
    const { hierarchy } = this.config;

    console.log('🔧 Initializing AI models...');

    // Initialize primary model
    if (hierarchy.primary) {
      try {
        const model = this.createModel(hierarchy.primary);
        this.models.set('primary', model);
        console.log(`✅ Primary model initialized: ${hierarchy.primary.provider}/${hierarchy.primary.model}`);
      } catch (error: any) {
        console.error(`❌ Failed to initialize primary model: ${error.message}`);
      }
    }

    // Initialize secondary model
    if (hierarchy.secondary) {
      try {
        const model = this.createModel(hierarchy.secondary);
        this.models.set('secondary', model);
        console.log(`✅ Secondary model initialized: ${hierarchy.secondary.provider}/${hierarchy.secondary.model}`);
      } catch (error: any) {
        console.error(`❌ Failed to initialize secondary model: ${error.message}`);
      }
    }

    // Initialize tertiary model
    if (hierarchy.tertiary) {
      try {
        const model = this.createModel(hierarchy.tertiary);
        this.models.set('tertiary', model);
        console.log(`✅ Tertiary model initialized: ${hierarchy.tertiary.provider}/${hierarchy.tertiary.model}`);
      } catch (error: any) {
        console.error(`❌ Failed to initialize tertiary model: ${error.message}`);
      }
    }

    console.log(`🤖 AI Manager initialized with ${this.models.size} models`);

    if (this.models.size === 0) {
      console.error('⚠️ No AI models were successfully initialized! Check your API keys.');
    }
  }

  private createModel(config: any): BaseAIModel {
    switch (config.provider) {
      case 'openai':
        return new OpenAIModel(config);
      case 'anthropic':
        return new AnthropicModel(config);
      case 'google':
        return new GoogleModel(config);
      case 'mock':
        return new MockAIModel(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    let lastError: AIError | null = null;

    // Check if any models are available
    if (this.models.size === 0) {
      throw new Error('No AI models are available. Please check your API key configuration.');
    }

    // Ensure health status is up to date
    await this.updateHealthStatus();

    // Get model order based on strategy
    const modelOrder = this.getModelOrder();
    
    for (const modelKey of modelOrder) {
      const model = this.models.get(modelKey);
      if (!model || !this.healthStatus.get(modelKey)) {
        continue;
      }
      
      try {
        console.log(`🤖 Attempting AI request with ${modelKey} model`);
        const response = await this.executeWithRetry(model, request);
        
        console.log(`✅ AI request successful with ${modelKey} model`, {
          processingTime: Date.now() - startTime,
          model: response.model,
          usage: response.usage,
        });
        
        return response;
      } catch (error: any) {
        lastError = error as AIError;
        
        console.warn(`⚠️ AI request failed with ${modelKey} model:`, {
          error: lastError.message,
          isRateLimit: lastError.isRateLimit,
          isRetryable: lastError.isRetryable,
        });
        
        // If it's a rate limit error, mark model as temporarily unhealthy
        if (lastError.isRateLimit) {
          this.healthStatus.set(modelKey, false);
          // Schedule health check after retry period
          if (lastError.retryAfter) {
            setTimeout(() => {
              this.healthStatus.set(modelKey, true);
            }, lastError.retryAfter);
          }
        }
        
        // If not retryable and we have more models, continue to next
        if (!lastError.isRetryable && this.config.enableFallback) {
          continue;
        }
        
        // If this is the last model or fallback is disabled, throw error
        if (modelKey === modelOrder[modelOrder.length - 1] || !this.config.enableFallback) {
          throw lastError;
        }
      }
    }
    
    // If we get here, all models failed
    throw lastError || new Error('All AI models failed');
  }

  private async executeWithRetry(model: BaseAIModel, request: AIRequest): Promise<AIResponse> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await model.generateResponse(request);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if it's not a retryable error
        if (!error.isRetryable) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.config.maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        const delay = error.retryAfter || this.config.retryDelay * attempt;
        console.log(`🔄 Retrying AI request in ${delay}ms (attempt ${attempt}/${this.config.maxRetries})`);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private getModelOrder(): string[] {
    switch (this.config.strategy) {
      case 'hierarchy':
        return ['primary', 'secondary', 'tertiary'].filter(key => this.models.has(key));
      
      case 'load_balance':
        // Simple round-robin for now
        const available = ['primary', 'secondary', 'tertiary'].filter(key => 
          this.models.has(key) && this.healthStatus.get(key)
        );
        return this.shuffleArray([...available]);
      
      case 'cost_optimize':
        // Order by cost (cheapest first)
        return ['tertiary', 'secondary', 'primary'].filter(key => this.models.has(key));
      
      case 'quality_first':
        // Order by quality (best first)
        return ['primary', 'secondary', 'tertiary'].filter(key => this.models.has(key));
      
      default:
        return ['primary', 'secondary', 'tertiary'].filter(key => this.models.has(key));
    }
  }

  private async updateHealthStatus(): Promise<void> {
    const now = Date.now();
    
    // Only check health if enough time has passed
    if (now - this.lastHealthCheck < this.config.healthCheckInterval) {
      return;
    }
    
    console.log('🔍 Checking AI model health status...');
    
    const healthChecks = Array.from(this.models.entries()).map(async ([key, model]) => {
      try {
        const isHealthy = await model.isHealthy();
        this.healthStatus.set(key, isHealthy);
        console.log(`${isHealthy ? '✅' : '❌'} ${key} model health: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      } catch (error) {
        this.healthStatus.set(key, false);
        console.log(`❌ ${key} model health check failed:`, error);
      }
    });
    
    await Promise.all(healthChecks);
    this.lastHealthCheck = now;
  }

  async getModelStatus(): Promise<Record<string, any>> {
    await this.updateHealthStatus();
    
    const status: Record<string, any> = {};
    
    for (const [key, model] of this.models.entries()) {
      const rateLimitStatus = await model.getRateLimitStatus();
      status[key] = {
        healthy: this.healthStatus.get(key),
        rateLimit: rateLimitStatus,
        config: {
          provider: model['config'].provider,
          model: model['config'].model,
        },
      };
    }
    
    return status;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let aiManagerInstance: AIModelManager | null = null;

export function getAIManager(): AIModelManager {
  if (!aiManagerInstance) {
    aiManagerInstance = new AIModelManager();
  }
  return aiManagerInstance;
}
