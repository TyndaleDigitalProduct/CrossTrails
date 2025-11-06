import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/test-endpoints
 * Tests all the CrossTrails API endpoints to ensure they're working
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const results = [];

  // Test health endpoint
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();

    results.push({
      endpoint: '/api/health',
      method: 'GET',
      status: healthResponse.status,
      success: healthResponse.ok,
      response_time: 'measured_by_endpoint',
      data: healthData,
    });
  } catch (error) {
    results.push({
      endpoint: '/api/health',
      method: 'GET',
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }

  // Test LLM providers endpoint
  try {
    const providersResponse = await fetch(`${baseUrl}/api/llm/providers`);
    const providersData = await providersResponse.json();

    results.push({
      endpoint: '/api/llm/providers',
      method: 'GET',
      status: providersResponse.status,
      success: providersResponse.ok,
      data: providersData,
    });
  } catch (error) {
    results.push({
      endpoint: '/api/llm/providers',
      method: 'GET',
      success: false,
      error:
        error instanceof Error ? error.message : 'Providers endpoint failed',
    });
  }

  // Test prompt templates endpoint
  try {
    const templatesResponse = await fetch(`${baseUrl}/api/cross-refs/prompt`, {
      method: 'GET',
    });
    const templatesData = await templatesResponse.json();

    results.push({
      endpoint: '/api/cross-refs/prompt',
      method: 'GET (templates)',
      status: templatesResponse.status,
      success: templatesResponse.ok,
      data: templatesData,
    });
  } catch (error) {
    results.push({
      endpoint: '/api/cross-refs/prompt',
      method: 'GET (templates)',
      success: false,
      error:
        error instanceof Error ? error.message : 'Templates endpoint failed',
    });
  }

  // Test prompt generation with sample data
  try {
    const sampleCrossReference = {
      reference: 'Luke.1.5',
      display_ref: 'Luke 1:5',
      text: 'When Herod was king of Judea, there was a Jewish priest named Zechariah. He was a member of the priestly order of Abijah, and his wife, Elizabeth, was also from the priestly line of Aaron.',
      anchor_ref: 'Matt.2.1',
      connection: {
        categories: ['parallel_account', 'theological_principle'],
        strength: 0.95,
        type: 'parallel_account',
        explanation:
          'Both passages reference the reign of King Herod as historical context for the birth narrative',
      },
      reasoning:
        'PARALLEL_ACCOUNT: Same gospel event. Shared names/narrative structure.',
    };

    const promptResponse = await fetch(`${baseUrl}/api/cross-refs/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crossReference: sampleCrossReference,
        userObservation: 'Test prompt generation',
        promptTemplate: 'default',
        contextRange: 2,
      }),
    });

    const promptData = await promptResponse.json();

    results.push({
      endpoint: '/api/cross-refs/prompt',
      method: 'POST (generate)',
      status: promptResponse.status,
      success: promptResponse.ok,
      data: promptData.success
        ? {
            prompt_length: promptData.data?.prompt?.length || 0,
            template_used: promptData.data?.template_used,
            context_verses: promptData.data?.metadata?.context_verses_included,
          }
        : promptData,
    });
  } catch (error) {
    results.push({
      endpoint: '/api/cross-refs/prompt',
      method: 'POST (generate)',
      success: false,
      error:
        error instanceof Error ? error.message : 'Prompt generation failed',
    });
  }

  const summary = {
    total_tests: results.length,
    successful_tests: results.filter(r => r.success).length,
    failed_tests: results.filter(r => !r.success).length,
    overall_success: results.every(r => r.success),
  };

  return NextResponse.json({
    summary,
    results,
    timestamp: new Date().toISOString(),
    test_environment: {
      base_url: baseUrl,
      node_env: process.env.NODE_ENV || 'development',
    },
  });
}
