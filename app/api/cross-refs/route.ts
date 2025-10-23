import { NextRequest, NextResponse } from 'next/server';
import { CrossReference, CrossRefsAPIResponse, APIError } from '@/lib/types';
import { getCrossReferenceConnection } from '@/lib/mcp-tools/getCrossReferenceConnection';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const verse = searchParams.get('verse');
  const verses = searchParams.get('verses');
  const chapter = searchParams.get('chapter');
  const limit = parseInt(searchParams.get('limit') || '10');
  const minStrength = parseFloat(searchParams.get('min_strength') || '0.5');

  try {
    // Check if this is a chapter query
    if (chapter) {
      return await handleChapterQuery(chapter, limit, minStrength);
    }

    let targetVerses: string[];

    if (verses) {
      targetVerses = verses.split(',');
    } else if (verse) {
      targetVerses = [verse];
    } else {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_PARAMETERS',
            message:
              'Must provide either "verse", "verses", or "chapter" parameter',
            timestamp: new Date().toISOString(),
            request_id: generateRequestId(),
          },
        } as APIError,
        { status: 400 }
      );
    }

    // Get cross-references for the specified verses
    const allCrossRefs: CrossReference[] = [];

    for (const verseId of targetVerses) {
      const crossRefs = await getCrossReferencesForVerse(verseId, minStrength);
      allCrossRefs.push(...crossRefs);
    }

    // Remove duplicates and limit results
    const uniqueRefs = allCrossRefs.filter(
      (ref, index, self) =>
        index === self.findIndex(r => r.reference === ref.reference)
    );

    const limitedRefs = uniqueRefs.slice(0, limit);

    const response: CrossRefsAPIResponse = {
      anchor_verses: targetVerses,
      cross_references: limitedRefs,
      total_found: uniqueRefs.length,
      returned: limitedRefs.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching cross-references:', error);

    return NextResponse.json(
      {
        error: {
          code: 'CROSS_REF_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch cross-references',
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
        },
      } as APIError,
      { status: 500 }
    );
  }
}

async function handleChapterQuery(
  chapter: string,
  limit: number,
  minStrength: number
) {
  // Get cross-references for all verses in the chapter
  const verseResults = await getCrossReferencesForChapter(chapter, minStrength);

  // Apply limit to each verse's cross-references
  const limitedResults = verseResults.map(result => ({
    ...result,
    cross_references: result.cross_references.slice(0, limit),
  }));

  return NextResponse.json({
    anchor_verses: [chapter],
    verses: limitedResults,
    total_verses: limitedResults.length,
    returned_verses: limitedResults.length,
  });
}

async function getCrossReferencesForVerse(
  referenceId: string,
  minStrength: number
): Promise<CrossReference[]> {
  try {
    // Use MCP tools to get real cross-reference data from JSON files
    const mcpResponse = await getCrossReferenceConnection({
      anchor_ref: referenceId,
      candidate_refs: [],
      min_strength: minStrength,
    });

    // For single verses, mcpResponse is an array of arrays
    // Get the first (and should be only) array
    const connections = (
      Array.isArray(mcpResponse[0]) ? mcpResponse[0] : mcpResponse
    ) as any[];

    const crossRefs: CrossReference[] = connections.map((conn: any) => {
      console.log(conn);
      const refParts = conn.reference.split('.');
      const book = refParts[0];
      let chapterNum = 1;
      let verse = 1;

      if (refParts.length >= 2) {
        chapterNum = parseInt(refParts[1]) || 1;
      }
      if (refParts.length >= 3) {
        verse = parseInt(refParts[2]) || 1;
      }

      const displayRef = `${book} ${chapterNum}:${verse}`;

      return {
        reference: conn.reference,
        display_ref: displayRef,
        text: '',
        connection: {
          categories: conn.categories,
          strength: conn.strength,
          type: conn.type,
          explanation: conn.explanation,
        },
        context: {
          book,
          chapter: chapterNum,
          verse,
        },
      };
    });

    return crossRefs;
  } catch (error) {
    console.error('Error getting cross-references from MCP tools:', error);
    return [];
  }
}

async function getCrossReferencesForChapter(
  chapter: string,
  minStrength: number
): Promise<
  Array<{ anchor_verse: string; cross_references: CrossReference[] }>
> {
  try {
    // Use MCP tools to get real cross-reference data
    const mcpResponse = await getCrossReferenceConnection({
      anchor_ref: chapter,
      candidate_refs: [],
      min_strength: minStrength,
    });

    // mcpResponse is now an array of arrays, one per verse
    // Transform each into a verse result object
    const results = mcpResponse
      .map((connections: any[]) => {
        if (connections.length === 0) return null;

        // Get the anchor verse from the first connection's metadata
        const firstConnection = connections[0];
        const anchorVerse = firstConnection.anchor_verse || chapter;

        const crossRefs: CrossReference[] = connections.map(conn => {
          const refParts = conn.reference.split('.');
          const book = refParts[0];
          let chapterNum = 1;
          let verse = 1;

          if (refParts.length >= 2) {
            chapterNum = parseInt(refParts[1]) || 1;
          }
          if (refParts.length >= 3) {
            verse = parseInt(refParts[2]) || 1;
          }

          const displayRef = `${book} ${chapterNum}:${verse}`;

          return {
            reference: conn.reference,
            display_ref: displayRef,
            text: '',
            connection: {
              categories: conn.categories,
              strength: conn.strength,
              type: conn.type,
              explanation: conn.explanation,
            },
            context: {
              book,
              chapter: chapterNum,
              verse,
            },
          };
        });

        return {
          anchor_verse: anchorVerse,
          cross_references: crossRefs,
        };
      })
      .filter(
        (
          result
        ): result is {
          anchor_verse: string;
          cross_references: CrossReference[];
        } => result !== null
      );

    return results;
  } catch (error) {
    console.error('Error getting chapter cross-references:', error);
    return [];
  }
}

function generateRequestId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
