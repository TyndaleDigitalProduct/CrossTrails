import { VerseContextRequest, VerseContextResponse } from '@/lib/types'

/**
 * MCP Tool: Get Verse Context
 * Fetches NLT text for selected verses with optional surrounding context
 */
export async function getVerseContext(
  request: VerseContextRequest
): Promise<VerseContextResponse> {
  const { references, include_context = false, context_range = 2 } = request

  try {
    const verses = []
    const context = []

    for (const reference of references) {
      // Fetch the primary verse
      const verse = await fetchVerse(reference)
      if (verse) {
        verses.push(verse)

        // If context is requested, fetch surrounding verses
        if (include_context) {
          const surroundingContext = await fetchSurroundingVerses(reference, context_range)
          context.push(...surroundingContext)
        }
      }
    }

    return {
      verses,
      context: include_context ? context : undefined
    }

  } catch (error) {
    console.error('Error in getVerseContext:', error)
    throw new Error('Failed to fetch verse context')
  }
}

async function fetchVerse(reference: string) {
  // Parse reference like "John.3.16"
  const parts = reference.split('.')
  if (parts.length !== 3) {
    throw new Error(`Invalid reference format: ${reference}`)
  }

  const [book, chapter, verse] = parts

  // For demo, return mock data for Matthew 2
  // In production, this would call the NLT.to API or use cached NLT data
  if (book === 'Matthew' && chapter === '2') {
    const matthewVerses = getMatthew2Verses()
    const targetVerse = matthewVerses.find(v => v.verse_number === parseInt(verse))

    if (targetVerse) {
      return {
        verse_number: targetVerse.verse_number,
        verse_id: reference,
        text: targetVerse.text,
        book: 'Matthew',
        chapter: 2,
        verse: targetVerse.verse_number
      }
    }
  }

  // For other references, return placeholder
  // TODO: Implement actual NLT.to API call or NLT JSON lookup
  return {
    verse_number: parseInt(verse),
    verse_id: reference,
    text: `[${book} ${chapter}:${verse}] - Implement NLT.to API integration`,
    book,
    chapter: parseInt(chapter),
    verse: parseInt(verse)
  }
}

async function fetchSurroundingVerses(reference: string, range: number) {
  const parts = reference.split('.')
  const [book, chapter, verse] = parts
  const verseNum = parseInt(verse)

  const context = []

  // Fetch verses before
  for (let i = Math.max(1, verseNum - range); i < verseNum; i++) {
    const contextRef = `${book}.${chapter}.${i}`
    const contextVerse = await fetchVerse(contextRef)
    if (contextVerse) {
      context.push({
        reference: contextRef,
        text: contextVerse.text,
        position: 'before' as const
      })
    }
  }

  // Fetch verses after
  for (let i = verseNum + 1; i <= verseNum + range; i++) {
    const contextRef = `${book}.${chapter}.${i}`
    try {
      const contextVerse = await fetchVerse(contextRef)
      if (contextVerse) {
        context.push({
          reference: contextRef,
          text: contextVerse.text,
          position: 'after' as const
        })
      }
    } catch {
      // Stop if we hit the end of the chapter
      break
    }
  }

  return context
}

function getMatthew2Verses() {
  return [
    {
      verse_number: 1,
      text: 'Jesus was born in Bethlehem in Judea, during the reign of King Herod. About that time some wise men from eastern lands arrived in Jerusalem, asking,'
    },
    {
      verse_number: 2,
      text: '"Where is the newborn king of the Jews? We saw his star as it rose, and we have come to worship him."'
    },
    {
      verse_number: 3,
      text: 'King Herod was deeply disturbed when he heard this, as was everyone in Jerusalem.'
    },
    {
      verse_number: 4,
      text: 'He called a meeting of the leading priests and teachers of religious law and asked, "Where is the Messiah supposed to be born?"'
    },
    {
      verse_number: 5,
      text: '"In Bethlehem in Judea," they said, "for this is what the prophet wrote:'
    },
    {
      verse_number: 6,
      text: '"And you, O Bethlehem in the land of Judah, are not least among the ruling cities of Judah, for a ruler will come from you who will be the shepherd for my people Israel.'"'
    },
    {
      verse_number: 7,
      text: 'Then Herod called for a private meeting with the wise men, and he learned from them the time when the star first appeared.'
    },
    {
      verse_number: 8,
      text: 'Then he told them, "Go to Bethlehem and search carefully for the child. And when you find him, come back and tell me so that I can go and worship him, too!"'
    }
  ]
}