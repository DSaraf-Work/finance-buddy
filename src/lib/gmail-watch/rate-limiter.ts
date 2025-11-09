/**
 * Rate Limiter for Gmail API calls
 * Gmail API quotas:
 * - 250 quota units per user per second
 * - 1 billion quota units per day
 * 
 * Quota costs:
 * - users.messages.list: 5 units
 * - users.messages.get: 5 units
 * - users.history.list: 5 units
 * - users.watch: 10 units
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequestsPerSecond = 50; // Conservative limit (250 units / 5 units per request)
  private readonly windowMs = 1000; // 1 second window

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No entry or window expired
    if (!entry || now >= entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    // Within window, check count
    if (entry.count < this.maxRequestsPerSecond) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Wait until rate limit allows request
   */
  async waitForLimit(key: string): Promise<void> {
    while (!(await this.checkLimit(key))) {
      const entry = this.limits.get(key);
      if (entry) {
        const waitTime = entry.resetAt - Date.now();
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }

  /**
   * Get current rate limit status
   */
  getStatus(key: string): { count: number; remaining: number; resetAt: number } | null {
    const entry = this.limits.get(key);
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.maxRequestsPerSecond - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

