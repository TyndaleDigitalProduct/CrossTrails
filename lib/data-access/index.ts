import { CrossReferenceDataAccess } from './CrossReferenceDataAccess'
import { VercelBlobDataSource } from './VercelBlobDataSource'
import { MockDataSource } from './MockDataSource'
import { isBlobConfigured } from '@/lib/utils/blob'

// Global instance for singleton pattern
let globalCrossReferenceDataAccess: CrossReferenceDataAccess | null = null

/**
 * Factory class for creating CrossReferenceDataAccess instances
 * with appropriate data sources based on environment
 */
export class CrossReferenceDataAccessFactory {
  /**
   * Create data access instance for production environment
   * Priority: Vercel Blob → Mock Data
   */
  static createForProduction(): CrossReferenceDataAccess {
    const sources = []
    
    // First priority: Vercel Blob (if configured)
    if (isBlobConfigured()) {
      sources.push(new VercelBlobDataSource())
    }
    
    // Fallback: Mock data
    sources.push(new MockDataSource())
    
    return new CrossReferenceDataAccess(sources)
  }

  /**
   * Create data access instance for development environment  
   * Priority: Vercel Blob → Local Files → Mock Data
   */
  static createForDevelopment(): CrossReferenceDataAccess {
    const sources = []
    
    // First priority: Vercel Blob (if configured)
    if (isBlobConfigured()) {
      sources.push(new VercelBlobDataSource())
    }
    
    // Only require LocalFileDataSource in dev
    if (process.env.NODE_ENV === 'development') {
      // Use require to avoid static import in prod build
      const { LocalFileDataSource } = require('./LocalFileDataSource')
      sources.push(new LocalFileDataSource('data/crefs_json'))
    }
    
    // Fallback: Mock data
    sources.push(new MockDataSource())
    
    return new CrossReferenceDataAccess(sources)
  }

  /**
   * Create data access instance for testing environment
   * Uses only mock data for consistent test results
   */
  static createForTesting(): CrossReferenceDataAccess {
    return new CrossReferenceDataAccess([new MockDataSource()])
  }

  /**
   * Auto-configure based on environment
   */
  static createAuto(): CrossReferenceDataAccess {
    const isProduction = process.env.NODE_ENV === 'production'
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isTesting = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID
    
    if (isTesting) {
      return this.createForTesting()
    } else if (isProduction) {
      return this.createForProduction()
    } else if (isDevelopment) {
      return this.createForDevelopment()
    } else {
      // Default fallback
      return this.createForDevelopment()
    }
  }
}

/**
 * Get a singleton instance of CrossReferenceDataAccess
 * Automatically configures based on environment
 */
export function getCrossReferenceDataAccess(): CrossReferenceDataAccess {
  if (!globalCrossReferenceDataAccess) {
    globalCrossReferenceDataAccess = CrossReferenceDataAccessFactory.createAuto()
  }
  return globalCrossReferenceDataAccess
}

/**
 * Reset the global instance (useful for testing or configuration changes)
 */
export function resetGlobalDataAccess(): void {
  globalCrossReferenceDataAccess = null
}

// Export all the classes and types
export { CrossReferenceDataAccess } from './CrossReferenceDataAccess'
export { LocalFileDataSource } from './LocalFileDataSource'
export { VercelBlobDataSource } from './VercelBlobDataSource'
export { MockDataSource } from './MockDataSource'