import { NextRequest, NextResponse } from 'next/server'
import { CrossReferenceAnalysisService } from '@/lib/llm/CrossReferenceAnalysisService'
import { CrossReference, LLMClientConfig } from '@/lib/types'
import { withErrorHandling, validate, APIException, ErrorCode } from '@/lib/utils/errorHandler'
import { withRateLimit, RateLimitService } from '@/lib/utils/rateLimit'
import cache from '@/lib/utils/cache'

export const runtime = 'nodejs'

/**
 * POST /api/cross-refs/analyze
 * Analyzes a cross-reference connection using LLM with caching and optimization
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
      const startTime = Date.now()
      const body = await request.json()
      
      // Validate required fields
      const { crossReference, userObservation, analysisType = 'default', contextRange = 2, llmConfig } = body
      
      // Enhanced validation
      validate.required(crossReference, 'crossReference')
      validate.crossReference(crossReference)
      
      if (analysisType) {
        validate.template(analysisType)
      }
      
      if (contextRange && (contextRange < 1 || contextRange > 5)) {
        throw new APIException(
          ErrorCode.VALIDATION_ERROR,
          'contextRange must be between 1 and 5',
          400,
          { provided: contextRange, valid_range: '1-5' }
        )
      }
      
      // Create cache key for this analysis request
      const cacheParams = {
        crossReference: {
          reference: crossReference.reference,
          anchor_ref: crossReference.anchor_ref,
          connection: crossReference.connection
        },
        userObservation: userObservation || '',
        analysisType,
        contextRange,
        llmModel: llmConfig?.model || 'default'
      }
      
      // Try to get from cache first
      const cached = await cache.getOrSet('llm_analysis', cacheParams, async () => {
        // Create analysis service with optional configuration
        const config: LLMClientConfig | undefined = llmConfig ? {
          provider: llmConfig.provider || 'gloo',
          model: llmConfig.model,
          temperature: llmConfig.temperature,
          max_tokens: llmConfig.max_tokens
        } : undefined
        
        if (config?.provider) {
          validate.provider(config.provider)
        }
        
        const analysisService = new CrossReferenceAnalysisService(config)
        
        // Add timeout protection
        const timeoutMs = 30000 // 30 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new APIException(
            ErrorCode.TIMEOUT_ERROR,
            'Analysis request timed out',
            408,
            { timeout_ms: timeoutMs }
          )), timeoutMs)
        })
        
        // Race between analysis and timeout
        const analysisPromise = analysisService.analyzeCrossReference({
          crossReference,
          userObservation,
          analysisType,
          contextRange
        })
        
        return await Promise.race([analysisPromise, timeoutPromise]) as any
      })
      
      const totalTime = Date.now() - startTime
      
      // Add performance metadata
      const response = {
        success: true,
        data: {
          ...cached,
          performance: {
            total_time_ms: totalTime,
            cached: cached !== undefined,
            timestamp: new Date().toISOString()
          }
        }
      }
      
      return NextResponse.json(response)
}

// Apply rate limiting and error handling
export const POST = async (request: NextRequest) => {
  const rateLimitResult = RateLimitService.getInstance().checkLimit(
    request.headers.get('x-forwarded-for') || 'unknown',
    'analysis'
  )
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded for analysis requests',
          retryAfter: rateLimitResult.retryAfter
        }
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'Retry-After': (rateLimitResult.retryAfter || 60).toString()
        }
      }
    )
  }
  
  try {
    return await handlePOST(request)
  } catch (error) {
    console.error('Analysis API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Analysis failed',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cross-refs/analyze/health
 * Health check for the analysis service
 */
export async function GET() {
  try {
    const analysisService = new CrossReferenceAnalysisService()
    const healthCheck = await analysisService.testConnection()
    
    return NextResponse.json({
      success: healthCheck.success,
      provider: healthCheck.provider,
      model: healthCheck.model,
      timestamp: new Date().toISOString(),
      ...(healthCheck.error && { error: healthCheck.error })
    })
    
  } catch (error) {
    console.error('Health check API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}