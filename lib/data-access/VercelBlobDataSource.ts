import { CrossReferenceDataSource, CrossReferenceBookData } from './CrossReferenceDataAccess'

/**
 * Vercel Blob storage data source for cross-reference data
 * Loads JSON data from Vercel Blob storage
 */
export class VercelBlobDataSource implements CrossReferenceDataSource {
  private blobToken: string
  private baseUrl: string
  private cache: Map<string, CrossReferenceBookData> = new Map()

  constructor(blobToken?: string, baseUrl?: string) {
    this.blobToken = blobToken || process.env.BLOB_READ_WRITE_TOKEN || ''
    this.baseUrl = baseUrl || process.env.VERCEL_BLOB_BASE_URL || ''
  }

  async loadBookData(book: string): Promise<CrossReferenceBookData | null> {
    // Check cache first
    if (this.cache.has(book)) {
      return this.cache.get(book)!
    }

    try {
      const url = `${this.baseUrl}/crefs/${book}.json`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.blobToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // Book not found
        }
        throw new Error(`Failed to fetch ${book}: ${response.status} ${response.statusText}`)
      }

      const data: CrossReferenceBookData = await response.json()
      
      // Cache the result
      this.cache.set(book, data)
      
      return data
    } catch (error) {
      console.warn(`Failed to load book ${book} from Vercel Blob:`, error)
      return null
    }
  }

  async loadBooksData(books: string[]): Promise<Record<string, CrossReferenceBookData>> {
    const results: Record<string, CrossReferenceBookData> = {}
    
    await Promise.all(
      books.map(async (book) => {
        const data = await this.loadBookData(book)
        if (data) {
          results[book] = data
        }
      })
    )
    
    return results
  }

  async loadAllData(): Promise<Record<string, CrossReferenceBookData>> {
    // For Vercel Blob, we'd need a manifest file or list endpoint
    // This is a simplified implementation that loads common books
    const commonBooks = [
      'Matt', 'Mark', 'Luke', 'John', 'Acts',
      'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col',
      '1Thes', '2Thes', '1Tim', '2Tim', 'Titus', 'Phlm',
      'Heb', 'Jas', '1Pet', '2Pet', '1Jn', '2Jn', '3Jn', 'Jude', 'Rev'
    ]
    
    return await this.loadBooksData(commonBooks)
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.blobToken && this.baseUrl)
  }

  clearCache(): void {
    this.cache.clear()
  }
}