/**
 * Mock AI Configuration Utility
 * Manages the USE_MOCK_AI flag by reading from the global header config
 */

export class MockAIConfig {
  /**
   * Check if mock AI is enabled by reading from the global config API
   * This ensures consistency across all requests
   */
  static async isEnabledAsync(): Promise<boolean> {
    try {
      // In server-side context, we can't make HTTP requests to ourselves
      // So we'll use a simple in-memory cache that persists across requests
      return this.getInMemoryState();
    } catch (error) {
      console.error('Error checking mock AI status:', error);
      // Default to false (use real AI) on error
      return false;
    }
  }

  /**
   * Synchronous version - reads from in-memory state
   * Use this for backward compatibility
   */
  static isEnabled(): boolean {
    return this.getInMemoryState();
  }

  /**
   * Get in-memory state
   * This is shared across all API routes in the same process
   */
  private static getInMemoryState(): boolean {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      return false; // Client-side always uses real AI
    }

    // Server-side: use global state
    const globalState = (global as any).__MOCK_AI_ENABLED__;
    return globalState !== undefined ? globalState : false; // Default to false (real AI)
  }

  /**
   * Set in-memory state
   */
  private static setInMemoryState(enabled: boolean): void {
    if (typeof window === 'undefined') {
      (global as any).__MOCK_AI_ENABLED__ = enabled;
    }
  }

  /**
   * Enable mock AI responses
   */
  static enable(): void {
    this.setInMemoryState(true);
    console.log('🤖 Mock AI enabled - system will use mock responses for development');
  }

  /**
   * Disable mock AI responses (use real AI)
   */
  static disable(): void {
    this.setInMemoryState(false);
    console.log('🧠 Mock AI disabled - system will use real AI responses');
  }

  /**
   * Toggle mock AI state
   */
  static toggle(): void {
    if (this.isEnabled()) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Get current status with details
   */
  static getStatus(): {
    enabled: boolean;
    source: string;
    description: string;
  } {
    const enabled = this.isEnabled();
    return {
      enabled,
      source: 'server-global',
      description: enabled
        ? 'Using mock AI responses for development/testing'
        : 'Using real AI models (OpenAI, Anthropic, Google)'
    };
  }

  /**
   * Initialize mock AI config on app startup
   */
  static initialize(): void {
    const status = this.getStatus();
    console.log(`🤖 Mock AI Config: ${status.description}`);

    // Add global helper functions for development (client-side only)
    if (typeof window !== 'undefined') {
      (window as any).mockAI = {
        enable: () => this.enable(),
        disable: () => this.disable(),
        toggle: () => this.toggle(),
        status: () => this.getStatus(),
        isEnabled: () => this.isEnabled()
      };

      if (status.enabled) {
        console.log('💡 Development tip: Use mockAI.disable() in console to switch to real AI');
      } else {
        console.log('💡 Development tip: Use mockAI.enable() in console to switch to mock AI');
      }
    }
  }
}

// Auto-initialize when module is loaded
MockAIConfig.initialize();
