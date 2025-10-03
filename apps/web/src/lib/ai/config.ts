// AI Model Configuration

import { AIModelConfig, AIModelHierarchy, AIManagerConfig } from './types';

// Environment-based model configurations
export function getModelConfigs(): Record<string, AIModelConfig> {
  return {
    'gpt-4': {
      name: 'GPT-4',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY!,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 500,
        requestsPerHour: 10000,
      },
    },
    'gpt-3.5-turbo': {
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY!,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 3500,
        requestsPerHour: 90000,
      },
    },
    'claude-3-sonnet': {
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY!,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 1000,
        requestsPerHour: 50000,
      },
    },
    'claude-3-haiku': {
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY!,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 2000,
        requestsPerHour: 100000,
      },
    },
    'gemini-pro': {
      name: 'Gemini Pro',
      provider: 'google',
      model: 'gemini-pro',
      apiKey: process.env.GOOGLE_AI_API_KEY!,
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1500,
      },
    },
  };
}

// Default model hierarchy for transaction extraction
export function getDefaultHierarchy(): AIModelHierarchy {
  const configs = getModelConfigs();
  
  return {
    primary: configs['gpt-4'],
    secondary: configs['claude-3-sonnet'],
    tertiary: configs['gpt-3.5-turbo'],
  };
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
