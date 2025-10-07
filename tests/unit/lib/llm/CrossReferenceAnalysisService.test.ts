import { CrossReferenceAnalysisService } from '@/lib/llm/CrossReferenceAnalysisService'
import { LLMClientFactory } from '@/lib/llm/LLMClientFactory'
import { generateCrossReferencePrompt } from '@/lib/mcp-tools/generateCrossReferencePrompt'
import { CrossReference, LLMClientConfig } from '@/lib/types'

// Mock the dependencies
jest.mock('@/lib/mcp-tools/generateCrossReferencePrompt')
jest.mock('@/lib/utils/auth')

const mockGenerateCrossReferencePrompt = generateCrossReferencePrompt as jest.MockedFunction<typeof generateCrossReferencePrompt>

// Mock LLM Provider for testing
class MockLLMProvider {
  name = 'Mock Provider'
  supportedModels = ['mock-model']
  supportsStreaming = true

  async chat(request: any) {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1))
    
    return {
      content: 'Mock analysis response',
      model: 'mock-model',
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      },
      finish_reason: 'stop' as const,
      metadata: { provider: 'mock' }
    }
  }

  async *stream(request: any) {
    const words = ['Mock', 'streaming', 'response']
    for (let i = 0; i < words.length; i++) {
      yield {
        content: words[i] + (i < words.length - 1 ? ' ' : ''),
        done: i === words.length - 1,
        model: 'mock-model',
        usage: i === words.length - 1 ? {
          prompt_tokens: 100,
          completion_tokens: 3,
          total_tokens: 103
        } : undefined
      }
    }
  }

  async healthCheck() {
    return true
  }
}

