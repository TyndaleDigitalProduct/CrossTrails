import { getBlobJSON, isBlobConfigured } from '@/lib/utils/blob'
import type { DataSource, CrossReferenceDataFile } from '@/lib/types'

export class VercelBlobDataSource implements DataSource {
  private baseFilename: string

  async loadBookData(bookAbbrevation: string): Promise<CrossReferenceDataFile | null> {
    return this.getBookData(bookAbbrevation)
  }

  async isAvailable(): Promise<boolean> {
    return isBlobConfigured()
  }

async getVerseData(verseRef: string): Promise<CrossReferenceDataFile | null> {
  try {
    // Extract book abbreviation (e.g., "Matt" from "Matt.2.1")
    const bookAbbrev = verseRef.split('.')[0]
    const blobFilename = `${bookAbbrev}.json`
    console.log(`[VercelBlobDataSource] Attempting to load blob: ${blobFilename}`)

    const allCrossRefsData = await getBlobJSON<Record<string, any[]>>(blobFilename)
    if (!allCrossRefsData) {
      console.error(`[VercelBlobDataSource] Blob file "${blobFilename}" could not be loaded or is empty.`)
      return null
    }

    const verseData = allCrossRefsData[verseRef]
    if (!verseData || !Array.isArray(verseData)) {
      console.warn(`[VercelBlobDataSource] Blob "${blobFilename}" loaded, but no data found for verse "${verseRef}".`)
      return null
    }

    return {
      items: verseData.map(item => ({
        anchor_ref: item.anchor_ref || verseRef,
        cross_ref: item.cross_ref || item.reference,
        primary_category: item.primary_category || 'theological_principle',
        secondary_category: item.secondary_category,
        confidence: item.confidence || item.strength * 100,
        reasoning: item.reasoning || item.explanation || 'Connection identified in cross-reference data'
      }))
    }
  } catch (error) {
    console.error(`[VercelBlobDataSource] Error loading blob for verse "${verseRef}":`, error)
    return null
  }
}

  async getBookData(bookAbbrevation: string): Promise<CrossReferenceDataFile | null> {
    try {
      // Load book-specific data if available, or filter from main data
      const bookFilename = `${bookAbbrevation}.json`
      
      try {
        // Try book-specific file first
        const bookData = await getBlobJSON<CrossReferenceDataFile>(bookFilename)
        return bookData
      } catch {
        // Fallback to filtering main cross-references file
        const allCrossRefsData = await getBlobJSON<Record<string, any[]>>(this.baseFilename)
        
        // Filter for verses that start with the book abbreviation
        const bookEntries: any[] = []
        for (const [verseRef, data] of Object.entries(allCrossRefsData)) {
          if (verseRef.startsWith(bookAbbrevation + '.')) {
            bookEntries.push(...data.map(item => ({
              ...item,
              anchor_ref: verseRef
            })))
          }
        }

        if (bookEntries.length === 0) {
          return null
        }

        return {
          items: bookEntries.map(item => ({
            anchor_ref: item.anchor_ref,
            cross_ref: item.cross_ref || item.reference,
            primary_category: item.primary_category || 'theological_principle',
            secondary_category: item.secondary_category,
            confidence: item.confidence || item.strength * 100,
            reasoning: item.reasoning || item.explanation || 'Connection identified in cross-reference data'
          }))
        }
      }
    } catch (error) {
      console.error(`Error loading book data from blob for ${bookAbbrevation}:`, error)
      return null
    }
  }

  getName(): string {
    return 'Vercel Blob Storage'
  }
}