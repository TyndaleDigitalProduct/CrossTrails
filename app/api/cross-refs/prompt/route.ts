import { NextRequest, NextResponse } from 'next/server';
import { generateCrossReferencePrompt } from '@/lib/mcp-tools/generateCrossReferencePrompt';
import { CrossReference } from '@/lib/types';
import cacheService from '@/lib/utils/cache';
import rateLimitService from '@/lib/utils/rateLimit';
import errorHandler, { validate } from '@/lib/utils/errorHandler';

export const runtime = 'nodejs';

/**
 * POST /api/cross-refs/prompt
 * Generates a cross-reference analysis prompt without sending to LLM
 * Useful for debugging, preview, or client-side LLM integration
 *
 * ⚠️ CRITICAL: Requires properly formatted CrossReference object
 * Raw JSON data from files (John.json, etc.) must be transformed first.
 * See docs/API_DATA_FORMATS.md for required format and transformation guide.
 *
 * Common 500 error: "Cannot read properties of undefined (reading 'join')"
 * Cause: connection.categories must be string[], not separate fields
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await rateLimitService.checkLimit(
      clientId,
      'prompt'
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many prompt requests. Please try again later.',
          details: {
            limit: rateLimitResult.limit,
            resetTime: rateLimitResult.resetTime,
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const {
      crossReference,
      userObservation,
      promptTemplate = 'default',
      contextRange = 2,
    } = body;

    // Validate using error handler
    try {
      validate.required(crossReference, 'crossReference');
      validate.crossReference(crossReference);
      validate.template(promptTemplate);
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: validationError.code || 'VALIDATION_ERROR',
          message: validationError.message || 'Invalid request data',
          details: validationError.details || {},
          suggestion: validationError.suggestion,
        },
        { status: validationError.statusCode || 400 }
      );
    }

    // Check cache first
    const cacheKey = cacheService.generateKey('prompt_generation', {
      crossReference,
      userObservation,
      promptTemplate,
      contextRange,
    });

    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: {
          ...cachedResult,
          cached: true,
          retrieved_at: new Date().toISOString(),
        },
      });
    }

    // Generate the prompt
    console.log('🧪 Calling generateCrossReferencePrompt with:', {
      crossReference,
      userObservation,
      promptTemplate,
      contextRange,
    });

    const result = await generateCrossReferencePrompt({
      crossReference,
      userObservation,
      promptTemplate,
      contextRange,
    });

    console.log('✅ generateCrossReferencePrompt succeeded:', {
      promptLength: result.prompt.length,
      metadataKeys: Object.keys(result.metadata),
      sourcesKeys: Object.keys(result.sources),
    });

    // Cache the result
    const responseData = {
      prompt: result.prompt,
      metadata: result.metadata,
      sources: result.sources,
      template_used: promptTemplate,
      generated_at: new Date().toISOString(),
    };

    await cacheService.set(cacheKey, responseData, 'prompt_generation');

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('❌ Prompt generation API error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type',
      fullError: error,
    });

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    let statusCode = 500;

    // Map specific error types to appropriate status codes
    if (errorMessage.includes('Cannot determine anchor reference')) {
      statusCode = 400;
    } else if (errorMessage.includes('Failed to fetch verse text')) {
      statusCode = 503; // Service Unavailable (external API issue)
    } else if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('required')
    ) {
      statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: `Detailed error: ${errorMessage}`,
        errorType: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/cross-refs/prompt/templates
 * Returns available prompt templates and their descriptions
 */
export async function GET() {
  const templates = {
    default: {
      name: 'Default Analysis',
      description:
        'General cross-reference analysis suitable for most study purposes',
      use_case: 'Bible study, general research, comparative analysis',
    },
    study: {
      name: 'Study Guide',
      description:
        'Structured analysis with study questions and practical applications',
      use_case: 'Group studies, lesson preparation, educational contexts',
    },
    devotional: {
      name: 'Devotional Reflection',
      description:
        'Personal reflection focused on spiritual growth and practical application',
      use_case: 'Personal devotions, spiritual reflection, meditation',
    },
    academic: {
      name: 'Academic Research',
      description:
        'Scholarly analysis with historical, cultural, and linguistic considerations',
      use_case: 'Academic research, seminary work, in-depth theological study',
    },
  };

  return NextResponse.json({
    success: true,
    data: {
      templates,
      default_template: 'default',
      supported_context_ranges: [1, 2, 3, 4, 5],
      default_context_range: 2,
    },
  });
}
