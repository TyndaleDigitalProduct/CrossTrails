import { NextRequest, NextResponse } from 'next/server'
import { ExploreQuery, APIError } from '@/lib/types'

// Use Edge Runtime for better performance and streaming
export const runtime = 'edge'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExploreQuery

    const { selectedVerses, userObservation, selectedCrossRefs } = body

    // Validate required fields
    if (!selectedVerses || selectedVerses.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_VERSES',
            message: 'Selected verses are required',
            timestamp: new Date().toISOString(),
            request_id: generateRequestId()
          }
        } as APIError,
        { status: 400 }
      )
    }

    if (!userObservation || userObservation.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_OBSERVATION',
            message: 'User observation is required',
            timestamp: new Date().toISOString(),
            request_id: generateRequestId()
          }
        } as APIError,
        { status: 400 }
      )
    }

    if (!selectedCrossRefs || selectedCrossRefs.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_CROSS_REFS',
            message: 'Selected cross-references are required',
            timestamp: new Date().toISOString(),
            request_id: generateRequestId()
          }
        } as APIError,
        { status: 400 }
      )
    }

    // For demo purposes, return a mock streaming response
    // In production, this would use the MCP tools and Gloo AI Studio
    const mockResponse = await generateMockAIResponse(selectedVerses, userObservation, selectedCrossRefs)

    // Create a readable stream for the response
    const stream = new ReadableStream({
      start(controller) {
        // Simulate streaming response
        const words = mockResponse.split(' ')
        let index = 0

        const interval = setInterval(() => {
          if (index < words.length) {
            controller.enqueue(new TextEncoder().encode(words[index] + ' '))
            index++
          } else {
            clearInterval(interval)
            controller.close()
          }
        }, 50) // 50ms between words for demo
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in explore API:', error)

    return NextResponse.json(
      {
        error: {
          code: 'EXPLORE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate AI insights',
          timestamp: new Date().toISOString(),
          request_id: generateRequestId()
        }
      } as APIError,
      { status: 500 }
    )
  }
}

async function generateMockAIResponse(
  selectedVerses: string[],
  userObservation: string,
  selectedCrossRefs: string[]
): Promise<string> {
  // This is a mock response for demo purposes
  // In production, this would:
  // 1. Use MCP tools to gather context
  // 2. Build an optimized prompt
  // 3. Call Gloo AI Studio API
  // 4. Stream the real response

  const verseDisplay = selectedVerses.map(v => v.replace(/\./g, ' ')).join(', ')
  const refsDisplay = selectedCrossRefs.map(r => r.replace(/\./g, ' ')).join(', ')

  return `Thank you for sharing your observation: "${userObservation}"

Your insight touches on a profound biblical theme that connects ${verseDisplay} with the cross-references you selected (${refsDisplay}).

Looking at the textual and thematic connections:

**Historical Context**: The passages you've selected are linked through the narrative of Jesus' birth and the fulfillment of Old Testament prophecies. The wise men's question "Where is the newborn king of the Jews?" directly connects to the ancient prophecies about the Messiah's birthplace.

**Prophetic Fulfillment**: The reference to Micah 5:2 in Matthew 2:6 shows how the specific location of Bethlehem was prophetically significant centuries before Christ's birth. This demonstrates the intentional nature of God's plan unfolding through history.

**Theological Significance**: The star that guided the wise men serves as a symbol of divine revelation, connecting to Numbers 24:17's prophecy of "a star will rise from Jacob." This shows how God uses both natural phenomena and supernatural guidance to accomplish His purposes.

The connections you've identified highlight how the New Testament writers, particularly Matthew, intentionally showed their Jewish audience that Jesus fulfilled specific messianic prophecies, establishing His credentials as the promised King.

**Sources**: Matthew 2:1-6, Micah 5:2, Numbers 24:17, Luke 2:4-7`
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// TODO: Implement actual MCP tools and Gloo AI Studio integration
// This would include:
// - getVerseContext(selectedVerses)
// - getCrossReferenceConnection(anchor, selectedCrossRefs)
// - getStudyNotes(selectedVerses) [if available]
// - getDictionaryArticles(extractedConcepts) [if available]
// - buildOptimizedPrompt(context, observation)
// - callGlooAIStudio(prompt, { stream: true })