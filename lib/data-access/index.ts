import { CrossReferenceDataAccess, type CrossReferenceDataSource } from './CrossReferenceDataAccess'
import { LocalFileDataSource } from './LocalFileDataSource'
import { VercelBlobDataSource } from './VercelBlobDataSource'
import { MockDataSource } from './MockDataSource'

export { CrossReferenceDataAccess, type CrossReferenceDataSource }
export { LocalFileDataSource }
export { VercelBlobDataSource }
export { MockDataSource }

/**
 * Configuration for cross-reference data access
 */
export interface DataAccessConfig {
  // Data source priority (will try in order)
  enableLocalFiles?: boolean
  enableVercelBlob?: boolean
  enableMockData?: boolean
  
  // Paths and settings
  localDataPath?: string
  vercelBlobToken?: string
  vercelBlobBaseUrl?: string
  
  // Cache settings
  cacheEnabled?: boolean
  cacheExpiryMs?: number
}

/**
 * Factory for creating configured data access layer
 */
export class CrossReferenceDataAccessFactory {
  /**
   * Create a data access layer with automatic configuration
   * Will detect available data sources and configure them appropriately
   */
  static createDefault(): CrossReferenceDataAccess {
    const config: DataAccessConfig = {
      enableLocalFiles: true,
      enableVercelBlob: true,
      enableMockData: true, // Always enable as fallback
      localDataPath: 'data/crefs_json'
    }
    
    return this.create(config)
  }

  /**
   * Create a data access layer for production
   * Prioritizes Vercel Blob, falls back to mock data
   */
  static createProduction(): CrossReferenceDataAccess {
    const config: DataAccessConfig = {
      enableLocalFiles: false, // Not available in production
      enableVercelBlob: true,
      enableMockData: true, // Fallback for missing data
    }
    
    return this.create(config)
  }

  /**
   * Create a data access layer for development
   * Prioritizes local files for easier development
   */
  static createDevelopment(): CrossReferenceDataAccess {
    const config: DataAccessConfig = {
      enableLocalFiles: true,
      enableVercelBlob: false, // Might not be configured in dev
      enableMockData: true,
      localDataPath: 'data/crefs_json'
    }
    
    return this.create(config)
  }

  /**
   * Create a data access layer for testing
   * Uses only mock data for predictable test results
   */
  static createTesting(): CrossReferenceDataAccess {
    const config: DataAccessConfig = {
      enableLocalFiles: false,
      enableVercelBlob: false,
      enableMockData: true,
    }
    
    return this.create(config)
  }

  /**
   * Create a data access layer with custom configuration
   */
  static create(config: DataAccessConfig): CrossReferenceDataAccess {
    const dataSources: CrossReferenceDataSource[] = []

    // Add data sources in priority order
    
    // 1. Local files (highest priority in development)
    if (config.enableLocalFiles) {
      dataSources.push(new LocalFileDataSource(config.localDataPath))
    }

    // 2. Vercel Blob (highest priority in production)
    if (config.enableVercelBlob) {
      dataSources.push(new VercelBlobDataSource(
        config.vercelBlobToken,
        config.vercelBlobBaseUrl
      ))
    }

    // 3. Mock data (lowest priority, but always reliable)
    if (config.enableMockData) {
      dataSources.push(new MockDataSource())
    }

    if (dataSources.length === 0) {
      throw new Error('No data sources configured for CrossReferenceDataAccess')
    }

    return new CrossReferenceDataAccess(dataSources)
  }
}

/**
 * Global instance for the application
 * Uses environment-based configuration
 */
let globalInstance: CrossReferenceDataAccess | null = null

export function getCrossReferenceDataAccess(): CrossReferenceDataAccess {
  if (!globalInstance) {
    // Auto-detect environment and create appropriate configuration
    if (process.env.NODE_ENV === 'test') {
      globalInstance = CrossReferenceDataAccessFactory.createTesting()
    } else if (process.env.NODE_ENV === 'production') {
      globalInstance = CrossReferenceDataAccessFactory.createProduction()
    } else {
      globalInstance = CrossReferenceDataAccessFactory.createDevelopment()
    }
  }
  
  return globalInstance
}

/**
 * Reset the global instance (useful for testing)
 */
export function resetCrossReferenceDataAccess(): void {
  globalInstance = null
}