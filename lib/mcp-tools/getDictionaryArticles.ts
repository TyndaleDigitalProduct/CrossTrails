/**
 * MCP Tool: Get Dictionary Articles (Provisional)
 * Fetches dictionary articles for key terms in passages
 * This tool is marked as provisional in the comprehensive plan
 */

export interface DictionaryRequest {
  verses: string[]
  concepts?: string[]
  max_articles?: number
}

export interface DictionaryResponse {
  articles: Array<{
    title: string
    summary: string
    content: string
    relevance_to_verses: Array<{
      verse: string
      relevance_score: number
      key_terms: string[]
    }>
  }>
}

export async function getDictionaryArticles(
  request: DictionaryRequest
): Promise<DictionaryResponse> {
  const { verses, concepts = [], max_articles = 3 } = request

  try {
    // Load dictionary data (in production, this would come from processed JSON)
    const dictionaryData = await loadDictionaryData()

    // Extract concepts from verses if not provided
    const targetConcepts = concepts.length > 0 ? concepts : await extractConceptsFromVerses(verses)

    const articles = []

    for (const concept of targetConcepts) {
      const article = dictionaryData.articles[concept]
      if (article) {
        const relevanceData = calculateRelevanceToVerses(article, verses)

        articles.push({
          title: article.title,
          summary: article.summary,
          content: article.content,
          relevance_to_verses: relevanceData
        })
      }
    }

    // Sort by average relevance score
    articles.sort((a, b) => {
      const avgA = a.relevance_to_verses.reduce((sum, rel) => sum + rel.relevance_score, 0) / a.relevance_to_verses.length
      const avgB = b.relevance_to_verses.reduce((sum, rel) => sum + rel.relevance_score, 0) / b.relevance_to_verses.length
      return avgB - avgA
    })

    const limitedArticles = articles.slice(0, max_articles)

    return { articles: limitedArticles }

  } catch (error) {
    console.error('Error in getDictionaryArticles:', error)
    throw new Error('Failed to fetch dictionary articles')
  }
}

async function loadDictionaryData(): Promise<any> {
  // For demo purposes, return mock dictionary data
  // In production, this would load from the processed dictionary JSON
  return {
    articles: {
      'King': {
        id: 'TOBD_King',
        title: 'King',
        summary: 'In biblical usage, king refers to both earthly rulers and the ultimate divine King',
        content: 'In the biblical world, kings were seen as representatives of divine authority on earth. The concept of kingship in Scripture encompasses both human rulers like David and Herod, and ultimately points to the divine kingship of God and the Messianic King, Jesus Christ. The wise men\'s search for the "newborn king of the Jews" reflects their understanding of Jesus\' royal nature.',
        verse_refs: ['Matthew.2.2', '1Sam.8.5', 'Psa.2.6', 'Rev.19.16'],
        related_concepts: ['Messiah', 'David', 'Kingdom_of_God'],
        word_count: 487
      },
      'Star': {
        id: 'TOBD_Star',
        title: 'Star',
        summary: 'Stars in biblical literature often symbolize divine guidance and messianic hope',
        content: 'Stars held deep symbolic meaning in ancient Near Eastern cultures and biblical literature. They represented divine guidance, cosmic order, and messianic hope. The "star" that led the wise men connects to Balaam\'s prophecy in Numbers 24:17 about a "star rising from Jacob," understood messianically. Stars also represented stability, divine promise, and celestial glory.',
        verse_refs: ['Matthew.2.2', 'Num.24.17', 'Rev.22.16', 'Dan.12.3'],
        related_concepts: ['Prophecy', 'Messiah', 'Light'],
        word_count: 523
      },
      'Bethlehem': {
        id: 'TOBD_Bethlehem',
        title: 'Bethlehem',
        summary: 'City of David\'s birth and prophesied birthplace of the Messiah',
        content: 'Bethlehem, meaning "house of bread," was a small town in Judea, approximately six miles south of Jerusalem. Despite its modest size, Bethlehem held great significance as the birthplace of King David and, as prophesied by Micah, the birthplace of the Messiah. The city\'s connection to David made it symbolically important for messianic expectations.',
        verse_refs: ['Matthew.2.1', 'Matthew.2.5-6', 'Mic.5.2', '1Sam.17.12'],
        related_concepts: ['David', 'Messiah', 'Prophecy'],
        word_count: 398
      },
      'Prophecy': {
        id: 'TOBD_Prophecy',
        title: 'Prophecy',
        summary: 'Divine revelation about future events, especially regarding the Messiah',
        content: 'Biblical prophecy encompasses God\'s revelation of future events, moral instruction, and messianic promises. In Matthew\'s birth narrative, multiple prophecies find fulfillment: the Messiah\'s birth in Bethlehem (Micah 5:2), the star rising from Jacob (Numbers 24:17), and the coming righteous ruler (Jeremiah 23:5). These prophecies demonstrate God\'s sovereign plan unfolding through history.',
        verse_refs: ['Matthew.2.5-6', 'Mic.5.2', 'Num.24.17', 'Jer.23.5'],
        related_concepts: ['Messiah', 'Fulfillment', 'Divine_Plan'],
        word_count: 612
      }
    },
    verse_to_articles: {
      'Matthew.2.1': ['Bethlehem', 'King'],
      'Matthew.2.2': ['King', 'Star'],
      'Matthew.2.5': ['Bethlehem', 'Prophecy'],
      'Matthew.2.6': ['Bethlehem', 'Prophecy']
    }
  }
}

async function extractConceptsFromVerses(verses: string[]): Promise<string[]> {
  // For demo purposes, extract concepts based on verse content
  // In production, this would be more sophisticated NLP analysis
  const conceptsByVerse: Record<string, string[]> = {
    'Matthew.2.1': ['Bethlehem', 'King'],
    'Matthew.2.2': ['King', 'Star'],
    'Matthew.2.5': ['Bethlehem', 'Prophecy'],
    'Matthew.2.6': ['Bethlehem', 'Prophecy']
  }

  const allConcepts = new Set<string>()

  for (const verse of verses) {
    const verseConcepts = conceptsByVerse[verse] || []
    verseConcepts.forEach(concept => allConcepts.add(concept))
  }

  return Array.from(allConcepts)
}

function calculateRelevanceToVerses(article: any, verses: string[]) {
  return verses.map(verse => {
    // Calculate relevance score
    let score = 0.1 // Base score

    // Check if article is directly related to this verse
    if (article.verse_refs.includes(verse)) {
      score += 0.6
    }

    // Check for thematic relevance based on verse content
    // This is simplified - in production would be more sophisticated
    if (verse.includes('Matthew.2')) {
      if (article.title === 'King' || article.title === 'Star' || article.title === 'Bethlehem') {
        score += 0.3
      }
    }

    // Extract key terms for this verse
    const keyTerms = extractKeyTermsForVerse(verse, article)

    return {
      verse,
      relevance_score: Math.min(score, 1.0),
      key_terms: keyTerms
    }
  })
}

function extractKeyTermsForVerse(verse: string, article: any): string[] {
  // Simplified key term extraction
  // In production, this would analyze the actual verse text
  const termsByVerse: Record<string, string[]> = {
    'Matthew.2.1': ['Bethlehem', 'Judea', 'King Herod', 'wise men'],
    'Matthew.2.2': ['king', 'Jews', 'star', 'worship'],
    'Matthew.2.5': ['Bethlehem', 'Judea', 'prophet'],
    'Matthew.2.6': ['Bethlehem', 'Judah', 'ruler', 'shepherd']
  }

  return termsByVerse[verse] || []
}