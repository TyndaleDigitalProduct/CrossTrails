/**
 * Data Access Layer for Cross-Reference Data
 * 
 * This layer abstracts the source of cross-reference data, allowing the application
 * to work with different data sources (local files, Vercel Blob, APIs, etc.) 
 * without changing the business logic.
 */

export interface CrossReferenceItem {
  anchor_ref: string
  cross_ref: string
  primary_category: string
  secondary_category?: string | null
  confidence: number
  reasoning: string
}

export interface CrossReferenceBookData {
  book: string
  book_number: number
  verified: boolean
  total_items: number
  improved_count: number
  category_distribution: Record<string, number>
  items: CrossReferenceItem[]
}

/**
 * Processed cross-reference data structure used by the MCP tools
 */
export interface ProcessedCrossReference {
  bref: string
  label: string
  categories: string[]
  strength: number
  connection_type: string
  explanation_seed: string
}

export interface ProcessedVerseData {
  refs: string
  cross_references: ProcessedCrossReference[]
}

/**
 * Abstract data source interface
 */
export interface CrossReferenceDataSource {
  /**
   * Load cross-reference data for a specific book
   */
  loadBookData(book: string): Promise<CrossReferenceBookData | null>
  
  /**
   * Load cross-reference data for multiple books
   */
  loadBooksData(books: string[]): Promise<Record<string, CrossReferenceBookData>>
  
  /**
   * Load all available cross-reference data
   */
  loadAllData(): Promise<Record<string, CrossReferenceBookData>>
  
  /**
   * Check if data source is available/configured
   */
  isAvailable(): Promise<boolean>
}

/**
 * Cross-Reference Data Access Layer
 * Manages different data sources and provides a unified interface
 */
export class CrossReferenceDataAccess {
  private dataSources: CrossReferenceDataSource[]
  private cache: Map<string, ProcessedVerseData> = new Map()
  private cacheExpiry: number = 5 * 60 * 1000 // 5 minutes

  constructor(dataSources: CrossReferenceDataSource[]) {
    this.dataSources = dataSources
  }

  /**
   * Get cross-reference data for a specific verse
   * Tries each data source in order until one succeeds
   */
  async getVerseData(verseRef: string): Promise<ProcessedVerseData | null> {
    // Check cache first
    const cacheKey = `verse:${verseRef}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const book = this.extractBookFromReference(verseRef)
    
    for (const source of this.dataSources) {
      try {
        if (!(await source.isAvailable())) continue
        
        const bookData = await source.loadBookData(book)
        if (!bookData) continue
        
        const verseData = this.processBookDataForVerse(bookData, verseRef)
        if (verseData) {
          // Cache the result
          this.cache.set(cacheKey, verseData)
          setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry)
          return verseData
        }
      } catch (error) {
        console.warn(`Data source failed for ${verseRef}:`, error)
        continue // Try next source
      }
    }

    return null
  }

  /**
   * Get cross-reference data for multiple verses
   */
  async getMultipleVerseData(verseRefs: string[]): Promise<Record<string, ProcessedVerseData>> {
    const results: Record<string, ProcessedVerseData> = {}
    
    // Group by book to minimize data source calls
    const bookGroups = this.groupReferencesByBook(verseRefs)
    
    for (const [book, refs] of Object.entries(bookGroups)) {
      for (const source of this.dataSources) {
        try {
          if (!(await source.isAvailable())) continue
          
          const bookData = await source.loadBookData(book)
          if (!bookData) continue
          
          for (const ref of refs) {
            const verseData = this.processBookDataForVerse(bookData, ref)
            if (verseData) {
              results[ref] = verseData
            }
          }
          break // Successfully got data from this source
        } catch (error) {
          console.warn(`Data source failed for book ${book}:`, error)
          continue
        }
      }
    }
    
    return results
  }

  /**
   * Process raw book data to extract cross-references for a specific verse
   */
  private processBookDataForVerse(bookData: CrossReferenceBookData, verseRef: string): ProcessedVerseData | null {
    const normalizedRef = this.normalizeReference(verseRef)
    const items = bookData.items.filter(item => 
      this.normalizeReference(item.anchor_ref) === normalizedRef
    )
    
    if (items.length === 0) return null
    
    const crossReferences: ProcessedCrossReference[] = items.map(item => ({
      bref: item.cross_ref,
      label: this.formatReferenceLabel(item.cross_ref),
      categories: [item.primary_category, item.secondary_category].filter(Boolean) as string[],
      strength: item.confidence / 100, // Convert 0-100 to 0-1
      connection_type: this.mapCategoryToConnectionType(item.primary_category),
      explanation_seed: item.reasoning
    }))
    
    return {
      refs: normalizedRef,
      cross_references: crossReferences
    }
  }

  /**
   * Extract book name from a verse reference
   */
  private extractBookFromReference(ref: string): string {
    const parts = ref.split('.')
    return parts[0]
  }

  /**
   * Group references by book for efficient loading
   */
  private groupReferencesByBook(refs: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {}
    
    for (const ref of refs) {
      const book = this.extractBookFromReference(ref)
      if (!groups[book]) groups[book] = []
      groups[book].push(ref)
    }
    
    return groups
  }

  /**
   * Normalize reference format for consistent matching
   */
  private normalizeReference(ref: string): string {
    return ref
      .replace(/\s+/g, '.')  // Replace spaces with dots
      .replace(/:/g, '.')    // Replace colons with dots
      .replace(/\.+/g, '.')  // Remove duplicate dots
  }

  /**
   * Format reference for display
   */
  private formatReferenceLabel(ref: string): string {
    // Convert "1Cor.1.1" to "1 Cor 1:1"
    return ref
      .replace(/^(\d*)([A-Za-z]+)\./, '$1 $2 ')
      .replace(/\.(\d+)$/, ':$1')
  }

  /**
   * Map category from JSON data to connection type expected by MCP tools
   */
  private mapCategoryToConnectionType(category: string): string {
    const mappings: Record<string, string> = {
      'literary_parallel': 'parallel',
      'theological_principle': 'thematic',
      'elaboration': 'elaboration',
      'historical_reference': 'historical',
      'parallel_instruction': 'parallel',
      'allusion': 'allusion',
      'contrast': 'contrast',
      'christological_parallel': 'parallel',
      'quotation': 'quotation',
      'fulfillment': 'fulfillment'
    }
    
    return mappings[category] || 'thematic'
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}