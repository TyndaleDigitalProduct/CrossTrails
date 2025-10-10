import { CrossReferenceDataSource, CrossReferenceBookData } from './CrossReferenceDataAccess'

/**
 * Mock data source for cross-reference data
 * Provides hardcoded test data for development and testing
 */
export class MockDataSource implements CrossReferenceDataSource {
  private mockData: Record<string, CrossReferenceBookData>

  constructor() {
    this.mockData = {
      'Matthew': {
        book: 'Matthew',
        book_number: 40,
        verified: true,
        total_items: 4,
        improved_count: 4,
        category_distribution: {
          'historical_reference': 2,
          'parallel_instruction': 1,
          'quotation': 1
        },
        items: [
          {
            anchor_ref: 'Matthew.2.1',
            cross_ref: 'Luke.1.5',
            primary_category: 'historical_reference',
            secondary_category: 'chronology',
            confidence: 85,
            reasoning: 'Both passages reference the reign of King Herod as historical context'
          },
          {
            anchor_ref: 'Matthew.2.1',
            cross_ref: 'Luke.2.4-7',
            primary_category: 'parallel_instruction',
            secondary_category: 'location',
            confidence: 92,
            reasoning: 'Both passages describe Jesus being born in Bethlehem'
          },
          {
            anchor_ref: 'Matthew.2.2',
            cross_ref: 'Num.24.17',
            primary_category: 'fulfillment',
            secondary_category: 'messianic',
            confidence: 88,
            reasoning: 'Prophecy of a star rising from Jacob, fulfilled in the star that led the wise men'
          },
          {
            anchor_ref: 'Matthew.2.2',
            cross_ref: 'Jer.23.5',
            primary_category: 'fulfillment',
            secondary_category: 'messianic',
            confidence: 82,
            reasoning: 'Prophecy of the coming king that the wise men came to worship'
          },
          {
            anchor_ref: 'Matthew.2.2',
            cross_ref: 'Rev.22.16',
            primary_category: 'theological_principle',
            secondary_category: 'identity',
            confidence: 78,
            reasoning: 'Jesus identifies himself as the bright morning star'
          },
          {
            anchor_ref: 'Matthew.2.5',
            cross_ref: 'John.7.42',
            primary_category: 'parallel_instruction',
            secondary_category: 'messianic',
            confidence: 90,
            reasoning: 'Both passages reference the prophecy that the Messiah would be born in Bethlehem'
          },
          {
            anchor_ref: 'Matthew.2.6',
            cross_ref: 'Mic.5.2',
            primary_category: 'quotation',
            secondary_category: undefined,
            confidence: 98,
            reasoning: 'Matthew 2:6 is a direct quotation from Micah 5:2'
          }
        ]
      }
    }
  }

  async loadBookData(book: string): Promise<CrossReferenceBookData | null> {
    return this.mockData[book] || null
  }

  async loadBooksData(books: string[]): Promise<Record<string, CrossReferenceBookData>> {
    const results: Record<string, CrossReferenceBookData> = {}
    
    for (const book of books) {
      const data = await this.loadBookData(book)
      if (data) {
        results[book] = data
      }
    }
    
    return results
  }

  async loadAllData(): Promise<Record<string, CrossReferenceBookData>> {
    return { ...this.mockData }
  }
  async getChapterData(bookAbbrev: string, chapter: number): Promise<{ anchor_verse: string; cross_references: any[] }[]> {
    return []
  }
  async isAvailable(): Promise<boolean> {
    return true // Mock data is always available
  }
}