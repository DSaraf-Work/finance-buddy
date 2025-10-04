/**
 * Mock AI Configuration Utility
 * Manages the USE_MOCK_AI flag as a server-side global variable
 */

// Global server-side flag - defaults to true for development
let MOCK_AI_ENABLED = true;

export class MockAIConfig {
  /**
   * Check if mock AI is enabled
   */
  static isEnabled(): boolean {
    return MOCK_AI_ENABLED;
  }

  /**
   * Enable mock AI responses
   */
  static enable(): void {
    MOCK_AI_ENABLED = true;
    console.log('🤖 Mock AI enabled - system will use mock responses for development');
  }

  /**
   * Disable mock AI responses (use real AI)
   */
  static disable(): void {
    MOCK_AI_ENABLED = false;
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
