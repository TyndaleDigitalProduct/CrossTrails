import { NextRequest, NextResponse } from 'next/server'
import { ExploreQuery, APIError } from '@/lib/types'
import { getCrossReferenceConnection } from '@/lib/mcp-tools/getCrossReferenceConnection'
import { getVerseContext } from '@/lib/mcp-tools/getVerseContext'

// Use Edge Runtime for better performance and streaming
export const runtime = 'edge'
export const maxDuration = 30

async function generateMCPResponse(
  selectedVerses: string[],
  userObservation: string,
  selectedCrossRefs: string[]
): Promise<string> {
  try {
    let response = `Based on your observation: "${userObservation}"\n\n`

    if (selectedVerses.length > 0) {
      // Convert string verse IDs to display format
      const verseDisplays = selectedVerses.map(v => v.replace(/\./g, ' '))
      response += `**Analysis of ${verseDisplays.join(', ')}:**\n\n`

      // Get cross-reference connections for the first verse as anchor
      if (selectedVerses.length > 0) {
        const anchorVerse = selectedVerses[0]
        
        const connections = await getCrossReferenceConnection({
          anchor_verse: anchorVerse,
          candidate_refs: selectedCrossRefs,
          min_strength: 0.5
        })

        // Get verse context
        const verseContext = await getVerseContext({
          references: selectedVerses,
          include_context: true,
          context_range: 1
        })

        // Add verse text and context
        if (verseContext.verses && verseContext.verses.length > 0) {
          response += `**Verse Text:**\n`
          verseContext.verses.forEach(verse => {
            response += `- **${verse.verse_id.replace(/\./g, ' ')}**: "${verse.text}"\n`
          })
          response += '\n'
        }

        // Add cross-reference insights
        if (connections.connections && connections.connections.length > 0) {
          response += `**Cross-Reference Connections:**\n\n`
          
          // Group by strength
          const strongConnections = connections.connections.filter(c => c.strength >= 0.8)
          const moderateConnections = connections.connections.filter(c => c.strength >= 0.6 && c.strength < 0.8)
          
          if (strongConnections.length > 0) {
            response += `**Strong Connections (80%+ strength):**\n`
            strongConnections.slice(0, 3).forEach(conn => {
              response += `- **${conn.reference.replace(/\./g, ' ')}** (${Math.round(conn.strength * 100)}% strength)\n`
              response += `  *${conn.type}*: ${conn.explanation}\n`
              response += `  Categories: ${conn.categories.join(', ')}\n\n`
            })
          }
          
          if (moderateConnections.length > 0) {
            response += `**Notable Connections (60-80% strength):**\n`
            moderateConnections.slice(0, 2).forEach(conn => {
              response += `- **${conn.reference.replace(/\./g, ' ')}** (${Math.round(conn.strength * 100)}% strength)\n`
              response += `  *${conn.type}*: ${conn.explanation}\n\n`
            })
          }

          // Add interpretive summary
          response += `**Summary:**\n`
          const categories = [...new Set(connections.connections.flatMap(c => c.categories))]
          response += `This passage shows connections across ${categories.length} thematic categories: ${categories.join(', ')}. `
          
          const avgStrength = connections.connections.reduce((sum, c) => sum + c.strength, 0) / connections.connections.length
          if (avgStrength >= 0.7) {
            response += `The cross-references demonstrate strong thematic coherence (${Math.round(avgStrength * 100)}% average strength). `
          }
          
          response += `Consider exploring these connections to deepen your understanding of the biblical narrative and theological themes.`
        } else {
          response += `**Cross-Reference Analysis:**\nNo direct connections were found in the cross-reference data for the selected verses. This could indicate unique content or passages that stand independently in their theological significance.\n\n`
        }
      }
    }

    // Add user's selected cross-references if provided
    if (selectedCrossRefs && selectedCrossRefs.length > 0) {
      response += `\n**Your Selected Cross-References:**\n`
      selectedCrossRefs.forEach(ref => {
        response += `- ${ref.replace(/\./g, ' ')}\n`
      })
      response += '\n'
    }

    return response

  } catch (error) {
    console.error('Error generating MCP response:', error)
    return `I encountered an issue analyzing the cross-references for your observation: "${userObservation}". The selected verses ${selectedVerses.join(', ').replace(/\./g, ' ')} contain rich connections, but I'm unable to access the detailed analysis at this time. Please try again, or consider exploring these passages in their broader biblical context.`
  }
}

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

    // Use MCP tools to gather context and analyze connections
    const mcpResponse = await generateMCPResponse(selectedVerses, userObservation, selectedCrossRefs)

    // Create a readable stream for the response
    const stream = new ReadableStream({
      start(controller) {
        // Stream the MCP-generated response
        const words = mcpResponse.split(' ')
        let index = 0

        const interval = setInterval(() => {
          if (index < words.length) {
            controller.enqueue(new TextEncoder().encode(words[index] + ' '))
            index++
          } else {
            clearInterval(interval)
            controller.close()
          }
        }, 50) // 50ms between words for demo streaming effect
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

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}