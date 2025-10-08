/**
 * Rate Limiting Service for CrossTrails API
 * Implements sliding window rate limiting with different tiers
 */

interface RateLimitEntry {
  requests: number[]  // Array of timestamps
  windowStart: number
}

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

class RateLimitService {
  private static instance: RateLimitService
  private limiters = new Map<string, Map<string, RateLimitEntry>>()
  
  // Rate limit configurations for different endpoint types
  private readonly RATE_LIMITS: Record<string, RateLimitConfig> = {
    // Analysis endpoints (more expensive)
    analysis: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 10,      // 10 requests per minute
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    streaming: {
      windowMs: 60 * 1000,  // 1 minute  
      maxRequests: 5,       // 5 concurrent streams per minute
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    
    // Prompt generation (medium cost)
    prompt: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 30,      // 30 requests per minute
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },
    
    // Health checks and config (low cost)
    health: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 100,     // 100 requests per minute
      skipSuccessfulRequests: true,
      skipFailedRequests: false
    },
    config: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 60,      // 60 requests per minute  
      skipSuccessfulRequests: true,
      skipFailedRequests: false
    },
    
    // Global fallback
    default: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 50,      // 50 requests per minute
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  }
  
  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService()
    }
    return RateLimitService.instance
  }
  
  /**
   * Check rate limit for a given identifier and endpoint type
   */
  checkLimit(
    identifier: string, 
    endpointType: string,
    success?: boolean
  ): RateLimitResult {
    const config = this.RATE_LIMITS[endpointType] || this.RATE_LIMITS.default
    
    // Skip counting if configured
    if ((success === true && config.skipSuccessfulRequests) ||
        (success === false && config.skipFailedRequests)) {
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      }
    }
    
    const key = `${endpointType}:${identifier}`
    
    if (!this.limiters.has(endpointType)) {
      this.limiters.set(endpointType, new Map())
    }
    
    const limiter = this.limiters.get(endpointType)!
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Get or create entry for this identifier
    let entry = limiter.get(identifier)
    if (!entry) {
      entry = { requests: [], windowStart: now }
      limiter.set(identifier, entry)
    }
    
    // Remove old requests outside the window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit is exceeded
    const currentCount = entry.requests.length
    
    if (currentCount >= config.maxRequests) {
      const oldestRequest = Math.min(...entry.requests)
      const resetTime = oldestRequest + config.windowMs
      const retryAfter = Math.ceil((resetTime - now) / 1000)
      
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter
      }
    }
    
    // Add current request
    entry.requests.push(now)
    
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.requests.length,
      resetTime: now + config.windowMs
    }
  }
  
  /**
   * Get rate limit headers for response
   */
  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    }
    
    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString()
    }
    
    return headers
  }
  
  /**
   * Clear rate limits for an identifier
   */
  clearLimits(identifier: string): void {
    for (const limiter of this.limiters.values()) {
      limiter.delete(identifier)
    }
  }
  
  /**
   * Get rate limit statistics
   */
  getStats(): { [endpointType: string]: { active_users: number; total_requests: number } } {
    const stats: { [key: string]: { active_users: number; total_requests: number } } = {}
    
    for (const [endpointType, limiter] of this.limiters.entries()) {
      const activeUsers = limiter.size
      const totalRequests = Array.from(limiter.values()).reduce(
        (sum, entry) => sum + entry.requests.length, 
        0
      )
      
      stats[endpointType] = { active_users: activeUsers, total_requests: totalRequests }
    }
    
    return stats
  }
  
  /**
   * Cleanup old entries periodically
   */
  cleanup(): void {
    const now = Date.now()
    
    for (const [endpointType, limiter] of this.limiters.entries()) {
      const config = this.RATE_LIMITS[endpointType] || this.RATE_LIMITS.default
      const windowStart = now - config.windowMs
      
      for (const [identifier, entry] of limiter.entries()) {
        // Remove old requests
        entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)
        
        // Remove empty entries
        if (entry.requests.length === 0) {
          limiter.delete(identifier)
        }
      }
    }
  }
}

/**
 * Middleware function to apply rate limiting to API routes
 */
export function withRateLimit(
  endpointType: string,
  getIdentifier: (request: Request) => string = (req) => getClientIP(req)
) {
  return function <T extends any[]>(
    handler: (...args: T) => Promise<Response>
  ) {
    return async (...args: T): Promise<Response> => {
      const request = args[0] as Request
      const rateLimiter = RateLimitService.getInstance()
      
      const identifier = getIdentifier(request)
      const result = rateLimiter.checkLimit(identifier, endpointType)
      
      if (!result.allowed) {
        const headers = rateLimiter.getRateLimitHeaders(result)
        
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Rate limit exceeded',
              details: {
                limit: result.limit,
                retryAfter: result.retryAfter
              }
            }
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            }
          }
        )
      }
      
      // Execute the handler
      const response = await handler(...args)
      
      // Add rate limit headers to successful responses
      const rateLimitHeaders = rateLimiter.getRateLimitHeaders(result)
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value)
      }
      
      return response
    }
  }
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: Request): string {
  // Try various headers for IP address
  const headers = [
    'x-forwarded-for',
    'x-real-ip', 
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'true-client-ip'
  ]
  
  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // Take the first IP if there are multiple
      return value.split(',')[0].trim()
    }
  }
  
  // Fallback to a default identifier
  return 'unknown'
}

export { RateLimitService }
export default RateLimitService.getInstance()