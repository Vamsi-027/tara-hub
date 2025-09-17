/*
  Rate Limiter for Image Validation and External API Calls

  Implements token bucket algorithm with smooth rate limiting
  to prevent bursts and ensure consistent throughput.
*/

export interface RateLimiterConfig {
  rate: number; // Requests per second
  burst?: number; // Maximum burst size (defaults to rate)
  smooth?: boolean; // Enforce smooth rate without bursts
  retryDelay?: number; // Delay in ms before retry
  maxRetries?: number; // Maximum retries before rejection
}

export class RateLimiter {
  private config: Required<RateLimiterConfig>;
  private tokens: number;
  private lastRefill: number;
  private queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    retries: number;
  }> = [];
  private processing = false;

  constructor(config: RateLimiterConfig) {
    this.config = {
      rate: config.rate,
      burst: config.burst || config.rate,
      smooth: config.smooth || false,
      retryDelay: config.retryDelay || 100,
      maxRetries: config.maxRetries || 3
    };

    this.tokens = this.config.burst;
    this.lastRefill = Date.now();
  }

  /**
   * Acquire a token for rate-limited operation
   */
  public async acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, retries: 0 });
      this.processQueue();
    });
  }

  /**
   * Try to acquire a token without waiting
   */
  public tryAcquire(): boolean {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Get current limiter status
   */
  public getStatus(): {
    availableTokens: number;
    queueLength: number;
    rate: number;
    smooth: boolean;
  } {
    this.refillTokens();

    return {
      availableTokens: Math.floor(this.tokens),
      queueLength: this.queue.length,
      rate: this.config.rate,
      smooth: this.config.smooth
    };
  }

  /**
   * Reset the rate limiter
   */
  public reset(): void {
    this.tokens = this.config.burst;
    this.lastRefill = Date.now();

    // Reject all queued requests
    const queue = [...this.queue];
    this.queue = [];

    queue.forEach(item => {
      item.reject(new Error('Rate limiter reset'));
    });
  }

  /**
   * Update configuration (clears queue)
   */
  public updateConfig(newConfig: Partial<RateLimiterConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      burst: newConfig.burst || newConfig.rate || this.config.burst
    };

    this.reset();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds

    const tokensToAdd = elapsed * this.config.rate;
    this.tokens = Math.min(this.config.burst, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      this.refillTokens();

      if (this.tokens < 1) {
        // No tokens available
        if (this.config.smooth) {
          // Calculate exact wait time for next token
          const waitTime = (1 - this.tokens) / this.config.rate * 1000;
          await this.sleep(Math.max(1, Math.ceil(waitTime)));
          continue;
        } else {
          // Wait for retry delay
          await this.sleep(this.config.retryDelay);
          continue;
        }
      }

      // Process next request
      const request = this.queue.shift();
      if (!request) continue;

      this.tokens--;
      request.resolve();

      // If smooth mode, enforce consistent spacing
      if (this.config.smooth && this.queue.length > 0) {
        const minInterval = 1000 / this.config.rate;
        await this.sleep(minInterval);
      }
    }

    this.processing = false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ImageValidationRateLimiter {
  private limiter: RateLimiter;
  private validationStats = {
    validated: 0,
    skipped: 0,
    failed: 0,
    throttled: 0
  };

  constructor(ratePerSecond: number = 5, smooth: boolean = true) {
    this.limiter = new RateLimiter({
      rate: ratePerSecond,
      burst: Math.max(1, Math.floor(ratePerSecond / 2)), // Allow small burst
      smooth,
      retryDelay: 200,
      maxRetries: 3
    });
  }

  /**
   * Validate image URL with rate limiting
   */
  public async validateImageUrl(
    url: string,
    skipValidation: boolean = false
  ): Promise<{ valid: boolean; skipped: boolean; error?: string }> {
    if (skipValidation) {
      this.validationStats.skipped++;
      return { valid: true, skipped: true };
    }

    try {
      // Acquire rate limit token
      await this.limiter.acquire();
      this.validationStats.throttled++;

      // Perform HEAD request to validate image
      const response = await this.performHeadRequest(url);

      if (response.ok) {
        this.validationStats.validated++;
        return { valid: true, skipped: false };
      } else {
        this.validationStats.failed++;
        return {
          valid: false,
          skipped: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      this.validationStats.failed++;
      return {
        valid: false,
        skipped: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate multiple image URLs with rate limiting
   */
  public async validateImageUrls(
    urls: string[],
    skipValidation: boolean = false,
    onProgress?: (validated: number, total: number) => void
  ): Promise<Map<string, { valid: boolean; error?: string }>> {
    const results = new Map<string, { valid: boolean; error?: string }>();

    if (skipValidation) {
      urls.forEach(url => {
        results.set(url, { valid: true });
        this.validationStats.skipped++;
      });
      return results;
    }

    let validated = 0;
    const total = urls.length;

    // Process URLs with rate limiting
    for (const url of urls) {
      const result = await this.validateImageUrl(url, false);
      results.set(url, {
        valid: result.valid,
        error: result.error
      });

      validated++;
      if (onProgress) {
        onProgress(validated, total);
      }
    }

    return results;
  }

  /**
   * Perform HEAD request with timeout
   */
  private async performHeadRequest(
    url: string,
    timeoutMs: number = 3000
  ): Promise<{ ok: boolean; status: number; statusText: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MedusaJS-Import/1.0'
        }
      });

      clearTimeout(timeoutId);

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }

      throw error;
    }
  }

  /**
   * Get validation statistics
   */
  public getStats(): typeof this.validationStats & { rate_limit: any } {
    return {
      ...this.validationStats,
      rate_limit: this.limiter.getStatus()
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.validationStats = {
      validated: 0,
      skipped: 0,
      failed: 0,
      throttled: 0
    };
  }

  /**
   * Update rate limit configuration
   */
  public updateRateLimit(ratePerSecond: number, smooth: boolean = true): void {
    this.limiter.updateConfig({
      rate: ratePerSecond,
      burst: Math.max(1, Math.floor(ratePerSecond / 2)),
      smooth
    });
  }
}

// General purpose rate limiter for API calls
export class ApiRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * Get or create a rate limiter for a specific API
   */
  public getLimiter(apiName: string, config?: RateLimiterConfig): RateLimiter {
    if (!this.limiters.has(apiName)) {
      const defaultConfig: RateLimiterConfig = {
        rate: 10, // 10 requests per second default
        burst: 20,
        smooth: false,
        ...config
      };
      this.limiters.set(apiName, new RateLimiter(defaultConfig));
    }

    return this.limiters.get(apiName)!;
  }

  /**
   * Execute API call with rate limiting
   */
  public async executeWithRateLimit<T>(
    apiName: string,
    fn: () => Promise<T>,
    config?: RateLimiterConfig
  ): Promise<T> {
    const limiter = this.getLimiter(apiName, config);

    await limiter.acquire();
    return fn();
  }

  /**
   * Get all limiter statuses
   */
  public getAllStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};

    this.limiters.forEach((limiter, name) => {
      statuses[name] = limiter.getStatus();
    });

    return statuses;
  }

  /**
   * Reset all rate limiters
   */
  public resetAll(): void {
    this.limiters.forEach(limiter => limiter.reset());
  }
}

// Singleton instances
let imageValidator: ImageValidationRateLimiter | null = null;
let apiLimiter: ApiRateLimiter | null = null;

export function getImageValidator(
  ratePerSecond?: number,
  smooth?: boolean
): ImageValidationRateLimiter {
  if (!imageValidator) {
    const rate = parseInt(process.env.IMAGE_VALIDATION_RATE || '5');
    const smoothMode = process.env.IMAGE_VALIDATION_SMOOTH !== 'false';
    imageValidator = new ImageValidationRateLimiter(
      ratePerSecond || rate,
      smooth !== undefined ? smooth : smoothMode
    );
  }
  return imageValidator;
}

export function getApiRateLimiter(): ApiRateLimiter {
  if (!apiLimiter) {
    apiLimiter = new ApiRateLimiter();
  }
  return apiLimiter;
}