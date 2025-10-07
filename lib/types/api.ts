/**
 * API Types for CrossTrails Frontend Integration
 * 
 * These types match the API endpoints and can be used in the React components
 * for type-safe integration with the backend services.
 */

// --- Cross-Reference Analysis API Types ---

export interface AnalyzeCrossReferenceRequest {
  crossReference: CrossReference
  userObservation?: string
  analysisType?: 'default' | 'study' | 'devotional' | 'academic'
  contextRange?: number
  llmConfig?: Partial<LLMClientConfig>
}

export interface AnalyzeCrossReferenceResponse {
  success: boolean
  data?: {
    analysis: string
    prompt_used: string
    sources: {
      anchor_verse: {
        reference: string
        text: string
        context?: Array<{ reference: string; text: string; position: 'before' | 'after' }>
      }
      cross_reference: {
        reference: string
        text: string
        context?: Array<{ reference: string; text: string; position: 'before' | 'after' }>
      }
      connection_data: {
        categories: string[]
        strength: number
        reasoning: string
      }
    }
    llm_metadata: {
      provider: string
      model: string
      response_time_ms: number
      usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
    }
  }
  error?: string
  timestamp?: string
}

// --- Streaming Analysis Types ---

export interface StreamEvent {
  event: 'connection' | 'chunk' | 'complete' | 'end' | 'error'
  data: StreamEventData
}

export interface StreamEventData {
  // Connection event
  status?: 'connected' | 'completed'
  
  // Chunk event
  content?: string
  
  // Complete event
  metadata?: {
    prompt_used: string
    sources: any
    llm_metadata: any
  }
  
  // Error event
  error?: string
  
  // All events
  timestamp: string
}

// --- Prompt Generation API Types ---

export interface GeneratePromptRequest {
  crossReference: CrossReference
  userObservation?: string
  promptTemplate?: 'default' | 'study' | 'devotional' | 'academic'
  contextRange?: number
}

export interface GeneratePromptResponse {
  success: boolean
  data?: {
    prompt: string
    metadata: {
      prompt_length: number
      context_verses_included: number
      template_used: string
    }
    sources: any
    template_used: string
    generated_at: string
  }
  error?: string
  timestamp?: string
}

export interface PromptTemplatesResponse {
  success: boolean
  data: {
    templates: {
      [key: string]: {
        name: string
        description: string
        use_case: string
      }
    }
    default_template: string
    supported_context_ranges: number[]
    default_context_range: number
  }
}

// --- LLM Provider API Types ---

export interface LLMProvidersResponse {
  success: boolean
  data: {
    providers: {
      [key: string]: {
        name: string
        description: string
        supported_models: string[]
        features: string[]
        default_model: string
      }
    }
    default_provider: string
    default_config: LLMClientConfig
    configuration_options: {
      temperature: {
        min: number
        max: number
        default: number
        description: string
      }
      max_tokens: {
        min: number
        max: number
        default: number
        description: string
      }
    }
  }
}

export interface TestProviderRequest {
  provider: string
  model?: string
  temperature?: number
  max_tokens?: number
}

export interface TestProviderResponse {
  success: boolean
  data?: {
    provider: string
    model: string
    response_time_ms: number
    timestamp: string
    status: 'healthy' | 'unhealthy'
  }
  error?: string
  timestamp?: string
}

// --- Health Check API Types ---

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  response_time_ms: number
  version: string
  checks: Array<{
    service: string
    status: 'healthy' | 'unhealthy' | 'error'
    provider?: string
    response_time_ms?: number
    error?: string
    config?: Record<string, any>
  }>
  summary: {
    total_checks: number
    healthy_checks: number
    unhealthy_checks: number
    error_checks: number
  }
}

// --- Base Types (imported from lib/types) ---

export interface CrossReference {
  reference: string
  display_ref: string
  text: string
  anchor_ref: string
  connection: {
    categories: string[]
    strength: number
    type: string
    explanation: string
  }
  reasoning: string
}

export interface LLMClientConfig {
  provider: 'gloo' | 'openai' | 'anthropic'
  model?: string
  temperature?: number
  max_tokens?: number
  clientId?: string
  clientSecret?: string
  apiKey?: string
  baseUrl?: string
}

// --- Frontend Helper Types ---

export interface APIError {
  success: false
  error: string
  timestamp?: string
}

export type APIResponse<T> = T | APIError

// --- React Hook Types for Frontend Integration ---

export interface UseCrossReferenceAnalysisOptions {
  onSuccess?: (data: AnalyzeCrossReferenceResponse['data']) => void
  onError?: (error: string) => void
  onStreamChunk?: (content: string) => void
  enableStreaming?: boolean
}

export interface UseCrossReferenceAnalysisReturn {
  analyze: (request: AnalyzeCrossReferenceRequest) => Promise<void>
  analyzeStream: (request: AnalyzeCrossReferenceRequest) => void
  loading: boolean
  streaming: boolean
  error: string | null
  result: AnalyzeCrossReferenceResponse['data'] | null
  abort: () => void
}

export interface UsePromptGenerationReturn {
  generatePrompt: (request: GeneratePromptRequest) => Promise<void>
  loading: boolean
  error: string | null
  prompt: GeneratePromptResponse['data'] | null
}