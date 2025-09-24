/**
 * MCP Tool: Get Study Notes (Provisional)
 * Fetches relevant study notes for selected verses
 * This tool is marked as provisional in the comprehensive plan
 */

export interface StudyNotesRequest {
  verses: string[]
  max_notes?: number
  themes?: string[]
}

export interface StudyNotesResponse {
  notes: Array<{
    verse: string
    content: string
    summary: string
    themes: string[]
    relevance_score: number
  }>
}

export async function getStudyNotes(
  request: StudyNotesRequest
): Promise<StudyNotesResponse> {
  const { verses, max_notes = 5, themes = [] } = request

  try {
    // Load study notes data (in production, this would come from processed JSON)
    const studyNotesData = await loadStudyNotesData()

    const notes = []

    for (const verse of verses) {
      const verseNotes = studyNotesData[verse]
      if (verseNotes) {
        for (const note of verseNotes.notes) {
          // Filter by themes if specified
          if (themes.length > 0) {
            const themeMatch = themes.some(theme =>
              note.themes.includes(theme)
            )
            if (!themeMatch) continue
          }

          notes.push({
            verse,
            content: note.content,
            summary: note.summary,
            themes: note.themes,
            relevance_score: calculateRelevanceScore(note, themes)
          })
        }
      }
    }

    // Sort by relevance and limit
    notes.sort((a, b) => b.relevance_score - a.relevance_score)
    const limitedNotes = notes.slice(0, max_notes)

    return { notes: limitedNotes }

  } catch (error) {
    console.error('Error in getStudyNotes:', error)
    throw new Error('Failed to fetch study notes')
  }
}

async function loadStudyNotesData(): Promise<Record<string, any>> {
  // For demo purposes, return mock study notes data
  // In production, this would load from the processed study notes JSON
  return {
    'Matthew.2.1': {
      notes: [{
        id: 'TOSN_Matthew_2_1',
        content: 'The birth of Jesus in Bethlehem during Herod\'s reign establishes both the historical context and prophetic fulfillment. Bethlehem, though small, was significant as David\'s birthplace and the prophesied location of the Messiah\'s birth.',
        summary: 'Historical and prophetic significance of Jesus\' birth in Bethlehem',
        themes: ['birth_narrative', 'prophecy_fulfillment', 'historical_context'],
        word_count: 156
      }]
    },
    'Matthew.2.2': {
      notes: [{
        id: 'TOSN_Matthew_2_2',
        content: 'The wise men\'s question reveals their understanding of Jesus as the "king of the Jews." Their reference to "his star" connects to Old Testament prophecies about a ruler emerging from Israel, particularly Numbers 24:17.',
        summary: 'The wise men recognize Jesus\' royal identity through the star',
        themes: ['kingship', 'gentile_recognition', 'star_symbolism'],
        word_count: 134
      }]
    },
    'Matthew.2.6': {
      notes: [{
        id: 'TOSN_Matthew_2_6',
        content: 'This quotation from Micah 5:2 demonstrates Matthew\'s pattern of showing how Jesus fulfills Old Testament prophecy. The modification of "least" to "not least" emphasizes how God\'s plan elevates the humble and unexpected.',
        summary: 'Micah prophecy shows God\'s plan through the humble',
        themes: ['prophecy_fulfillment', 'divine_irony', 'humility_exaltation'],
        word_count: 178
      }]
    }
  }
}

function calculateRelevanceScore(note: any, themes: string[]): number {
  let score = 0.5 // Base score

  // Boost score for theme matches
  if (themes.length > 0) {
    const matches = themes.filter(theme => note.themes.includes(theme)).length
    score += (matches / themes.length) * 0.4
  }

  // Boost score based on note quality indicators
  if (note.word_count > 100) score += 0.1
  if (note.themes.length > 2) score += 0.1

  return Math.min(score, 1.0) // Cap at 1.0
}