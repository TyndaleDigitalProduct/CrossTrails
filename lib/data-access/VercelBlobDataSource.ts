import { getBlobJSON, isBlobConfigured } from '@/lib/utils/blob';
import type { CrossReferenceDataFile } from '@/lib/types';
import type {
  CrossReferenceDataSource,
  CrossReferenceBookData,
} from '@/lib/data-access/CrossReferenceDataAccess.ts';

export const fullBookNameToAbbrev: Record<string, string> = {
  Genesis: 'Gen',
  Exodus: 'Exod',
  Leviticus: 'Lev',
  Numbers: 'Num',
  Deuteronomy: 'Deut',
  Joshua: 'Josh',
  Judges: 'Judg',
  Ruth: 'Ruth',
  '1 Samuel': '1Sam',
  '2 Samuel': '2Sam',
  '1 Kings': '1Kgs',
  '2 Kings': '2Kgs',
  '1 Chronicles': '1Chr',
  '2 Chronicles': '2Chr',
  Ezra: 'Ezra',
  Nehemiah: 'Neh',
  Esther: 'Esth',
  Job: 'Job',
  Psalms: 'Ps',
  Proverbs: 'Pr',
  Ecclesiastes: 'Eccl',
  'Song of Songs': 'Song',
  Isaiah: 'Isa',
  Jeremiah: 'Jer',
  Lamentations: 'Lam',
  Ezekiel: 'Ezek',
  Daniel: 'Dan',
  Hosea: 'Hos',
  Joel: 'Joel',
  Amos: 'Amos',
  Obadiah: 'Obad',
  Jonah: 'Jon',
  Micah: 'Mic',
  Nahum: 'Nah',
  Habakkuk: 'Hab',
  Zephaniah: 'Zeph',
  Haggai: 'Hagg',
  Zechariah: 'Zech',
  Malachi: 'Mal',
  Matthew: 'Matt',
  Mark: 'Mark',
  Luke: 'Luke',
  John: 'John',
  Acts: 'Acts',
  Romans: 'Rom',
  '1 Corinthians': '1Cor',
  '2 Corinthians': '2Cor',
  Galatians: 'Gal',
  Ephesians: 'Eph',
  Philippians: 'Phil',
  Colossians: 'Col',
  '1 Thessalonians': '1Thes',
  '2 Thessalonians': '2Thes',
  '1 Timothy': '1Tim',
  '2 Timothy': '2Tim',
  Titus: 'Titus',
  Philemon: 'Phlm',
  Hebrews: 'Heb',
  James: 'Jas',
  '1 Peter': '1Pet',
  '2 Peter': '2Pet',
  '1 John': '1Jn',
  '2 John': '2Jn',
  '3 John': '3Jn',
  Jude: 'Jude',
  Revelation: 'Rev',
};

export class VercelBlobDataSource implements CrossReferenceDataSource {
  async loadBookData(
    bookAbbrevation: string
  ): Promise<CrossReferenceDataFile | null> {
    return this.getBookData(bookAbbrevation);
  }

  async isAvailable(): Promise<boolean> {
    return isBlobConfigured();
  }

  async getVerseData(verseRef: string): Promise<CrossReferenceDataFile | null> {
    try {
      // Extract book abbreviation (e.g., "Matt" from "Matt.2.1")
      let bookAbbrev = verseRef.split('.')[0];
      bookAbbrev = fullBookNameToAbbrev[bookAbbrev] || bookAbbrev;
      const blobFilename = `${bookAbbrev}.json`;
      console.log(
        `[VercelBlobDataSource] Attempting to load blob: ${blobFilename}`
      );

      const allCrossRefsData =
        await getBlobJSON<Record<string, any[]>>(blobFilename);
      if (!allCrossRefsData) {
        console.error(
          `[VercelBlobDataSource] Blob file "${blobFilename}" could not be loaded or is empty.`
        );
        return null;
      }

      const verseData = allCrossRefsData[verseRef];
      if (!verseData || !Array.isArray(verseData)) {
        console.warn(
          `[VercelBlobDataSource] Blob "${blobFilename}" loaded, but no data found for verse "${verseRef}".`
        );
        return null;
      }

      return {
        book: bookAbbrev,
        book_number: 0,
        verified: true,
        total_items: verseData.length,
        improved_count: 0,
        category_distribution: {},
        items: verseData.map(item => ({
          anchor_ref: item.anchor_ref || verseRef,
          cross_ref: item.cross_ref || item.reference,
          primary_category: item.primary_category || 'theological_principle',
          secondary_category: item.secondary_category,
          confidence: item.confidence || item.strength * 100,
          reasoning:
            item.reasoning ||
            item.explanation ||
            'Connection identified in cross-reference data',
        })),
      };
    } catch (error) {
      console.error(
        `[VercelBlobDataSource] Error loading blob for verse "${verseRef}":`,
        error
      );
      return null;
    }
  }

