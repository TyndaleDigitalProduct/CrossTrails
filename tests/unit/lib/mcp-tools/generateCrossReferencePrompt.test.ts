import { generateCrossReferencePrompt } from '@/lib/mcp-tools/generateCrossReferencePrompt'
import { getVerseContext } from '@/lib/mcp-tools/getVerseContext'
import { CrossReferencePromptRequest, CrossReference } from '@/lib/types'

// Mock the getVerseContext function
jest.mock('@/lib/mcp-tools/getVerseContext')
const mockGetVerseContext = getVerseContext as jest.MockedFunction<typeof getVerseContext>

describe('generateCrossReferencePrompt', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error during tests to reduce noise
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  const mockCrossReference: CrossReference = {
    reference: 'Romans.5.8',
    display_ref: 'Romans 5:8',
    text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.',
    anchor_ref: 'John.3.16',
    connection: {
      categories: ['love', 'salvation', 'sacrifice'],
      strength: 0.92,
      type: 'thematic_echo',
      explanation: 'Both passages emphasize Gods love demonstrated through Christ\'s sacrifice'
    },
    reasoning: 'These verses both highlight the central Christian message of God\'s love expressed through Christ\'s sacrificial death for humanity, showing the universal scope of divine love for sinners.'
  }

  const mockAnchorContext = {
    verses: [{
      verse_number: 16,
      verse_id: 'John.3.16',
      text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
    }],
    context: [
      {
        reference: 'John.3.15',
        text: 'that everyone who believes may have eternal life in him.',
        position: 'before' as const
      },
      {
        reference: 'John.3.17',
        text: 'For God did not send his Son into the world to condemn the world, but to save the world through him.',
        position: 'after' as const
      }
    ]
  }

  const mockCrossRefContext = {
    verses: [{
      verse_number: 8,
      verse_id: 'Romans.5.8',
      text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.'
    }],
    context: [
      {
        reference: 'Romans.5.7',
        text: 'Very rarely will anyone die for a righteous person, though for a good person someone might possibly dare to die.',
        position: 'before' as const
      },
      {
        reference: 'Romans.5.9',
        text: 'Since we have now been justified by his blood, how much more shall we be saved from Gods wrath through him!',
        position: 'after' as const
      }
    ]
  }

  describe('default prompt template', () => {
    it('should generate a comprehensive default prompt', async () => {
      mockGetVerseContext
        .mockResolvedValueOnce(mockAnchorContext)
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference,
        userObservation: 'I notice both verses talk about love and sacrifice',
        contextRange: 1
      }

      const result = await generateCrossReferencePrompt(request)

      expect(result.prompt).toContain('Cross-Reference Analysis')
      expect(result.prompt).toContain('John.3.16')
      expect(result.prompt).toContain('Romans.5.8')
      expect(result.prompt).toContain('love, salvation, sacrifice')
      expect(result.prompt).toContain('I notice both verses talk about love and sacrifice')
      
      expect(result.sources.anchor_verse.reference).toBe('John.3.16')
      expect(result.sources.cross_reference.reference).toBe('Romans.5.8')
      expect(result.sources.connection_data.strength).toBe(0.92)
      
      expect(result.metadata.template_used).toBe('default')
      expect(result.metadata.context_verses_included).toBe(4) // 2 + 2
    })

    it('should handle missing user observation', async () => {
      mockGetVerseContext
        .mockResolvedValueOnce(mockAnchorContext)
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference
      }

      const result = await generateCrossReferencePrompt(request)

      expect(result.prompt).not.toContain('User Observation')
      expect(result.prompt).not.toContain('4. How this relates to the user\'s observation')
      expect(result.metadata.template_used).toBe('default')
    })
  })

  describe('study template', () => {
    it('should generate study-focused prompt with questions', async () => {
      mockGetVerseContext
        .mockResolvedValueOnce(mockAnchorContext)
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference,
        promptTemplate: 'study'
      }

      const result = await generateCrossReferencePrompt(request)

      expect(result.prompt).toContain('Study Questions to Consider')
      expect(result.prompt).toContain('What are the key themes')
      expect(result.prompt).toContain('historical context')
      expect(result.prompt).toContain('theological insights')
      expect(result.metadata.template_used).toBe('study')
    })
  })

  describe('devotional template', () => {
    it('should generate personal, application-focused prompt', async () => {
      mockGetVerseContext
        .mockResolvedValueOnce(mockAnchorContext)
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference,
        userObservation: 'This speaks to me about Gods unconditional love',
        promptTemplate: 'devotional'
      }

      const result = await generateCrossReferencePrompt(request)

      expect(result.prompt).toContain('Devotional Reflection')
      expect(result.prompt).toContain('Today\'s Focus Passages')
      expect(result.prompt).toContain('Reflection Invitation')
      expect(result.prompt).toContain('This speaks to me about Gods unconditional love')
      expect(result.metadata.template_used).toBe('devotional')
    })
  })

  describe('academic template', () => {
    it('should generate scholarly analysis prompt', async () => {
      mockGetVerseContext
        .mockResolvedValueOnce(mockAnchorContext)
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference,
        promptTemplate: 'academic'
      }

      const result = await generateCrossReferencePrompt(request)

      expect(result.prompt).toContain('Academic Analysis Framework')
      expect(result.prompt).toContain('Textual Analysis')
      expect(result.prompt).toContain('Historical-Critical Context')
      expect(result.prompt).toContain('Theological Synthesis')
      expect(result.prompt).toContain('Scholarly Sources')
      expect(result.metadata.template_used).toBe('academic')
    })
  })

  describe('context handling', () => {
    it('should handle cross-reference with context field', async () => {
      const crossRefWithContext: CrossReference = {
        ...mockCrossReference,
        anchor_ref: undefined, // Remove explicit anchor_ref
        context: {
          book: 'John',
          chapter: 3,
          verse: 16
        }
      }

      mockGetVerseContext
        .mockResolvedValueOnce(mockAnchorContext)
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: crossRefWithContext
      }

      const result = await generateCrossReferencePrompt(request)

      expect(result.sources.anchor_verse.reference).toBe('John.3.16')
    })

    it('should handle varying context ranges', async () => {
      const extendedAnchorContext = {
        ...mockAnchorContext,
        context: [
          ...mockAnchorContext.context!,
          {
            reference: 'John.3.14',
            text: 'Just as Moses lifted up the snake in the wilderness...',
            position: 'before' as const
          },
          {
            reference: 'John.3.18',
            text: 'Whoever believes in him is not condemned...',
            position: 'after' as const
          }
        ]
      }

      mockGetVerseContext
        .mockResolvedValueOnce(extendedAnchorContext)
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference,
        contextRange: 2
      }

      const result = await generateCrossReferencePrompt(request)

      expect(result.metadata.context_verses_included).toBe(6) // 4 + 2
      expect(result.sources.anchor_verse.context).toHaveLength(4)
    })
  })

  describe('error handling', () => {
    it('should throw error when anchor reference cannot be determined', async () => {
      const invalidCrossRef: CrossReference = {
        ...mockCrossReference,
        anchor_ref: undefined,
        context: undefined
      }

      const request: CrossReferencePromptRequest = {
        crossReference: invalidCrossRef
      }

      await expect(generateCrossReferencePrompt(request)).rejects.toThrow(
        'Cannot determine anchor reference from CrossReference data'
      )
    })

    it('should throw error when verse context fetch fails', async () => {
      mockGetVerseContext
        .mockResolvedValueOnce({ verses: [], context: [] })
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference
      }

      await expect(generateCrossReferencePrompt(request)).rejects.toThrow(
        'Failed to fetch verse text for anchor or cross-reference'
      )
    })

    it('should handle getVerseContext errors gracefully', async () => {
      mockGetVerseContext.mockRejectedValue(new Error('API error'))

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference
      }

      await expect(generateCrossReferencePrompt(request)).rejects.toThrow(
        'Failed to generate cross-reference prompt'
      )
    })
  })

  describe('prompt structure validation', () => {
    it('should include all required sections in default template', async () => {
      mockGetVerseContext
        .mockResolvedValueOnce(mockAnchorContext)
        .mockResolvedValueOnce(mockCrossRefContext)

      const request: CrossReferencePromptRequest = {
        crossReference: mockCrossReference,
        userObservation: 'Test observation'
      }

      const result = await generateCrossReferencePrompt(request)

      // Check for key sections
      expect(result.prompt).toMatch(/# Cross-Reference Analysis/)
      expect(result.prompt).toMatch(/## Primary Passage \(Anchor\)/)
      expect(result.prompt).toMatch(/## Cross-Reference Passage/)
      expect(result.prompt).toMatch(/## Connection Analysis/)
      expect(result.prompt).toMatch(/## User Observation/)
      expect(result.prompt).toMatch(/## Analysis Request/)
      
      // Check that connection details are included
      expect(result.prompt).toContain('92.0%') // Strength percentage
      expect(result.prompt).toContain('love, salvation, sacrifice') // Categories
    })
  })
})