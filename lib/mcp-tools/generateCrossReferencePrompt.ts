import { CrossReferencePromptRequest, CrossReferencePromptResponse, CrossReference } from '@/lib/types'
import { getVerseContext } from './getVerseContext'

/**
 * MCP Tool: Generate Cross-Reference Prompt
 * Assembles comprehensive LLM prompts with cross-reference context, verse texts,
 * surrounding context, and connection reasoning for AI analysis
 */
export async function generateCrossReferencePrompt(
  request: CrossReferencePromptRequest
): Promise<CrossReferencePromptResponse> {
  const { 
    crossReference, 
    userObservation = '', 
    contextRange = 3, 
    promptTemplate = 'default' 
  } = request

  try {
    // Extract anchor reference from the cross-reference data
    const anchorRef = crossReference.anchor_ref || extractAnchorFromContext(crossReference)
    if (!anchorRef) {
      throw new Error('Cannot determine anchor reference from CrossReference data')
    }

    // Fetch verse context for both anchor and cross-reference
    const [anchorContext, crossRefContext] = await Promise.all([
      getVerseContext({
        references: [anchorRef],
        include_context: true,
        context_range: contextRange
      }),
      getVerseContext({
        references: [crossReference.reference],
        include_context: true,
        context_range: contextRange
      })
    ])

    // Validate that we got the required data
    if (!anchorContext.verses.length || !crossRefContext.verses.length) {
      throw new Error('Failed to fetch verse text for anchor or cross-reference')
    }

    const anchorVerse = anchorContext.verses[0]
    const crossRefVerse = crossRefContext.verses[0]

    // Build the prompt based on the selected template
    const prompt = buildPrompt({
      template: promptTemplate,
      anchorVerse,
      crossRefVerse,
      anchorContext: anchorContext.context || [],
      crossRefContext: crossRefContext.context || [],
      connection: crossReference.connection,
      reasoning: crossReference.reasoning,
      userObservation
    })

    // Prepare the response
    return {
      prompt,
      sources: {
        anchor_verse: {
          reference: anchorRef,
          text: anchorVerse.text,
          context: anchorContext.context?.map(c => `${c.reference}: ${c.text}`)
        },
        cross_reference: {
          reference: crossReference.reference,
          text: crossRefVerse.text,
          context: crossRefContext.context?.map(c => `${c.reference}: ${c.text}`)
        },
        connection_data: {
          categories: crossReference.connection.categories,
          strength: crossReference.connection.strength,
          reasoning: crossReference.reasoning,
          explanation: crossReference.connection.explanation
        }
      },
      metadata: {
        prompt_length: prompt.length,
        context_verses_included: (anchorContext.context?.length || 0) + (crossRefContext.context?.length || 0),
        template_used: promptTemplate
      }
    }

  } catch (error) {
    console.error('Error in generateCrossReferencePrompt:', error)
    
    // Re-throw specific errors as-is for testing and debugging
    if (error instanceof Error) {
      if (error.message === 'Cannot determine anchor reference from CrossReference data' ||
          error.message === 'Failed to fetch verse text for anchor or cross-reference') {
        throw error
      }
    }
    
    throw new Error('Failed to generate cross-reference prompt')
  }
}

interface PromptBuildOptions {
  template: string
  anchorVerse: { verse_id: string; text: string }
  crossRefVerse: { verse_id: string; text: string }
  anchorContext: Array<{ reference: string; text: string; position: 'before' | 'after' }>
  crossRefContext: Array<{ reference: string; text: string; position: 'before' | 'after' }>
  connection: { categories: string[]; strength: number; explanation?: string }
  reasoning?: string
  userObservation: string
}

function buildPrompt(options: PromptBuildOptions): string {
  const {
    template,
    anchorVerse,
    crossRefVerse,
    anchorContext,
    crossRefContext,
    connection,
    reasoning,
    userObservation
  } = options

  switch (template) {
    case 'study':
      return buildStudyPrompt(options)
    case 'devotional':
      return buildDevotionalPrompt(options)
    case 'academic':
      return buildAcademicPrompt(options)
    default:
      return buildDefaultPrompt(options)
  }
}

