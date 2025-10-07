import { LLMClientConfig, LLMProvider } from '@/lib/types'
import { GlooAIProvider } from './providers/GlooAIProvider'
import { OpenAIProvider } from './providers/OpenAIProvider'

/**
 * LLM Client Factory
 * Creates and configures LLM provider instances based on configuration
 */
export class LLMClientFactory {
  private static instance: LLMClientFactory
  private providers: Map<string, LLMProvider> = new Map()

  private constructor() {}

  static getInstance(): LLMClientFactory {
    if (!LLMClientFactory.instance) {
      LLMClientFactory.instance = new LLMClientFactory()
    }
    return LLMClientFactory.instance
  }

  /**
   * Create or get a configured LLM provider
   */
  async getProvider(config: LLMClientConfig): Promise<LLMProvider> {
    const key = this.getProviderKey(config)
    
    if (this.providers.has(key)) {
      return this.providers.get(key)!
    }

    const provider = await this.createProvider(config)
    this.providers.set(key, provider)
    return provider
  }

  /**
   * Get the default provider based on environment configuration
   */
  async getDefaultProvider(): Promise<LLMProvider> {
    const config = this.getDefaultConfig()
    return this.getProvider(config)
  }

  private async createProvider(config: LLMClientConfig): Promise<LLMProvider> {
    switch (config.provider) {
      case 'gloo':
        return new GlooAIProvider({
          clientId: config.clientId || process.env.GLOO_CLIENT_ID,
          clientSecret: config.clientSecret || process.env.GLOO_CLIENT_SECRET,
          model: config.model || 'gpt-4o-mini',
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 1000,
          baseUrl: config.baseUrl || 'https://platform.ai.gloo.com'
        })

      case 'openai':
        return new OpenAIProvider({
          apiKey: config.apiKey || process.env.OPENAI_API_KEY,
          model: config.model || 'gpt-4o-mini',
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 1000,
          baseUrl: config.baseUrl || 'https://api.openai.com/v1'
        })

      case 'azure':
        // Future implementation
        throw new Error('Azure OpenAI provider not yet implemented')

      case 'anthropic':
        // Future implementation
        throw new Error('Anthropic provider not yet implemented')

      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`)
    }
  }

  private getDefaultConfig(): LLMClientConfig {
    // Determine default provider based on available environment variables
    if (process.env.GLOO_CLIENT_ID && process.env.GLOO_CLIENT_SECRET) {
      return {
        provider: 'gloo',
        model: process.env.GLOO_DEFAULT_MODEL || 'gpt-4o-mini',
        temperature: Number(process.env.LLM_TEMPERATURE) || 0.7,
        max_tokens: Number(process.env.LLM_MAX_TOKENS) || 1000
      }
    }

    if (process.env.OPENAI_API_KEY) {
      return {
        provider: 'openai',
        model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
        temperature: Number(process.env.LLM_TEMPERATURE) || 0.7,
        max_tokens: Number(process.env.LLM_MAX_TOKENS) || 1000
      }
    }

    // Fallback to Gloo (will fail if no credentials)
    return {
      provider: 'gloo',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1000
    }
  }

  private getProviderKey(config: LLMClientConfig): string {
    return `${config.provider}:${config.model}:${config.temperature}:${config.max_tokens}`
  }

  /**
   * Clear all cached providers (useful for testing)
   */
  clearCache(): void {
    this.providers.clear()
  }

  /**
   * Get health status of all configured providers
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {}
    
    for (const [key, provider] of this.providers) {
      try {
        status[key] = await provider.healthCheck()
      } catch (error) {
        status[key] = false
      }
    }

    return status
  }
}

// Export singleton instance
export const llmClientFactory = LLMClientFactory.getInstance()