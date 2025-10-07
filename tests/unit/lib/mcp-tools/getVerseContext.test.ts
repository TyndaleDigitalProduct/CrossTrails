import { getVerseContext } from '@/lib/mcp-tools/getVerseContext'
import { VerseContextRequest } from '@/lib/types'
import nltClient from '@/lib/bible-api/nltClient'

// Mock the NLT client
jest.mock('@/lib/bible-api/nltClient', () => ({
  getVersesByReference: jest.fn(),
  getVersesByChapter: jest.fn()
}))

const mockNltClient = nltClient as jest.Mocked<typeof nltClient>

describe('getVerseContext', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error during tests to reduce noise
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('basic verse fetching', () => {
    it('should fetch a single verse without context', async () => {
      const mockVerse = {
        verse_number: 16,
        verse_id: 'John.3.16',
        text: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.'
      }

      mockNltClient.getVersesByReference.mockResolvedValue({
        book: 'John',
        chapter: 3,
        verses: [mockVerse]
      })

      const request: VerseContextRequest = {
        references: ['John.3.16'],
        include_context: false
      }

      const result = await getVerseContext(request)

      expect(result.verses).toHaveLength(1)
      expect(result.verses[0]).toEqual(mockVerse)
      expect(result.context).toBeUndefined()
      expect(mockNltClient.getVersesByReference).toHaveBeenCalledWith('John.3.16')
    })

    it('should fetch multiple verses', async () => {
      const mockVerse1 = {
        verse_number: 16,
        verse_id: 'John.3.16',
        text: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.'
      }

      const mockVerse2 = {
        verse_number: 17,
        verse_id: 'John.3.17',
        text: 'God sent his Son into the world not to judge the world, but to save the world through him.'
      }

      mockNltClient.getVersesByReference
        .mockResolvedValueOnce({ book: 'John', chapter: 3, verses: [mockVerse1] })
        .mockResolvedValueOnce({ book: 'John', chapter: 3, verses: [mockVerse2] })

      const request: VerseContextRequest = {
        references: ['John.3.16', 'John.3.17'],
        include_context: false
      }

      const result = await getVerseContext(request)

      expect(result.verses).toHaveLength(2)
      expect(result.verses[0]).toEqual(mockVerse1)
      expect(result.verses[1]).toEqual(mockVerse2)
      expect(result.context).toBeUndefined()
    })
  })

  describe('context fetching', () => {
    it('should include surrounding context when requested', async () => {
      const mockTargetVerse = {
        verse_number: 16,
        verse_id: 'John.3.16',
        text: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.'
      }

      const mockChapterVerses = [
        { verse_number: 14, verse_id: 'John.3.14', text: 'And as Moses lifted up the bronze snake on a pole in the wilderness, so the Son of Man must be lifted up,' },
        { verse_number: 15, verse_id: 'John.3.15', text: 'so that everyone who believes in him will have eternal life.' },
        mockTargetVerse,
        { verse_number: 17, verse_id: 'John.3.17', text: 'God sent his Son into the world not to judge the world, but to save the world through him.' },
        { verse_number: 18, verse_id: 'John.3.18', text: 'There is no judgment against anyone who believes in him. But anyone who does not believe in him has already been judged for not believing in God\'s one and only Son.' }
      ]

      mockNltClient.getVersesByReference.mockResolvedValue({
        book: 'John',
        chapter: 3,
        verses: [mockTargetVerse]
      })

      mockNltClient.getVersesByChapter.mockResolvedValue({
        book: 'John',
        chapter: 3,
        verses: mockChapterVerses
      })

      const request: VerseContextRequest = {
        references: ['John.3.16'],
        include_context: true,
        context_range: 2
      }

      const result = await getVerseContext(request)

      expect(result.verses).toHaveLength(1)
      expect(result.verses[0]).toEqual(mockTargetVerse)
      
      expect(result.context).toBeDefined()
      expect(result.context).toHaveLength(4) // 2 before + 2 after
      
      // Check before context
      expect(result.context![0]).toEqual({
        reference: 'John.3.14',
        text: mockChapterVerses[0].text,
        position: 'before'
      })
      expect(result.context![1]).toEqual({
        reference: 'John.3.15',
        text: mockChapterVerses[1].text,
        position: 'before'
      })

      // Check after context
      expect(result.context![2]).toEqual({
        reference: 'John.3.17',
        text: mockChapterVerses[3].text,
        position: 'after'
      })
      expect(result.context![3]).toEqual({
        reference: 'John.3.18',
        text: mockChapterVerses[4].text,
        position: 'after'
      })
    })

    it('should handle context range that extends beyond chapter boundaries', async () => {
      const mockTargetVerse = {
        verse_number: 2,
        verse_id: 'John.3.2',
        text: 'After dark one evening, he came to speak with Jesus. "Rabbi," he said, "we all know that God has sent you to teach us. Your miraculous signs are evidence that God is with you."'
      }

      const mockChapterVerses = [
        { verse_number: 1, verse_id: 'John.3.1', text: 'There was a man named Nicodemus, a Jewish religious leader who was a Pharisee.' },
        mockTargetVerse,
        { verse_number: 3, verse_id: 'John.3.3', text: 'Jesus replied, "I tell you the truth, unless you are born again, you cannot see the Kingdom of God."' },
        { verse_number: 4, verse_id: 'John.3.4', text: '"What do you mean?" exclaimed Nicodemus. "How can an old man go back into his mother\'s womb and be born again?"' }
      ]

      mockNltClient.getVersesByReference.mockResolvedValue({
        book: 'John',
        chapter: 3,
        verses: [mockTargetVerse]
      })

      mockNltClient.getVersesByChapter.mockResolvedValue({
        book: 'John',
        chapter: 3,
        verses: mockChapterVerses
      })

      const request: VerseContextRequest = {
        references: ['John.3.2'],
        include_context: true,
        context_range: 3 // Should only get verse 1 before and verses 3-4 after
      }

      const result = await getVerseContext(request)

      expect(result.context).toHaveLength(3) // 1 before + 2 after
      expect(result.context![0].position).toBe('before')
      expect(result.context![0].reference).toBe('John.3.1')
      expect(result.context![1].position).toBe('after')
      expect(result.context![1].reference).toBe('John.3.3')
      expect(result.context![2].position).toBe('after')
      expect(result.context![2].reference).toBe('John.3.4')
    })
  })

  describe('error handling', () => {
    it('should handle invalid reference format', async () => {
      const request: VerseContextRequest = {
        references: ['invalid-reference'],
        include_context: false
      }

      await expect(getVerseContext(request)).rejects.toThrow('Failed to fetch verse context')
    })

    it('should continue processing other verses if one fails', async () => {
      const mockValidVerse = {
        verse_number: 17,
        verse_id: 'John.3.17',
        text: 'God sent his Son into the world not to judge the world, but to save the world through him.'
      }

      mockNltClient.getVersesByReference
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({ book: 'John', chapter: 3, verses: [mockValidVerse] })

      const request: VerseContextRequest = {
        references: ['John.3.16', 'John.3.17'],
        include_context: false
      }

      const result = await getVerseContext(request)

      expect(result.verses).toHaveLength(1)
      expect(result.verses[0]).toEqual(mockValidVerse)
    })

    it('should use fallback method for context if chapter fetch fails', async () => {
      const mockTargetVerse = {
        verse_number: 16,
        verse_id: 'John.3.16',
        text: 'For this is how God loved the world...'
      }

      const mockBeforeVerse = {
        verse_number: 15,
        verse_id: 'John.3.15',
        text: 'so that everyone who believes in him will have eternal life.'
      }

      const mockAfterVerse = {
        verse_number: 17,
        verse_id: 'John.3.17',
        text: 'God sent his Son into the world...'
      }

      mockNltClient.getVersesByReference
        .mockResolvedValueOnce({ book: 'John', chapter: 3, verses: [mockTargetVerse] })
        .mockResolvedValueOnce({ book: 'John', chapter: 3, verses: [mockBeforeVerse] })
        .mockResolvedValueOnce({ book: 'John', chapter: 3, verses: [mockAfterVerse] })

      mockNltClient.getVersesByChapter.mockRejectedValue(new Error('Chapter fetch failed'))

      const request: VerseContextRequest = {
        references: ['John.3.16'],
        include_context: true,
        context_range: 1
      }

      const result = await getVerseContext(request)

      expect(result.verses).toHaveLength(1)
      expect(result.context).toHaveLength(2) // 1 before + 1 after
      expect(result.context![0].reference).toBe('John.3.15')
      expect(result.context![0].position).toBe('before')
      expect(result.context![1].reference).toBe('John.3.17')
      expect(result.context![1].position).toBe('after')
    })
  })
})