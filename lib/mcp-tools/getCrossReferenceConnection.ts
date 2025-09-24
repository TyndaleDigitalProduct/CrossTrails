import { CrossReferenceConnectionRequest, CrossReferenceConnectionResponse, ConnectionType } from '@/lib/types'

/**
 * MCP Tool: Get Cross-Reference Connection
 * Analyzes relationships between verses using cross-reference data
 */
export async function getCrossReferenceConnection(
  request: CrossReferenceConnectionRequest
): Promise<CrossReferenceConnectionResponse> {
  const { anchor_verse, candidate_refs, min_strength = 0.5 } = request

  try {
    // Load cross-reference data (in production, this would come from Vercel Blob or processed JSON)
    const crossRefData = await loadCrossReferenceData()

    // Find connections for the anchor verse
    const anchorData = crossRefData[anchor_verse]
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

async function loadCrossReferenceData(): Promise<Record<string, any>> {
  // For demo purposes, return mock data
  // In production, this would load from Vercel Blob storage or processed JSON files
  return {
    'Matthew.2.1': {
      refs: 'Matthew.2.1',
      cross_references: [
        {
          bref: 'Luke.1.5',
          label: 'Luke 1:5',
          categories: ['historical_context', 'chronology'],
          strength: 0.85,
          connection_type: 'historical',
          explanation_seed: 'Both passages reference the reign of King Herod as historical context'
        },
        {
          bref: 'Luke.2.4-7',
          label: 'Luke 2:4-7',
          categories: ['birth_narrative', 'location'],
          strength: 0.92,
          connection_type: 'parallel',
          explanation_seed: 'Both passages describe Jesus being born in Bethlehem'
        }
      ]
    },
    'Matthew.2.2': {
      refs: 'Matthew.2.2',
      cross_references: [
        {
          bref: 'Num.24.17',
          label: 'Num 24:17',
          categories: ['prophecy', 'messianic', 'star'],
          strength: 0.88,
          connection_type: 'fulfillment',
          explanation_seed: 'Prophecy of a star rising from Jacob, fulfilled in the star that led the wise men'
        },
        {
          bref: 'Jer.23.5',
          label: 'Jer 23:5',
          categories: ['messianic', 'kingship'],
          strength: 0.82,
          connection_type: 'fulfillment',
          explanation_seed: 'Prophecy of the coming king that the wise men came to worship'
        },
        {
          bref: 'Rev.22.16',
          label: 'Rev 22:16',
          categories: ['messianic', 'star', 'identity'],
          strength: 0.78,
          connection_type: 'thematic',
          explanation_seed: 'Jesus identifies himself as the bright morning star'
        }
      ]
    },
    'Matthew.2.5': {
      refs: 'Matthew.2.5',
      cross_references: [
        {
          bref: 'John.7.42',
          label: 'John 7:42',
          categories: ['prophecy', 'location', 'messianic'],
          strength: 0.90,
          connection_type: 'parallel',
          explanation_seed: 'Both passages reference the prophecy that the Messiah would be born in Bethlehem'
        }
      ]
    },
    'Matthew.2.6': {
      refs: 'Matthew.2.6',
      cross_references: [
        {
          bref: 'Mic.5.2',
          label: 'Mic 5:2',
          categories: ['prophecy', 'direct_quotation'],
          strength: 0.98,
          connection_type: 'quotation',
          explanation_seed: 'Matthew 2:6 is a direct quotation from Micah 5:2'
        }
      ]
    }
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