import { NextRequest, NextResponse } from 'next/server'
import { LLMClientFactory } from '@/lib/llm/LLMClientFactory'
import cacheService from '@/lib/utils/cache'
import rateLimitService from '@/lib/utils/rateLimit'
import errorHandler, { validate } from '@/lib/utils/errorHandler'

export const runtime = 'nodejs'

/**
 * GET /api/llm/providers
 * Returns available LLM providers and their configurations
 */
export async function GET() {
  try {
    // Check cache for provider configuration
    const cacheKey = cacheService.generateKey('provider_config', { action: 'list_providers' })
    const cachedResult = await cacheService.get(cacheKey)
    
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: {
          ...cachedResult,
          cached: true,
          retrieved_at: new Date().toISOString()
        }
      })
    }

    const factory = LLMClientFactory.getInstance()
    
    // Get available providers
    const providers = {
      gloo: {
        name: 'Gloo AI',
        description: 'Gloo AI platform with multiple model support',
        supported_models: [
          'gpt-4o-mini',
          'anthropic.claude-3-haiku-20240307-v1:0',
          'anthropic.claude-3-sonnet-20240229-v1:0'
        ],
        features: ['streaming', 'chat_completions', 'function_calling'],
        default_model: 'gpt-4o-mini'
      },
      openai: {
        name: 'OpenAI',
        description: 'Direct OpenAI API integration',
        supported_models: [
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4-turbo',
          'gpt-3.5-turbo'
        ],
        features: ['streaming', 'chat_completions', 'function_calling'],
        default_model: 'gpt-4o-mini'
      }
    }
    
    // Get default configuration
    const defaultConfig = factory.getDefaultConfig()
    
    const responseData = {
      providers,
      default_provider: defaultConfig.provider,
      default_config: defaultConfig,
      configuration_options: {
        temperature: {
          min: 0,
          max: 2,
          default: 0.7,
          description: 'Controls randomness in responses (0 = deterministic, 2 = very creative)'
        },
        max_tokens: {
          min: 100,
          max: 4000,
          default: 1500,
          description: 'Maximum number of tokens in the response'
        }
      },
      generated_at: new Date().toISOString()
    }
    
    // Cache the provider configuration (longer TTL since it changes rarely)
    await cacheService.set(cacheKey, responseData, 'provider_config')
    
    return NextResponse.json({
      success: true,
      data: responseData
    })
    
  } catch (error) {
    console.error('Providers API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get providers',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

/**
 * POST /api/llm/providers/test
 * Tests connection to a specific LLM provider
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for provider testing
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    const rateLimitResult = await rateLimitService.checkLimit(clientId, 'health')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many provider test requests. Please try again later.',
          details: {
            limit: rateLimitResult.limit,
            resetTime: rateLimitResult.resetTime
          }
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { provider, model, ...otherConfig } = body
    
    // Validate provider using error handler
    try {
      validate.required(provider, 'provider')
      validate.provider(provider)
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: validationError.code || 'VALIDATION_ERROR',
          message: validationError.message || 'Invalid request data',
          details: validationError.details || {},
          suggestion: validationError.suggestion
        },
        { status: validationError.statusCode || 400 }
      )
    }
    
    const factory = LLMClientFactory.getInstance()
    
    // Create provider instance with specified configuration
    const llmProvider = await factory.getProvider({
      provider,
      model,
      ...otherConfig
    })
    
    // Test the connection
    const startTime = Date.now()
    const isHealthy = await llmProvider.healthCheck()
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: isHealthy,
      data: {
        provider: llmProvider.name,
        model: model || 'default',
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
        status: isHealthy ? 'healthy' : 'unhealthy'
      }
    })
    
  } catch (error) {
    console.error('Provider test API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Provider test failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}