describe('CrossReferenceAnalysisService', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    LLMClientFactory.getInstance().clearCache()
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
    reasoning: 'These verses both highlight the central Christian message of God\'s love expressed through Christ\'s sacrificial death for humanity.'
  }

  const mockPromptResponse = {
    prompt: 'Generated analysis prompt...',
    sources: {
      anchor_verse: {
        reference: 'John.3.16',
        text: 'For God so loved the world...',
        context: ['John.3.15: context before', 'John.3.17: context after']
      },
      cross_reference: {
        reference: 'Romans.5.8',
        text: 'But God demonstrates his own love...',
        context: ['Romans.5.7: context before', 'Romans.5.9: context after']
      },
      connection_data: {
        categories: ['love', 'salvation', 'sacrifice'],
        strength: 0.92,
        reasoning: 'Test reasoning'
      }
    },
    metadata: {
      prompt_length: 1000,
      context_verses_included: 4,
      template_used: 'default'
    }
  }

  describe('analyzeCrossReference', () => {
    beforeEach(() => {
      mockGenerateCrossReferencePrompt.mockResolvedValue(mockPromptResponse)
    })

    it('should analyze cross-reference with default configuration', async () => {
      // Mock the factory to return our mock provider
      const mockProvider = new MockLLMProvider()
      jest.spyOn(LLMClientFactory.prototype, 'getDefaultProvider').mockResolvedValue(mockProvider as any)

      const service = new CrossReferenceAnalysisService()
      const result = await service.analyzeCrossReference({
        crossReference: mockCrossReference,
        userObservation: 'Test observation'
      })

      expect(result.analysis).toBe('Mock analysis response')
      expect(result.prompt_used).toBe('Generated analysis prompt...')
      expect(result.sources).toEqual(mockPromptResponse.sources)
      expect(result.llm_metadata.provider).toBe('Mock Provider')
      expect(result.llm_metadata.model).toBe('mock-model')
      expect(result.llm_metadata.response_time_ms).toBeGreaterThan(0)

      expect(mockGenerateCrossReferencePrompt).toHaveBeenCalledWith({
        crossReference: mockCrossReference,
        userObservation: 'Test observation',
        contextRange: 2,
        promptTemplate: 'default'
      })
    })

    it('should analyze with custom configuration', async () => {
      const mockProvider = new MockLLMProvider()
      jest.spyOn(LLMClientFactory.prototype, 'getProvider').mockResolvedValue(mockProvider as any)

      const config: LLMClientConfig = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
        max_tokens: 2000
      }

      const service = new CrossReferenceAnalysisService(config)
      const result = await service.analyzeCrossReference({
        crossReference: mockCrossReference,
        analysisType: 'academic',
        contextRange: 3
      })

      expect(result.analysis).toBe('Mock analysis response')
      expect(mockGenerateCrossReferencePrompt).toHaveBeenCalledWith({
        crossReference: mockCrossReference,
        userObservation: undefined,
        contextRange: 3,
        promptTemplate: 'academic'
      })
    })

    it('should handle different analysis types', async () => {
      const mockProvider = new MockLLMProvider()
      jest.spyOn(LLMClientFactory.prototype, 'getDefaultProvider').mockResolvedValue(mockProvider as any)

      const service = new CrossReferenceAnalysisService()

      // Test study template
      await service.analyzeCrossReference({
        crossReference: mockCrossReference,
        analysisType: 'study'
      })

      expect(mockGenerateCrossReferencePrompt).toHaveBeenCalledWith(
        expect.objectContaining({ promptTemplate: 'study' })
      )
    })

    it('should handle errors gracefully', async () => {
      mockGenerateCrossReferencePrompt.mockRejectedValue(new Error('Prompt generation failed'))

      const service = new CrossReferenceAnalysisService()
      
      await expect(service.analyzeCrossReference({
        crossReference: mockCrossReference
      })).rejects.toThrow('Analysis failed: Prompt generation failed')
    })
  })

  describe('analyzeCrossReferenceStream', () => {
    beforeEach(() => {
      mockGenerateCrossReferencePrompt.mockResolvedValue(mockPromptResponse)
    })

    it('should stream analysis response', async () => {
      const mockProvider = new MockLLMProvider()
      jest.spyOn(LLMClientFactory.prototype, 'getDefaultProvider').mockResolvedValue(mockProvider as any)

      const service = new CrossReferenceAnalysisService()
      const chunks = []

      for await (const chunk of service.analyzeCrossReferenceStream({
        crossReference: mockCrossReference
      })) {
        chunks.push(chunk)
      }

      expect(chunks).toHaveLength(3)
      expect(chunks[0].content).toBe('Mock ')
      expect(chunks[0].done).toBe(false)
      expect(chunks[2].done).toBe(true)
      expect(chunks[2].metadata).toBeDefined()
      expect(chunks[2].metadata.prompt_used).toBe('Generated analysis prompt...')
    })

    it('should handle streaming not supported', async () => {
      const mockProvider = {
        ...new MockLLMProvider(),
        supportsStreaming: false,
        stream: undefined
      }
      jest.spyOn(LLMClientFactory.prototype, 'getDefaultProvider').mockResolvedValue(mockProvider as any)

      const service = new CrossReferenceAnalysisService()
      
      await expect(async () => {
        for await (const chunk of service.analyzeCrossReferenceStream({
          crossReference: mockCrossReference
        })) {
          // Should not reach here
        }
      }).rejects.toThrow('Streaming not supported')
    })
  })

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const mockProvider = new MockLLMProvider()
      jest.spyOn(LLMClientFactory.prototype, 'getDefaultProvider').mockResolvedValue(mockProvider as any)

      const service = new CrossReferenceAnalysisService()
      const result = await service.testConnection()

      expect(result.success).toBe(true)
      expect(result.provider).toBe('Mock Provider')
      expect(result.model).toBe('mock-model')
    })

    it('should handle connection failure', async () => {
      const mockProvider = {
        ...new MockLLMProvider(),
        healthCheck: jest.fn().mockResolvedValue(false)
      }
      jest.spyOn(LLMClientFactory.prototype, 'getDefaultProvider').mockResolvedValue(mockProvider as any)

      const service = new CrossReferenceAnalysisService()
      const result = await service.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Health check failed')
    })

    it('should handle connection error', async () => {
      jest.spyOn(LLMClientFactory.prototype, 'getDefaultProvider').mockRejectedValue(new Error('Provider failed'))

      const service = new CrossReferenceAnalysisService()
      const result = await service.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Provider failed')
    })
  })

  describe('system prompts', () => {
    it('should generate appropriate system prompts for different analysis types', async () => {
      const mockProvider = new MockLLMProvider()
      const chatSpy = jest.spyOn(mockProvider, 'chat')
      jest.spyOn(LLMClientFactory.prototype, 'getDefaultProvider').mockResolvedValue(mockProvider as any)

      const service = new CrossReferenceAnalysisService()

      // Test default prompt
      await service.analyzeCrossReference({
        crossReference: mockCrossReference,
        analysisType: 'default'
      })

      expect(chatSpy).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('biblical scholar')
          })
        ])
      }))

      // Test academic prompt
      await service.analyzeCrossReference({
        crossReference: mockCrossReference,
        analysisType: 'academic'
      })

      expect(chatSpy).toHaveBeenLastCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('scholarly analysis')
          })
        ])
      }))
    })
  })
})