import { 
  CrossReferenceAnalysisRequest, 
  CrossReferenceAnalysisResponse, 
  LLMClientConfig, 
  LLMMessage 
} from '@/lib/types'
import { generateCrossReferencePrompt } from '@/lib/mcp-tools/generateCrossReferencePrompt'
import { llmClientFactory } from './LLMClientFactory'

/**
 * Cross-Reference Analysis Service
 * Combines prompt generation with LLM processing for cross-reference analysis
 */
export class CrossReferenceAnalysisService {
  private config?: LLMClientConfig

  constructor(config?: LLMClientConfig) {
    this.config = config
  }

  /**
   * Analyze a cross-reference using LLM with context-aware prompts
   */
  async analyzeCrossReference(request: CrossReferenceAnalysisRequest): Promise<CrossReferenceAnalysisResponse> {
    const startTime = Date.now()

    try {
      // Step 1: Generate comprehensive prompt with verse context
      const promptResponse = await generateCrossReferencePrompt({
        crossReference: request.crossReference,
        userObservation: request.userObservation,
        contextRange: request.contextRange || 2,
        promptTemplate: request.analysisType || 'default'
      })

      // Step 2: Get LLM provider
      const provider = this.config 
        ? await llmClientFactory.getProvider(this.config)
        : await llmClientFactory.getDefaultProvider()

      // Step 3: Prepare LLM messages
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(request.analysisType || 'default')
        },
        {
          role: 'user',
          content: promptResponse.prompt
        }
      ]

      // Step 4: Get LLM response
      const llmResponse = await provider.chat({
        messages,
        temperature: 0.7,
        max_tokens: 1500
      })

      const responseTime = Date.now() - startTime

      // Step 5: Return structured response
      return {
        analysis: llmResponse.content,
        prompt_used: promptResponse.prompt,
        sources: promptResponse.sources,
        llm_metadata: {
          model: llmResponse.model,
          provider: provider.name,
          usage: llmResponse.usage,
          response_time_ms: responseTime
        }
      }

    } catch (error) {
      console.error('Cross-reference analysis failed:', error)
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Analyze with streaming response
   */
  async *analyzeCrossReferenceStream(request: CrossReferenceAnalysisRequest): AsyncGenerator<{
    content: string
    done: boolean
    metadata?: any
  }> {
    try {
      // Generate prompt
      const promptResponse = await generateCrossReferencePrompt({
        crossReference: request.crossReference,
        userObservation: request.userObservation,
        contextRange: request.contextRange || 2,
        promptTemplate: request.analysisType || 'default'
      })

      // Get provider
      const provider = this.config 
        ? await llmClientFactory.getProvider(this.config)
        : await llmClientFactory.getDefaultProvider()

      if (!provider.supportsStreaming || !provider.stream) {
        throw new Error('Streaming not supported by current provider')
      }

      // Prepare messages
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(request.analysisType || 'default')
        },
        {
          role: 'user',
          content: promptResponse.prompt
        }
      ]

      // Stream response
      let fullContent = ''
      for await (const chunk of provider.stream({ messages })) {
        fullContent += chunk.content
        
        yield {
          content: chunk.content,
          done: chunk.done,
          metadata: chunk.done ? {
            prompt_used: promptResponse.prompt,
            sources: promptResponse.sources,
            model: chunk.model,
            provider: provider.name,
            usage: chunk.usage
          } : undefined
        }
      }

    } catch (error) {
      console.error('Streaming analysis failed:', error)
      throw new Error(`Streaming analysis failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Test the LLM connection and configuration
   */
  async testConnection(): Promise<{ success: boolean; provider: string; model: string; error?: string }> {
    try {
      const provider = this.config 
        ? await llmClientFactory.getProvider(this.config)
        : await llmClientFactory.getDefaultProvider()

      const isHealthy = await provider.healthCheck()
      
      if (!isHealthy) {
        return {
          success: false,
          provider: provider.name,
          model: this.config?.model || 'default',
          error: 'Health check failed'
        }
      }

      // Try a simple test request
      const testResponse = await provider.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })

      return {
        success: true,
        provider: provider.name,
        model: testResponse.model
      }

    } catch (error) {
      return {
        success: false,
        provider: this.config?.provider || 'unknown',
        model: this.config?.model || 'unknown',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private getSystemPrompt(analysisType: string): string {
    const basePrompt = `You are a caring and knowledgable Christian scholar and theologian with detailed expertise in the Bible. You believe deeply in the interconnectedness of Scripture and want to help people see and understand how individual verses and passages relate to one another, creating a meaningful whole that illuminates the story God wants humanity to understand through the Bible. You help people understand how cross-references work, exploring connections between biblical passages by providing insightful, accurate, and helpful guidance to help users see the connections and their significance clearly.`

    switch (analysisType) {
      case 'study':
        return basePrompt + ` Focus on providing educational insights suitable for Bible study groups. Include historical context, literary analysis, and practical applications. Structure your response clearly with headings and key points.`

      case 'devotional':
        return basePrompt + ` Focus on personal, spiritual insights that encourage faith and practical Christian living. Be warm, encouraging, and application-focused while maintaining biblical accuracy.`

      case 'academic':
        return basePrompt + ` Provide scholarly analysis with attention to original languages, historical-critical methods, and theological implications. Reference scholarly consensus and note any significant interpretive debates.`

      default:
        return basePrompt + ` Provide balanced analysis that combines scholarly insight with practical application. Make complex theological concepts accessible to a general audience, and lead users to their own conclusions rather than telling them the correct answers directly.`
    }
  }
}

// Export convenience functions
export async function analyzeCrossReference(request: CrossReferenceAnalysisRequest): Promise<CrossReferenceAnalysisResponse> {
  const service = new CrossReferenceAnalysisService()
  return service.analyzeCrossReference(request)
}

export async function analyzeCrossReferenceWithConfig(
  request: CrossReferenceAnalysisRequest, 
  config: LLMClientConfig
): Promise<CrossReferenceAnalysisResponse> {
  const service = new CrossReferenceAnalysisService(config)
  return service.analyzeCrossReference(request)
}