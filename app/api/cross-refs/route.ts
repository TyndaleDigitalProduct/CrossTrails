import { NextRequest, NextResponse } from 'next/server'
import { CrossReference, CrossRefsAPIResponse, APIError } from '@/lib/types'
import { getCrossReferenceConnection } from '@/lib/mcp-tools/getCrossReferenceConnection'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const verse = searchParams.get('verse')
  const verses = searchParams.get('verses')
  const limit = parseInt(searchParams.get('limit') || '10')
  const minStrength = parseFloat(searchParams.get('min_strength') || '0.5')

  try {
    let targetVerses: string[]

    if (verses) {
      targetVerses = verses.split(',')
    } else if (verse) {
      targetVerses = [verse]
    } else {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Must provide either "verse" or "verses" parameter',
            timestamp: new Date().toISOString(),
            request_id: generateRequestId()
          }
        } as APIError,
        { status: 400 }
      )
    }

    // Get cross-references for the specified verses
    const allCrossRefs: CrossReference[] = []

    for (const verseId of targetVerses) {
      const crossRefs = await getCrossReferencesForVerse(verseId, minStrength)
      allCrossRefs.push(...crossRefs)
    }

    // Remove duplicates and limit results
    const uniqueRefs = allCrossRefs.filter((ref, index, self) =>
      index === self.findIndex(r => r.reference === ref.reference)
    )

    const limitedRefs = uniqueRefs.slice(0, limit)

    const response: CrossRefsAPIResponse = {
      anchor_verses: targetVerses,
      cross_references: limitedRefs,
      total_found: uniqueRefs.length,
      returned: limitedRefs.length
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching cross-references:', error)

    return NextResponse.json(
      {
        error: {
          code: 'CROSS_REF_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch cross-references',
          timestamp: new Date().toISOString(),
          request_id: generateRequestId()
        }
      } as APIError,
      { status: 500 }
    )
  }
}

async function getCrossReferencesForVerse(verseId: string, minStrength: number): Promise<CrossReference[]> {
  try {
    // Use MCP tools to get real cross-reference data from JSON files
    const mcpResponse = await getCrossReferenceConnection({
      anchor_verse: verseId,
      candidate_refs: [], // Let MCP tools find all available references
      min_strength: minStrength
    })

    // Transform MCP response to CrossReference format
    const crossRefs: CrossReference[] = mcpResponse.connections.map(conn => {
      // Parse reference to get book, chapter, verse
      const refParts = conn.reference.split('.')
      let book = refParts[0]
      let chapter = 1
      let verse = 1

      if (refParts.length >= 2) {
        chapter = parseInt(refParts[1]) || 1
      }
      if (refParts.length >= 3) {
        verse = parseInt(refParts[2]) || 1
      }

      // Create display reference (e.g., "Matthew 2:1")
      const displayRef = `${book} ${chapter}:${verse}`

      return {
        reference: conn.reference,
        display_ref: displayRef,
        text: '', // Could be populated from Bible API if needed
        connection: {
          categories: conn.categories,
          strength: conn.strength,
          type: conn.type,
          explanation: conn.explanation
        },
        context: {
          book,
          chapter,
          verse
        }
      }
    })

    return crossRefs

  } catch (error) {
    console.error('Error getting cross-references from MCP tools:', error)
    
    // Fallback to empty array if real data fails
    return []
  }
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}