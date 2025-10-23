import {
  CrossReferenceConnectionRequest,
  CrossReferenceConnectionArrayResponse,
  CrossReferenceCategory,
} from '@/lib/types';
import { CrossReferenceDataAccess } from '@/lib/data-access/CrossReferenceDataAccess';
import { VercelBlobDataSource } from '@/lib/data-access/VercelBlobDataSource';
import { MockDataSource } from '@/lib/data-access/MockDataSource';

/**
 * Create a data access instance with appropriate sources
 */
async function createDataAccess(): Promise<CrossReferenceDataAccess> {
  const blobSource = new VercelBlobDataSource();
  // const localSource = new LocalFileDataSource('data/crefs_json')
  const mockSource = new MockDataSource();
  return new CrossReferenceDataAccess([blobSource, mockSource]);
}

/**
 * MCP Tool: Get Cross-Reference Connection
 * Analyzes relationships between verses using cross-reference data
 */
export async function getCrossReferenceConnection(
  request: CrossReferenceConnectionRequest
): Promise<CrossReferenceConnectionArrayResponse[]> {
  const { anchor_ref, candidate_refs, min_strength = 0.5 } = request;

  try {
    const dataAccess = await createDataAccess();

    // Determine if anchor_ref is chapter or verse format
    const refParts = anchor_ref.split('.');
    const isChapter = refParts.length === 2;
    const isVerse = refParts.length === 3;

    if (!isChapter && !isVerse) {
      throw new Error(
        'Invalid anchor_ref format. Expected "Book.Chapter" or "Book.Chapter.Verse"'
      );
    }

    // Fetch data based on format
    let anchorDataArray: any[] = [];
    if (isChapter) {
      const bookAbbrev = refParts[0];
      const chapter = parseInt(refParts[1]);
      const chapterData = await dataAccess.getChapterData(bookAbbrev, chapter);
      anchorDataArray = chapterData;
    } else if (isVerse) {
      const verseData = await dataAccess.getVerseData(anchor_ref);
      anchorDataArray = verseData ? [verseData] : [];
    }

    if (anchorDataArray.length === 0) {
      return [];
    }

    const connectionsByAnchor = new Map<string, any[]>();

    // Process each anchor data object
    for (const anchorData of anchorDataArray) {
      // Get cross_references - chapter data has it directly, verse data needs conversion
      const crossRefs = Array.isArray(anchorData)
        ? anchorData
        : anchorData.cross_references || [];

      // If no candidate_refs provided, use all cross-references from the anchor data
      const refsToProcess =
        candidate_refs.length > 0
          ? candidate_refs
          : crossRefs.map((ref: any) => ref.bref || ref.cross_ref);

      for (const candidateRef of refsToProcess) {
        // Find the connection data for this reference
        let connection = crossRefs.find(
          (ref: any) =>
            normalizeReference(ref.bref || ref.cross_ref) ===
            normalizeReference(candidateRef)
        );

        // If we're using all refs from anchor data, the connection IS the ref itself
        if (!connection && candidate_refs.length === 0) {
          connection = crossRefs.find(
            (ref: any) => (ref.bref || ref.cross_ref) === candidateRef
          );
        }

        if (connection) {
          const strength =
            connection.strength !== undefined
              ? connection.strength
              : (connection.confidence || 0) / 100;
          if (strength >= min_strength) {
            const anchorVerse = anchorData.anchor_verse || anchor_ref;
            if (!connectionsByAnchor.has(anchorVerse)) {
              connectionsByAnchor.set(anchorVerse, []);
            }
            connectionsByAnchor.get(anchorVerse)!.push({
              reference:
                connection.bref || connection.cross_ref || candidateRef,
              strength: strength,
              categories:
                connection.categories ||
                [connection.primary_category].filter(Boolean),
              type: (connection.connection_type ||
                connection.primary_category) as CrossReferenceCategory,
              explanation:
                connection.explanation_seed || connection.reasoning || '',
              anchor_verse: anchorVerse,
              metadata: {
                thematic_overlap: calculateThematicOverlap(
                  anchor_ref,
                  candidateRef
                ),
                historical_context: hasHistoricalContext(
                  connection.categories || [connection.primary_category]
                ),
                literary_connection: hasLiteraryConnection(
                  connection.connection_type || connection.primary_category
                ),
              },
            });
          }
        }
      }
    }

    // Sort each anchor's connections by strength (highest first)
    for (const conns of connectionsByAnchor.values()) {
      conns.sort((a, b) => b.strength - a.strength);
    }

    // For chapter queries, return as array of arrays (one per anchor verse)
    // For single verse queries, return as single array wrapped in an array
    if (isChapter) {
      return Array.from(connectionsByAnchor.values());
    } else {
      // Single verse - return array of connections wrapped so it matches chapter format
      const singleVerseConnections = connectionsByAnchor.get(anchor_ref) || [];
      return [singleVerseConnections];
    }
  } catch (error) {
    console.error('Error in getCrossReferenceConnection:', error);
    throw new Error('Failed to analyze cross-reference connections');
  }
}

function normalizeReference(ref: string): string {
  // Convert various reference formats to standard format
  // "Luke 1:5" -> "Luke.1.5"
  // "Luke.1.5" -> "Luke.1.5" (already normalized)
  return ref
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/:/g, '.') // Replace colons with dots
    .replace(/\.+/g, '.'); // Remove duplicate dots
}

function calculateThematicOverlap(anchor: string, candidate: string): number {
  // Simplified thematic overlap calculation
  // In production, this would be more sophisticated
  const anchorBook = anchor.split('.')[0];
  const candidateBook = candidate.split('.')[0];

  // Same book = higher overlap
  if (anchorBook === candidateBook) {
    return 0.9;
  }

  // Same testament = medium overlap
  const ntBooks = [
    'Matthew',
    'Mark',
    'Luke',
    'John',
    'Acts',
    'Romans',
    '1Corinthians',
    '2Corinthians',
    'Galatians',
    'Ephesians',
    'Philippians',
    'Colossians',
    '1Thessalonians',
    '2Thessalonians',
    '1Timothy',
    '2Timothy',
    'Titus',
    'Philemon',
    'Hebrews',
    'James',
    '1Peter',
    '2Peter',
    '1John',
    '2John',
    '3John',
    'Jude',
    'Revelation',
  ];

  const anchorIsNT = ntBooks.includes(anchorBook);
  const candidateIsNT = ntBooks.includes(candidateBook);

  if (anchorIsNT === candidateIsNT) {
    return 0.6;
  }

  // Different testaments = lower overlap
  return 0.3;
}

function hasHistoricalContext(categories: string[]): boolean {
  const historicalCategories = [
    'historical_context',
    'chronology',
    'genealogy',
    'geographical',
  ];
  return categories.some(cat => historicalCategories.includes(cat));
}

function hasLiteraryConnection(connectionType: string): boolean {
  const literaryTypes = ['quotation', 'allusion', 'parallel', 'contrast'];
  return literaryTypes.includes(connectionType);
}
