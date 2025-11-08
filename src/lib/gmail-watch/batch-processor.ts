import { rateLimiter } from './rate-limiter';
import { errorHandler } from './error-handler';

/**
 * Batch Processor for efficient Gmail API calls
 * Processes items in batches with rate limiting and error handling
 */

export interface BatchOptions {
  batchSize?: number;
  concurrency?: number;
  delayBetweenBatches?: number;
}

export class BatchProcessor {
  private readonly defaultOptions: Required<BatchOptions> = {
    batchSize: 10,
    concurrency: 5,
    delayBetweenBatches: 100,
  };

  /**
   * Process items in batches
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchOptions = {}
  ): Promise<Array<{ item: T; result?: R; error?: Error }>> {
    const opts = { ...this.defaultOptions, ...options };
    const results: Array<{ item: T; result?: R; error?: Error }> = [];

    // Split into batches
    const batches = this.chunkArray(items, opts.batchSize);

    console.log(`📦 Processing ${items.length} items in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);

      // Process batch with concurrency limit
      const batchResults = await this.processConcurrent(
        batch,
        processor,
        opts.concurrency
      );

      results.push(...batchResults);

      // Delay between batches (except last batch)
      if (i < batches.length - 1 && opts.delayBetweenBatches > 0) {
        await this.sleep(opts.delayBetweenBatches);
      }
    }

    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;
    console.log(`✅ Batch processing complete: ${successful} successful, ${failed} failed`);

    return results;
  }

  /**
   * Process items with concurrency limit
   */
  private async processConcurrent<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number
  ): Promise<Array<{ item: T; result?: R; error?: Error }>> {
    const results: Array<{ item: T; result?: R; error?: Error }> = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = this.processWithRateLimit(item, processor).then(
        result => {
          results.push({ item, result });
        },
        error => {
          results.push({ item, error });
        }
      );

      executing.push(promise);

      // Limit concurrency
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        );
      }
    }

    // Wait for remaining promises
    await Promise.all(executing);

    return results;
  }

  /**
   * Process single item with rate limiting
   */
  private async processWithRateLimit<T, R>(
    item: T,
    processor: (item: T) => Promise<R>
  ): Promise<R> {
    // Wait for rate limit
    await rateLimiter.waitForLimit('gmail-api');

    // Process with retry logic
    return await errorHandler.withRetry(() => processor(item));
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get processing statistics
   */
  getStats(results: Array<{ error?: Error }>): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  } {
    const total = results.length;
    const failed = results.filter(r => r.error).length;
    const successful = total - failed;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    };
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor();

