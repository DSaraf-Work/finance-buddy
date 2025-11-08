/**
 * Performance Monitor for Gmail Watch operations
 * Tracks metrics and performance statistics
 */

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Start tracking an operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}-${Date.now()}-${Math.random()}`;
    
    this.metrics.push({
      operation,
      startTime: Date.now(),
      success: false,
      metadata,
    });

    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return id;
  }

  /**
   * End tracking an operation
   */
  endOperation(operation: string, success: boolean, error?: string): void {
    const metric = this.metrics
      .reverse()
      .find(m => m.operation === operation && !m.endTime);

    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      metric.error = error;
    }

    this.metrics.reverse();
  }

  /**
   * Track operation with automatic timing
   */
  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startOperation(operation, metadata);
    
    try {
      const result = await fn();
      this.endOperation(operation, true);
      return result;
    } catch (error: any) {
      this.endOperation(operation, false, error.message);
      throw error;
    }
  }

  /**
   * Get metrics for an operation
   */
  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
  } {
    const metrics = this.getMetrics(operation).filter(m => m.duration !== undefined);

    if (metrics.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
      };
    }

    const successful = metrics.filter(m => m.success).length;
    const failed = metrics.length - successful;
    const durations = metrics.map(m => m.duration!);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    return {
      total: metrics.length,
      successful,
      failed,
      avgDuration: Math.round(avgDuration),
      minDuration,
      maxDuration,
      successRate: Math.round((successful / metrics.length) * 100),
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter(m => !m.success && m.error)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get summary of all operations
   */
  getSummary(): Record<string, ReturnType<typeof this.getStats>> {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    const summary: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const operation of operations) {
      summary[operation] = this.getStats(operation);
    }

    return summary;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

