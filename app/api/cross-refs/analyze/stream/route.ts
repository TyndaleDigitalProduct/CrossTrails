import { NextRequest } from 'next/server';
import { CrossReferenceAnalysisService } from '@/lib/llm/CrossReferenceAnalysisService';
import { LLMClientConfig } from '@/lib/types';
import rateLimitService from '@/lib/utils/rateLimit';
import errorHandler, { validate } from '@/lib/utils/errorHandler';

export const runtime = 'nodejs';

/**
 * POST /api/cross-refs/analyze/stream
 * Streams LLM analysis responses in real-time using Server-Sent Events
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
      'streaming'
    );
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many streaming requests. Please try again later.',
          details: {
            limit: rateLimitResult.limit,
            resetTime: rateLimitResult.resetTime,
          },
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();

    // Validate required fields
    const {
      crossReference,
      userObservation,
      analysisType = 'default',
      contextRange = 2,
      llmConfig,
    } = body;

    try {
      validate.required(crossReference, 'crossReference');
      validate.crossReference(crossReference);
      if (analysisType !== 'default') {
        validate.template(analysisType);
      }
    } catch (validationError: any) {
      return new Response(
        JSON.stringify({
          error: validationError.code || 'VALIDATION_ERROR',
          message: validationError.message || 'Invalid request data',
          details: validationError.details || {},
          suggestion: validationError.suggestion,
        }),
        {
          status: validationError.statusCode || 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create analysis service with optional configuration
    const config: LLMClientConfig | undefined = llmConfig
      ? {
          provider: llmConfig.provider || 'gloo',
          model: llmConfig.model,
          temperature: llmConfig.temperature,
          max_tokens: llmConfig.max_tokens,
        }
      : undefined;

    const analysisService = new CrossReferenceAnalysisService(config);

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection info
          controller.enqueue(
            encoder.encode(
              `event: connection\ndata: ${JSON.stringify({
                status: 'connected',
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );

          // Stream the analysis
          for await (const chunk of analysisService.analyzeCrossReferenceStream(
            {
              crossReference,
              userObservation,
              analysisType,
              contextRange,
            }
          )) {
            if (chunk.done) {
              // Final chunk with complete metadata
              controller.enqueue(
                encoder.encode(
                  `event: complete\ndata: ${JSON.stringify({
                    content: chunk.content,
                    metadata: chunk.metadata,
                    timestamp: new Date().toISOString(),
                  })}\n\n`
                )
              );
            } else {
              // Streaming content chunk
              controller.enqueue(
                encoder.encode(
                  `event: chunk\ndata: ${JSON.stringify({
                    content: chunk.content,
                    timestamp: new Date().toISOString(),
                  })}\n\n`
                )
              );
            }
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `event: end\ndata: ${JSON.stringify({
                status: 'completed',
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error('Streaming analysis error:', error);

          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                error:
                  error instanceof Error ? error.message : 'Streaming failed',
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Stream setup error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Stream setup failed',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
