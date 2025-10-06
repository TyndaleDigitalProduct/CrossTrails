import { CrossReferenceConnectionRequest, CrossReferenceConnectionResponse, ConnectionType } from '@/lib/types'
import { CrossReferenceDataAccess } from '@/lib/data-access/CrossReferenceDataAccess'
import { LocalFileDataSource } from '@/lib/data-access/LocalFileDataSource'
import { MockDataSource } from '@/lib/data-access/MockDataSource'

/**
 * Create a data access instance with appropriate sources
 */
async function createDataAccess(): Promise<CrossReferenceDataAccess> {
  const localSource = new LocalFileDataSource('data/crefs_json')
  const mockSource = new MockDataSource()
  return new CrossReferenceDataAccess([localSource, mockSource])
}

/**
 * MCP Tool: Get Cross-Reference Connection
 * Analyzes relationships between verses using cross-reference data
 */
export async function getCrossReferenceConnection(
  request: CrossReferenceConnectionRequest
): Promise<CrossReferenceConnectionResponse> {
  const { anchor_verse, candidate_refs, min_strength = 0.5 } = request

  try {
    // Load cross-reference data using the data access layer
    const dataAccess = await createDataAccess()
    
    // Get data for the anchor verse
    const anchorData = await dataAccess.getVerseData(anchor_verse)
    if (!anchorData) {
      return { connections: [] }
    }

    const connections = []

    for (const candidateRef of candidate_refs) {
      // Find if there's a connection between anchor and candidate
      const connection = anchorData.cross_references.find(
        (ref: any) => normalizeReference(ref.bref) === normalizeReference(candidateRef)
      )

      if (connection && connection.strength >= min_strength) {
        connections.push({
          reference: candidateRef,
          strength: connection.strength,
          categories: connection.categories || [],
          type: connection.connection_type as ConnectionType,
          explanation: connection.explanation_seed || '',
          metadata: {
            thematic_overlap: calculateThematicOverlap(anchor_verse, candidateRef),
            historical_context: hasHistoricalContext(connection.categories || []),
            literary_connection: hasLiteraryConnection(connection.connection_type)
          }
        })
      }
    }

    // Sort by strength (highest first)
    connections.sort((a, b) => b.strength - a.strength)

    return { connections }

  } catch (error) {
    console.error('Error in getCrossReferenceConnection:', error)
    throw new Error('Failed to analyze cross-reference connections')
  }
}





function normalizeReference(ref: string): string {
  // Convert various reference formats to standard format
  // "Luke 1:5" -> "Luke.1.5"
  // "Luke.1.5" -> "Luke.1.5" (already normalized)
  return ref
    .replace(/\s+/g, '.')  // Replace spaces with dots
    .replace(/:/g, '.')    // Replace colons with dots
    .replace(/\.+/g, '.')  // Remove duplicate dots
}

function calculateThematicOverlap(anchor: string, candidate: string): number {
  // Simplified thematic overlap calculation
  // In production, this would be more sophisticated
  const anchorBook = anchor.split('.')[0]
  const candidateBook = candidate.split('.')[0]

  // Same book = higher overlap
  if (anchorBook === candidateBook) {
    return 0.9
  }

  // Same testament = medium overlap
  const ntBooks = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1Corinthians', '2Corinthians',
                   'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1Thessalonians', '2Thessalonians',
                   '1Timothy', '2Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1Peter', '2Peter',
                   '1John', '2John', '3John', 'Jude', 'Revelation']

  const anchorIsNT = ntBooks.includes(anchorBook)
  const candidateIsNT = ntBooks.includes(candidateBook)

  if (anchorIsNT === candidateIsNT) {
    return 0.6
  }

  // Different testaments = lower overlap
  return 0.3
}

function hasHistoricalContext(categories: string[]): boolean {
  const historicalCategories = ['historical_context', 'chronology', 'genealogy', 'geographical']
  return categories.some(cat => historicalCategories.includes(cat))
}

function hasLiteraryConnection(connectionType: string): boolean {
  const literaryTypes = ['quotation', 'allusion', 'parallel', 'contrast']
  return literaryTypes.includes(connectionType)
}