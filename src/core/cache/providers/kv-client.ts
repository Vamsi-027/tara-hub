import { kv as vercelKV } from '@vercel/kv'

// Wrapper for KV operations with retry logic and timeout handling
class KVClient {
  private maxRetries = 2
  private timeout = 5000 // 5 seconds instead of 10
  private retryDelay = 1000 // 1 second between retries
  
  // Check if KV is configured
  isAvailable(): boolean {
    return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  }

  // Wrapper for KV operations with timeout and retry
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    if (!this.isAvailable()) {
      return null
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('KV operation timeout')), this.timeout)
        })

        // Race between operation and timeout
        const result = await Promise.race([
          operation(),
          timeoutPromise
        ])

        return result as T
      } catch (error: any) {
        const isLastAttempt = attempt === this.maxRetries
        const isTimeout = error.message === 'KV operation timeout' || 
                         error.code === 'UND_ERR_CONNECT_TIMEOUT'
        
        if (isTimeout) {
          console.log(`KV ${operationName} timeout (attempt ${attempt + 1}/${this.maxRetries + 1})`)
        } else {
          console.error(`KV ${operationName} error:`, error.message)
        }

        if (!isLastAttempt && isTimeout) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
          continue
        }

        // On final failure, return null to trigger fallback
        return null
      }
    }

    return null
  }

  // KV operations with automatic fallback
  async get<T>(key: string): Promise<T | null> {
    return this.withRetry(() => vercelKV.get<T>(key), `get(${key})`)
  }

  async set<T>(key: string, value: T, options?: any): Promise<boolean> {
    const result = await this.withRetry(
      () => vercelKV.set(key, value, options),
      `set(${key})`
    )
    return result !== null
  }

  async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    return this.withRetry(() => vercelKV.hgetall<T>(key), `hgetall(${key})`)
  }

  async hset<T extends Record<string, unknown>>(
    key: string,
    value: T
  ): Promise<boolean> {
    const result = await this.withRetry(
      () => vercelKV.hset(key, value),
      `hset(${key})`
    )
    return result !== null
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: any
  ): Promise<string[]> {
    const result = await this.withRetry(
      () => vercelKV.zrange(key, start, stop, options),
      `zrange(${key})`
    )
    return result || []
  }

  async zadd(
    key: string,
    score: number,
    member: string
  ): Promise<boolean> {
    const result = await this.withRetry(
      () => vercelKV.zadd(key, { score, member }),
      `zadd(${key})`
    )
    return result !== null
  }

  async zrem(key: string, member: string): Promise<boolean> {
    const result = await this.withRetry(
      () => vercelKV.zrem(key, member),
      `zrem(${key})`
    )
    return result !== null
  }

  async del(key: string): Promise<boolean> {
    const result = await this.withRetry(
      () => vercelKV.del(key),
      `del(${key})`
    )
    return result !== null
  }

  async smembers(key: string): Promise<string[]> {
    const result = await this.withRetry(
      () => vercelKV.smembers(key),
      `smembers(${key})`
    )
    return result || []
  }

  // Pipeline operations
  pipeline() {
    return vercelKV.pipeline()
  }
}

// Export singleton instance
export const kvClient = new KVClient()

// Export the check function for backward compatibility
export const isKVAvailable = () => kvClient.isAvailable()