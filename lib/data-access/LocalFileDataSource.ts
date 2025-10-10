import { promises as fs } from 'fs'
import path from 'path'
import { CrossReferenceDataSource, CrossReferenceBookData } from './CrossReferenceDataAccess'

/**
 * Local file system data source for cross-reference data
 * Loads JSON files from the local data/crefs_json directory
 */
export class LocalFileDataSource implements CrossReferenceDataSource {
  private dataDirectory: string

  constructor(dataDirectory: string = 'data/crefs_json') {
    this.dataDirectory = dataDirectory
  }

  async loadBookData(book: string): Promise<CrossReferenceBookData | null> {
    try {
      const fileName = `${book}.json`
      const filePath = path.join(process.cwd(), this.dataDirectory, fileName)
      
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const data: CrossReferenceBookData = JSON.parse(fileContent)
      
      return data
    } catch (error) {
      if ((error as any)?.code === 'ENOENT') {
        return null // File not found
      }
      throw error
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
  async getChapterData(bookAbbrev: string, chapter: number): Promise<{ anchor_verse: string; cross_references: any[] }[]> {
    return []
  }
  async loadAllData(): Promise<Record<string, CrossReferenceBookData>> {
    try {
      const dataDir = path.join(process.cwd(), this.dataDirectory)
      const files = await fs.readdir(dataDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      
      const books = jsonFiles.map(file => file.replace('.json', ''))
      return await this.loadBooksData(books)
    } catch (error) {
      console.warn('Failed to load all local data:', error)
      return {}
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const dataDir = path.join(process.cwd(), this.dataDirectory)
      await fs.access(dataDir)
      return true
    } catch {
      return false
    }
  }
}