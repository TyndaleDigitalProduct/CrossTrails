import {
  VerseContextRequest,
  VerseContextResponse,
  BibleVerse,
} from '@/lib/types';
import nltClient from '@/lib/bible-api/nltClient';

/**
 * MCP Tool: Get Verse Context
 * Fetches NLT text for selected verses with optional surrounding context
 */
export async function getVerseContext(
  request: VerseContextRequest
): Promise<VerseContextResponse> {
  const { references, include_context = false, context_range = 2 } = request;

  try {
    const verses = [];
    const context = [];

    for (const reference of references) {
      // Fetch the primary verse
      const verse = await fetchVerse(reference);
      if (verse) {
        verses.push(verse);

        // If context is requested, fetch surrounding verses
        if (include_context) {
          const surroundingContext = await fetchSurroundingVerses(
            reference,
            context_range
          );
          context.push(...surroundingContext);
        }
      }
    }

    return {
      verses,
      context: include_context ? context : undefined,
    };
  } catch (error) {
    console.error('Error in getVerseContext:', error);
    throw new Error('Failed to fetch verse context');
  }
}

async function fetchVerse(reference: string): Promise<BibleVerse | null> {
  // Parse reference like "John.3.16"
  const parts = reference.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid reference format: ${reference}`);
  }

  try {
    // Use the NLT client to fetch the verse
    const result = await nltClient.getVersesByReference(reference);

    // Return the first verse from the result (should be the exact match)
    if (result.verses && result.verses.length > 0) {
      return result.verses[0];
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch verse ${reference}:`, error);

    // Return null instead of throwing to allow graceful handling
    // The caller can decide whether to continue with other verses or fail
    return null;
  }
}

async function fetchSurroundingVerses(reference: string, range: number) {
  const parts = reference.split('.');
  const [book, chapter, verse] = parts;
  const verseNum = parseInt(verse);
  const chapterNum = parseInt(chapter);

  const context = [];

  try {
    // More efficient: fetch the entire chapter and extract the needed verses
    const chapterResult = await nltClient.getVersesByChapter(book, chapterNum);

    if (chapterResult.verses && chapterResult.verses.length > 0) {
      // Find verses before the target verse
      for (let i = Math.max(1, verseNum - range); i < verseNum; i++) {
        const contextVerse = chapterResult.verses.find(
          v => v.verse_number === i
        );
        if (contextVerse) {
          context.push({
            reference: `${book}.${chapter}.${i}`,
            text: contextVerse.text,
            position: 'before' as const,
          });
        }
      }

      // Find verses after the target verse
      for (let i = verseNum + 1; i <= verseNum + range; i++) {
        const contextVerse = chapterResult.verses.find(
          v => v.verse_number === i
        );
        if (contextVerse) {
          context.push({
            reference: `${book}.${chapter}.${i}`,
            text: contextVerse.text,
            position: 'after' as const,
          });
        }
      }
    }
  } catch (error) {
    console.error(
      `Failed to fetch surrounding verses for ${reference}:`,
      error
    );
    // If chapter fetch fails, try individual verse fetches as fallback
    try {
      // Fetch verses before
      for (let i = Math.max(1, verseNum - range); i < verseNum; i++) {
        const contextRef = `${book}.${chapter}.${i}`;
        const contextVerse = await fetchVerse(contextRef);
        if (contextVerse) {
          context.push({
            reference: contextRef,
            text: contextVerse.text,
            position: 'before' as const,
          });
        }
      }

      // Fetch verses after
      for (let i = verseNum + 1; i <= verseNum + range; i++) {
        const contextRef = `${book}.${chapter}.${i}`;
        const contextVerse = await fetchVerse(contextRef);
        if (contextVerse) {
          context.push({
            reference: contextRef,
            text: contextVerse.text,
            position: 'after' as const,
          });
        } else {
          // If we can't fetch a verse, assume we've reached the end of the chapter
          break;
        }
      }
    } catch (fallbackError) {
      console.error(
        `Fallback verse fetch also failed for ${reference}:`,
        fallbackError
      );
    }
  }

  return context;
}
