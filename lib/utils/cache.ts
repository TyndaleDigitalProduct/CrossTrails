/**
 * Caching Service for CrossTrails API
 * Implements multiple caching layers for optimal performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
}

interface CacheStats {
  hits: number
  misses: number
  total_requests: number
  hit_rate: number
  cache_size: number
}

export class CacheService {
  private static instance: CacheService
  private cache = new Map<string, CacheEntry<any>>()
  private stats = { hits: 0, misses: 0, total_requests: 0 }
  
  // Cache TTL configurations (in milliseconds)
  private readonly TTL_CONFIG = {
    verse_context: 30 * 60 * 1000,    // 30 minutes (verses don't change)
    cross_reference: 60 * 60 * 1000,  // 1 hour (cross-ref data is stable)
    llm_analysis: 24 * 60 * 60 * 1000, // 24 hours (analysis can be cached longer)
    prompt_generation: 60 * 60 * 1000, // 1 hour (prompts are deterministic)
    health_check: 5 * 60 * 1000,      // 5 minutes (health status changes)
    provider_config: 30 * 60 * 1000   // 30 minutes (config is mostly static)
  }
  
  private readonly MAX_CACHE_SIZE = 1000 // Maximum number of cached entries
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }
  
  /**
   * Generate a cache key from request parameters
   */
  generateKey(type: keyof typeof this.TTL_CONFIG, params: any): string {
    // Create a deterministic key from the parameters
    const paramStr = JSON.stringify(params, Object.keys(params).sort())
    const hash = this.simpleHash(paramStr)
    return `${type}:${hash}`
  }
  
  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    this.stats.total_requests++
    
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }
    
    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }
    
    // Update hit count and return data
    entry.hits++
    this.stats.hits++
    return entry.data
  }
  
  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, type: keyof typeof this.TTL_CONFIG): void {
    // Enforce cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest()
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: this.TTL_CONFIG[type],
      hits: 0
    }
    
    this.cache.set(key, entry)
  }
  
  /**
   * Cache with automatic key generation and retrieval
   */
  async getOrSet<T>(
    type: keyof typeof this.TTL_CONFIG,
    params: any,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const key = this.generateKey(type, params)
    
    // Try to get from cache first
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    // Fetch new data and cache it
    const data = await fetcher()
    this.set(key, data, type)
    return data
  }
  
  /**
   * Clear specific cache entries by pattern
   */
  clearByPattern(pattern: RegExp): number {
    let cleared = 0
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        cleared++
      }
    }
    return cleared
  }
  
  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, total_requests: 0 }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      total_requests: this.stats.total_requests,
      hit_rate: this.stats.total_requests > 0 ? this.stats.hits / this.stats.total_requests : 0,
      cache_size: this.cache.size
    }
  }
  
  /**
   * Get detailed cache information
   */
  getCacheInfo(): Array<{ key: string; size: number; hits: number; age_ms: number; ttl_remaining_ms: number }> {
    const now = Date.now()
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      hits: entry.hits,
      age_ms: now - entry.timestamp,
      ttl_remaining_ms: Math.max(0, entry.timestamp + entry.ttl - now)
    }))
  }
  
  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
  
  /**
   * Simple hash function for generating cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

export default CacheService.getInstance()