  async getChapterData(
    bookAbbrev: string,
    chapter: number
  ): Promise<{ anchor_verse: string; cross_references: any[] }[]> {
    try {
      const stdBookAbbrev = fullBookNameToAbbrev[bookAbbrev] || bookAbbrev;
      const blobFilename = `${stdBookAbbrev}.json`;
      const allCrossRefsData =
        await getBlobJSON<Record<string, any[]>>(blobFilename);
      if (!allCrossRefsData) {
        console.error(
          `[VercelBlobDataSource] Blob file "${blobFilename}" could not be loaded or is empty.`
        );
        return [];
      }

      // Find all verse keys for this chapter (e.g., "Matt.2.1", "Matt.2.2", ...)
      const chapterPrefix = `${stdBookAbbrev}.${chapter}.`;
      const result: { anchor_verse: string; cross_references: any[] }[] = [];

      for (const [verseRef, data] of Object.entries(allCrossRefsData)) {
        if (verseRef.startsWith(chapterPrefix)) {
          result.push({
            anchor_verse: verseRef,
            cross_references: data.map(item => ({
              cross_ref: item.cross_ref || item.reference,
              primary_category:
                item.primary_category || 'theological_principle',
              secondary_category: item.secondary_category,
              confidence: item.confidence || item.strength * 100,
              reasoning:
                item.reasoning ||
                item.explanation ||
                'Connection identified in cross-reference data',
            })),
          });
        }
      }

      return result;
    } catch (error) {
      console.error(
        `[VercelBlobDataSource] Error loading blob for chapter "${bookAbbrev}.${chapter}":`,
        error
      );
      return [];
    }
  }

  async getBookData(
    bookAbbrevation: string
  ): Promise<CrossReferenceDataFile | null> {
    try {
      // Load book-specific data if available, or filter from main data
      const stdBookAbbrev =
        fullBookNameToAbbrev[bookAbbrevation] || bookAbbrevation;
      const bookFilename = `${stdBookAbbrev}.json`;

      // Try book-specific file first
      const bookData = await getBlobJSON<CrossReferenceDataFile>(bookFilename);
      if (bookData) {
        return bookData;
      }

      // Fallback to filtering main cross-references file
      const allCrossRefsData =
        await getBlobJSON<Record<string, any[]>>(bookFilename);
      if (!allCrossRefsData) {
        return null;
      }

      // Filter for verses that start with the book abbreviation
      const bookEntries: any[] = [];
      for (const [verseRef, data] of Object.entries(allCrossRefsData)) {
        if (verseRef.startsWith(bookAbbrevation + '.')) {
          bookEntries.push(
            ...data.map(item => ({
              ...item,
              anchor_ref: verseRef,
            }))
          );
        }
      }

      if (bookEntries.length === 0) {
        return null;
      }

      return {
        book: bookAbbrevation,
        book_number: 0,
        verified: true,
        total_items: bookEntries.length,
        improved_count: 0,
        category_distribution: {},
        items: bookEntries.map(item => ({
          anchor_ref: item.anchor_ref,
          cross_ref: item.cross_ref || item.reference,
          primary_category: item.primary_category || 'theological_principle',
          secondary_category: item.secondary_category,
          confidence: item.confidence || item.strength * 100,
          reasoning:
            item.reasoning ||
            item.explanation ||
            'Connection identified in cross-reference data',
        })),
      };
    } catch (error) {
      console.error(
        `Error loading book data from blob for ${bookAbbrevation}:`,
        error
      );
      return null;
    }
  }

  async loadBooksData(
    books: string[]
  ): Promise<Record<string, CrossReferenceBookData>> {
    // implement or stub
    throw new Error('Not implemented');
  }

  async loadAllData(): Promise<Record<string, CrossReferenceBookData>> {
    // implement or stub
    throw new Error('Not implemented');
  }
  getName(): string {
    return 'Vercel Blob Storage';
  }
}
