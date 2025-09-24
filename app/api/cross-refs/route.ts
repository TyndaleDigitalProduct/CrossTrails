import { NextRequest, NextResponse } from 'next/server'
import { CrossReference, CrossRefsAPIResponse, APIError } from '@/lib/types'

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
  // For demo purposes, return mock cross-references for Matthew 2 verses
  // In production, this would load from the processed cross-reference data
  const demoCrossRefs: Record<string, CrossReference[]> = {
    'Matthew.2.1': [
      {
        reference: 'Luke.1.5',
        display_ref: 'Luke 1:5',
        text: 'When Herod was king of Judea, there was a Jewish priest named Zechariah.',
        connection: {
          categories: ['historical_context', 'chronology'],
          strength: 0.85,
          type: 'historical',
          explanation: 'Both passages reference the reign of King Herod as historical context'
        },
        context: {
          book: 'Luke',
          chapter: 1,
          verse: 5
        }
      },
      {
        reference: 'Luke.2.4-7',
        display_ref: 'Luke 2:4-7',
        text: 'And because Joseph was a descendant of King David, he had to go to Bethlehem in Judea...',
        connection: {
          categories: ['birth_narrative', 'location'],
          strength: 0.92,
          type: 'parallel',
          explanation: 'Both passages describe Jesus being born in Bethlehem'
        },
        context: {
          book: 'Luke',
          chapter: 2,
          verse: 4
        }
      }
    ],
    'Matthew.2.2': [
      {
        reference: 'Num.24.17',
        display_ref: 'Num 24:17',
        text: 'I see him, but not here and now. I perceive him, but far in the distant future. A star will rise from Jacob; a scepter will emerge from Israel.',
        connection: {
          categories: ['prophecy', 'messianic', 'star'],
          strength: 0.88,
          type: 'fulfillment',
          explanation: 'Prophecy of a star rising from Jacob, fulfilled in the star that led the wise men'
        },
        context: {
          book: 'Numbers',
          chapter: 24,
          verse: 17
        }
      },
      {
        reference: 'Jer.23.5',
        display_ref: 'Jer 23:5',
        text: '"For the time is coming," says the Lord, "when I will raise up a righteous descendant from King David\'s line."',
        connection: {
          categories: ['messianic', 'kingship'],
          strength: 0.82,
          type: 'fulfillment',
          explanation: 'Prophecy of the coming king that the wise men came to worship'
        },
        context: {
          book: 'Jeremiah',
          chapter: 23,
          verse: 5
        }
      },
      {
        reference: 'Matt.2.9',
        display_ref: 'Matt 2:9',
        text: 'After this interview the wise men went their way. And the star they had seen in the east guided them to Bethlehem.',
        connection: {
          categories: ['narrative_continuation'],
          strength: 0.95,
          type: 'parallel',
          explanation: 'Direct continuation of the star narrative'
        },
        context: {
          book: 'Matthew',
          chapter: 2,
          verse: 9
        }
      },
      {
        reference: 'Rev.22.16',
        display_ref: 'Rev 22:16',
        text: '"I, Jesus, have sent my angel to give you this message for the churches. I am both the source of David and the heir to his throne. I am the bright morning star."',
        connection: {
          categories: ['messianic', 'star', 'identity'],
          strength: 0.78,
          type: 'thematic',
          explanation: 'Jesus identifies himself as the bright morning star'
        },
        context: {
          book: 'Revelation',
          chapter: 22,
          verse: 16
        }
      }
    ],
    'Matthew.2.5': [
      {
        reference: 'John.7.42',
        display_ref: 'John 7:42',
        text: 'For the Scriptures clearly state that the Messiah will be born of the royal line of David, in Bethlehem, the village where King David was born.',
        connection: {
          categories: ['prophecy', 'location', 'messianic'],
          strength: 0.90,
          type: 'parallel',
          explanation: 'Both passages reference the prophecy that the Messiah would be born in Bethlehem'
        },
        context: {
          book: 'John',
          chapter: 7,
          verse: 42
        }
      }
    ],
    'Matthew.2.6': [
      {
        reference: 'Mic.5.2',
        display_ref: 'Mic 5:2',
        text: 'But you, O Bethlehem Ephrathah, are only a small village among all the people of Judah. Yet a ruler of Israel, whose origins are in the distant past, will come from you on my behalf.',
        connection: {
          categories: ['prophecy', 'direct_quotation'],
          strength: 0.98,
          type: 'quotation',
          explanation: 'Matthew 2:6 is a direct quotation from Micah 5:2'
        },
        context: {
          book: 'Micah',
          chapter: 5,
          verse: 2
        }
      }
    ]
  }

  const crossRefs = demoCrossRefs[verseId] || []

  // Filter by minimum strength
  return crossRefs.filter(ref => ref.connection.strength >= minStrength)
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}