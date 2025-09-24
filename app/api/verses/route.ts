import { NextRequest, NextResponse } from 'next/server'
import { BibleVerse, VersesAPIResponse, APIError } from '@/lib/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const book = searchParams.get('book')
  const chapter = searchParams.get('chapter')
  const reference = searchParams.get('reference')

  try {
    let verses: BibleVerse[]
    let bookName: string
    let chapterNumber: number

    if (reference) {
      // Handle specific reference like "John.3.16" or "John.3.16-18"
      const result = await fetchVersesByReference(reference)
      verses = result.verses
      bookName = result.book
      chapterNumber = result.chapter
    } else if (book && chapter) {
      // Handle book and chapter
      const result = await fetchVersesByChapter(book, parseInt(chapter))
      verses = result.verses
      bookName = result.book
      chapterNumber = result.chapter
    } else if (book) {
      // Handle book only (default to chapter 1)
      const result = await fetchVersesByChapter(book, 1)
      verses = result.verses
      bookName = result.book
      chapterNumber = result.chapter
    } else {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Must provide either "reference" or "book" parameter',
            timestamp: new Date().toISOString(),
            request_id: generateRequestId()
          }
        } as APIError,
        { status: 400 }
      )
    }

    const response: VersesAPIResponse = {
      reference: verses.length > 1
        ? `${bookName}.${chapterNumber}.${verses[0].verse_number}-${verses[verses.length - 1].verse_number}`
        : `${bookName}.${chapterNumber}.${verses[0]?.verse_number || 1}`,
      book: bookName,
      chapter: chapterNumber,
      verses: verses,
      translation: 'NLT',
      copyright: '© 1996, 2004, 2015 by Tyndale House Foundation'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching verses:', error)

    return NextResponse.json(
      {
        error: {
          code: 'VERSE_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch verses',
          timestamp: new Date().toISOString(),
          request_id: generateRequestId()
        }
      } as APIError,
      { status: 500 }
    )
  }
}

async function fetchVersesByChapter(book: string, chapter: number) {
  // For demo purposes, return mock data for Matthew 2
  // In production, this would call the NLT.to API
  if (book === 'Matthew' && chapter === 2) {
    return {
      book: 'Matthew',
      chapter: 2,
      verses: getMatthew2Verses()
    }
  }

  // For other passages, return a placeholder
  // TODO: Implement actual NLT.to API integration
  return {
    book: book,
    chapter: chapter,
    verses: [
      {
        verse_number: 1,
        verse_id: `${book}.${chapter}.1`,
        text: `This is ${book} chapter ${chapter}, verse 1. (Demo text - implement NLT.to API integration)`
      }
    ]
  }
}

async function fetchVersesByReference(reference: string) {
  // Parse reference like "John.3.16" or "John.3.16-18"
  const parts = reference.split('.')
  if (parts.length < 3) {
    throw new Error('Invalid reference format')
  }

  const book = parts[0]
  const chapter = parseInt(parts[1])
  const versePart = parts[2]

  let startVerse: number
  let endVerse: number

  if (versePart.includes('-')) {
    const [start, end] = versePart.split('-')
    startVerse = parseInt(start)
    endVerse = parseInt(end)
  } else {
    startVerse = endVerse = parseInt(versePart)
  }

  // For demo, handle Matthew 2
  if (book === 'Matthew' && chapter === 2) {
    const allVerses = getMatthew2Verses()
    const filteredVerses = allVerses.filter(
      verse => verse.verse_number >= startVerse && verse.verse_number <= endVerse
    )

    return {
      book: 'Matthew',
      chapter: 2,
      verses: filteredVerses
    }
  }

  // TODO: Implement actual NLT.to API integration
  throw new Error(`Reference ${reference} not available in demo`)
}

function getMatthew2Verses(): BibleVerse[] {
  return [
    {
      verse_number: 1,
      verse_id: 'Matthew.2.1',
      text: 'Jesus was born in Bethlehem in Judea, during the reign of King Herod. About that time some wise men from eastern lands arrived in Jerusalem, asking,'
    },
    {
      verse_number: 2,
      verse_id: 'Matthew.2.2',
      text: '"Where is the newborn king of the Jews? We saw his star as it rose, and we have come to worship him."'
    },
    {
      verse_number: 3,
      verse_id: 'Matthew.2.3',
      text: 'King Herod was deeply disturbed when he heard this, as was everyone in Jerusalem.'
    },
    {
      verse_number: 4,
      verse_id: 'Matthew.2.4',
      text: 'He called a meeting of the leading priests and teachers of religious law and asked, "Where is the Messiah supposed to be born?"'
    },
    {
      verse_number: 5,
      verse_id: 'Matthew.2.5',
      text: '"In Bethlehem in Judea," they said, "for this is what the prophet wrote:'
    },
    {
      verse_number: 6,
      verse_id: 'Matthew.2.6',
      text: '"And you, O Bethlehem in the land of Judah, are not least among the ruling cities of Judah, for a ruler will come from you who will be the shepherd for my people Israel."'
    },
    {
      verse_number: 7,
      verse_id: 'Matthew.2.7',
      text: 'Then Herod called for a private meeting with the wise men, and he learned from them the time when the star first appeared.'
    },
    {
      verse_number: 8,
      verse_id: 'Matthew.2.8',
      text: 'Then he told them, "Go to Bethlehem and search carefully for the child. And when you find him, come back and tell me so that I can go and worship him, too!"'
    }
  ]
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}