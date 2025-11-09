/**
 * Error Handler with Exponential Backoff
 * Handles Gmail API errors and implements retry logic
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

export class ErrorHandler {
  private readonly defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  };

  /**
   * Execute function with retry logic
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Last attempt, throw error
        if (attempt === opts.maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelayMs
        );

        console.warn(
          `⚠️ Attempt ${attempt + 1}/${opts.maxRetries + 1} failed: ${error.message}. Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isNonRetryableError(error: any): boolean {
    // 400 Bad Request - Invalid parameters
    if (error.code === 400) return true;

    // 401 Unauthorized - Invalid credentials
    if (error.code === 401) return true;

    // 403 Forbidden - Insufficient permissions
    if (error.code === 403) return true;

    // 404 Not Found - Resource doesn't exist
    if (error.code === 404) return true;

    return false;
  }

  /**
   * Check if error is rate limit error
   */
  isRateLimitError(error: any): boolean {
    return error.code === 429 || error.message?.includes('rate limit');
  }

  /**
   * Check if error is quota exceeded
   */
  isQuotaExceededError(error: any): boolean {
    return (
      error.code === 403 &&
      (error.message?.includes('quota') || error.message?.includes('Quota exceeded'))
    );
  }

  /**
   * Get retry delay from error response
   */
  getRetryDelay(error: any): number {
    // Check for Retry-After header
    if (error.response?.headers?.['retry-after']) {
      const retryAfter = parseInt(error.response.headers['retry-after']);
      if (!isNaN(retryAfter)) {
        return retryAfter * 1000; // Convert to ms
      }
    }

    // Default delay for rate limit errors
    if (this.isRateLimitError(error)) {
      return 60000; // 1 minute
    }

    // Default delay for quota errors
    if (this.isQuotaExceededError(error)) {
      return 300000; // 5 minutes
    }

    return 1000; // Default 1 second
  }

  /**
   * Format error for logging
   */
  formatError(error: any): string {
    if (error.code && error.message) {
      return `[${error.code}] ${error.message}`;
    }
    return error.message || String(error);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