function buildDefaultPrompt(options: PromptBuildOptions): string {
  const {
    anchorVerse,
    crossRefVerse,
    anchorContext,
    crossRefContext,
    connection,
    reasoning,
    userObservation
  } = options

  let prompt = `# Cross-Reference Analysis

## Primary Passage (Anchor)
**${anchorVerse.verse_id}**: "${anchorVerse.text}"

### Context:
`

  // Add anchor context
  const anchorBefore = anchorContext.filter(c => c.position === 'before')
  const anchorAfter = anchorContext.filter(c => c.position === 'after')

  if (anchorBefore.length > 0) {
    prompt += `**Preceding verses:**\n`
    anchorBefore.forEach(c => {
      prompt += `- **${c.reference}**: "${c.text}"\n`
    })
  }

  if (anchorAfter.length > 0) {
    prompt += `**Following verses:**\n`
    anchorAfter.forEach(c => {
      prompt += `- **${c.reference}**: "${c.text}"\n`
    })
  }

  prompt += `
## Cross-Reference Passage
**${crossRefVerse.verse_id}**: "${crossRefVerse.text}"

### Context:
`

  // Add cross-reference context
  const crossRefBefore = crossRefContext.filter(c => c.position === 'before')
  const crossRefAfter = crossRefContext.filter(c => c.position === 'after')

  if (crossRefBefore.length > 0) {
    prompt += `**Preceding verses:**\n`
    crossRefBefore.forEach(c => {
      prompt += `- **${c.reference}**: "${c.text}"\n`
    })
  }

  if (crossRefAfter.length > 0) {
    prompt += `**Following verses:**\n`
    crossRefAfter.forEach(c => {
      prompt += `- **${c.reference}**: "${c.text}"\n`
    })
  }

  prompt += `
## Connection Analysis
- **Connection Categories:** ${connection.categories.join(', ')}
- **Connection Strength:** ${(connection.strength * 100).toFixed(1)}%
- **Connection Type:** ${connection.explanation || 'Not specified'}
`

  if (reasoning) {
    prompt += `- **Detailed Reasoning:** ${reasoning}\n`
  }

  if (userObservation.trim()) {
    prompt += `
## User Observation
"${userObservation.trim()}"
`
  }

  prompt += `
## Analysis Request
Please assess the connection between these two passages, considering:
1. The thematic relationships indicated by the categories: ${connection.categories.join(', ')}
2. The textual and contextual evidence from both passages
3. The historical, literary, or theological significance of this connection. 
${userObservation.trim() ? `4. How this relates to the user's observation above` : ''}

Use this in your own thinking; and then in your response, provide the user with gentle guidance that helps them discover the significance of the connection on their own. If the user's observation aligns with your analysis and doesn't have any significant things missing (or inappropriately included), affirm their response as excellent, provide them with some confirming details they might not have mentioned, and encourage them to move on to other cross references to expand their journey through the Bible. If the user's observation doesn't align with your analysis, provide them with gentle guidance that helps them discover the significance of the connection on their own.`

  return prompt
}

function buildStudyPrompt(options: PromptBuildOptions): string {
  // More structured study format with questions
  const basePrompt = buildDefaultPrompt(options)
  return basePrompt + `

## Study Questions to Consider
1. What are the key themes that connect these passages?
2. How does the historical context of each passage inform their relationship?
3. What theological insights emerge when these verses are read together?
4. How might these cross-references inform personal application or understanding?
5. How does this cross-reference relate to the user's observation above?
Use this in your own thinking; and then in your response, provide the user with gentle guidance that helps them discover the significance of the connection on their own. If the user's observation aligns with your analysis and doesn't have any significant things missing (or inappropriately included), affirm their response as excellent, provide them with some confirming details they might not have mentioned, and encourage them to move on to other cross references to expand their journey through the Bible. If the user's observation doesn't align with your analysis, provide them with gentle guidance that helps them discover the significance of the connection on their own.`
}

function buildDevotionalPrompt(options: PromptBuildOptions): string {
  // More personal, application-focused format
  const {
    anchorVerse,
    crossRefVerse,
    connection,
    reasoning,
    userObservation
  } = options

  return `# Devotional Reflection

## Today's Focus Passages
**Primary**: ${anchorVerse.verse_id} - "${anchorVerse.text}"
**Connected**: ${crossRefVerse.verse_id} - "${crossRefVerse.text}"

## The Connection
These passages are linked through: ${connection.categories.join(', ')}
${reasoning ? `\n**Why they connect**: ${reasoning}` : ''}

${userObservation.trim() ? `## Your Observation\n"${userObservation.trim()}"\n` : ''}

## Reflection Invitation
Consider how these connected verses speak to your life today. What encouragement, challenge, or insight does God offer through seeing these scriptures together? How might this cross-reference deepen your understanding of God's character or His work in your life?
Use this in your own thinking; and then in your response, provide the user with gentle guidance that helps them discover the significance of the connection on their own. If the user's observation aligns with your analysis and doesn't have any significant things missing (or inappropriately included), affirm their response as excellent, provide them with some confirming details they might not have mentioned, and encourage them to move on to other cross references to expand their journey through the Bible. If the user's observation doesn't align with your analysis, provide them with gentle guidance that helps them discover the significance of the connection on their own.`
}

function buildAcademicPrompt(options: PromptBuildOptions): string {
  // More scholarly, detailed analysis format
  const basePrompt = buildDefaultPrompt(options)
  return basePrompt + `

## Academic Analysis Framework
Please provide a scholarly analysis addressing:

### Textual Analysis
- Identify literary devices, structure, and genre considerations

### Historical-Critical Context
- Compare the historical settings of both passages
- Analyze the cultural and social contexts that inform the connection
- Consider the canonical development and inter-textual relationships

### Theological Synthesis
- Trace the theological themes across both passages
- Identify how this cross-reference contributes to broader biblical theology
- Assess the interpretive significance for systematic theology

Use this in your own thinking; and then in your response, provide the user with gentle guidance that helps them discover the significance of the connection on their own. If the user's observation aligns with your analysis and doesn't have any significant things missing (or inappropriately included), affirm their response as excellent, provide them with some confirming details they might not have mentioned, and encourage them to move on to other cross references to expand their journey through the Bible. If the user's observation doesn't align with your analysis, provide them with gentle guidance that helps them discover the significance of the connection on their own.`
}

function extractAnchorFromContext(crossReference: CrossReference): string | null {
  // Try to extract anchor reference from the cross-reference context
  if (crossReference.anchor_ref) {
    return crossReference.anchor_ref
  }
  
  // If context is available, try to infer from it
  if (crossReference.context) {
    const { book, chapter, verse } = crossReference.context
    return `${book}.${chapter}.${verse}`
  }

  // Could not determine anchor reference
  return null
}