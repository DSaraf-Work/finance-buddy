// AI Model Configuration

import { AIModelConfig, AIModelHierarchy, AIManagerConfig } from './types';

// Environment-based model configurations
export function getModelConfigs(): Record<string, AIModelConfig> {
  const configs: Record<string, AIModelConfig> = {};

  // Only add models if their API keys are available
  if (process.env.OPENAI_API_KEY) {
    configs['gpt-4'] = {
      name: 'GPT-4',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 500,
        requestsPerHour: 10000,
      },
    };

    configs['gpt-3.5-turbo'] = {
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 3500,
        requestsPerHour: 90000,
      },
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    configs['claude-3-sonnet'] = {
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 1000,
        requestsPerHour: 50000,
      },
    };

    configs['claude-3-haiku'] = {
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 2000,
        requestsPerHour: 100000,
      },
    };
  }

  if (process.env.GOOGLE_AI_API_KEY) {
    configs['gemini-pro'] = {
      name: 'Gemini Pro',
      provider: 'google',
      model: 'gemini-pro',
      apiKey: process.env.GOOGLE_AI_API_KEY,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1500,
      },
    };
  }

  // Always include mock model as fallback
  configs['mock-ai'] = {
    name: 'Mock AI (Testing)',
    provider: 'mock',
    model: 'mock-transaction-extractor',
    apiKey: 'mock-key', // No real API key needed
    maxTokens: 4000,
    temperature: 0.1,
    timeout: 5000,
    rateLimit: {
      requestsPerMinute: 1000,
      requestsPerHour: 10000,
    },
  };

  return configs;
}

// Default model hierarchy for transaction extraction
export function getDefaultHierarchy(): AIModelHierarchy {
  const configs = getModelConfigs();
  const availableModels = Object.keys(configs);

  console.log('🔧 Available AI models:', availableModels);

  // Build hierarchy based on available models
  const hierarchy: AIModelHierarchy = {} as AIModelHierarchy;

  // Preferred order: GPT-4 > Claude Sonnet > GPT-3.5 > Claude Haiku > Gemini > Mock
  const preferredOrder = ['gpt-4', 'claude-3-sonnet', 'gpt-3.5-turbo', 'claude-3-haiku', 'gemini-pro', 'mock-ai'];
  const availableInOrder = preferredOrder.filter(model => configs[model]);

  if (availableInOrder.length > 0) {
    hierarchy.primary = configs[availableInOrder[0]];
    console.log(`✅ Primary model: ${availableInOrder[0]}`);
  }

  if (availableInOrder.length > 1) {
    hierarchy.secondary = configs[availableInOrder[1]];
    console.log(`✅ Secondary model: ${availableInOrder[1]}`);
  }

  if (availableInOrder.length > 2) {
    hierarchy.tertiary = configs[availableInOrder[2]];
    console.log(`✅ Tertiary model: ${availableInOrder[2]}`);
  }

  if (!hierarchy.primary) {
    console.error('❌ No AI models available! Please set at least one API key.');
  }

  return hierarchy;
}

// AI Manager configuration
export function getAIManagerConfig(): AIManagerConfig {
  return {
    hierarchy: getDefaultHierarchy(),
    strategy: 'hierarchy',
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    healthCheckInterval: 300000, // 5 minutes
    enableFallback: true,
  };
}

// Model-specific configurations for different tasks
export const TASK_CONFIGS = {
  transaction_extraction: {
    temperature: 0.1, // Low temperature for consistent extraction
    maxTokens: 2000,
    responseFormat: 'json' as const,
  },
  merchant_normalization: {
    temperature: 0.0, // Very low for consistent naming
    maxTokens: 100,
    responseFormat: 'text' as const,
  },
  category_classification: {
    temperature: 0.2, // Slightly higher for nuanced categorization
    maxTokens: 50,
    responseFormat: 'text' as const,
  },
} as const;

// Validation functions
export function validateModelConfig(config: AIModelConfig): boolean {
  if (!config.name || !config.provider || !config.model || !config.apiKey) {
    return false;
  }
  
  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    return false;
  }
  
  if (config.maxTokens !== undefined && config.maxTokens <= 0) {
    return false;
  }
  
  return true;
}

export function validateHierarchy(hierarchy: AIModelHierarchy): boolean {
  if (!hierarchy.primary || !validateModelConfig(hierarchy.primary)) {
    return false;
  }
  
  if (hierarchy.secondary && !validateModelConfig(hierarchy.secondary)) {
    return false;
  }
  
  if (hierarchy.tertiary && !validateModelConfig(hierarchy.tertiary)) {
    return false;
  }
  
  return true;
}

// Environment checks
export function checkEnvironmentVariables(): { valid: boolean; missing: string[] } {
  const required = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY', 
    'GOOGLE_AI_API_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
