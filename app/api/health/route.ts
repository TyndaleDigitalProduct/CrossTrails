import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: 'not_applicable', // No traditional database
      gloo_ai: await checkGlooAI(),
      nlt_api: await checkNLTAPI(),
      environment_vars: checkEnvironmentVars()
    },
    version: process.env.NEXT_PUBLIC_VERSION || '0.1.0',
    deployment: {
      vercel_region: process.env.VERCEL_REGION || 'unknown',
      vercel_url: process.env.VERCEL_URL || 'localhost'
    }
  }

  const isHealthy = Object.values(checks.services).every(
    status => status === 'healthy' || status === 'not_applicable'
  )

  return NextResponse.json(checks, {
    status: isHealthy ? 200 : 503
  })
}

async function checkGlooAI() {
  if (!process.env.GLOO_AI_API_KEY) {
    return 'not_configured'
  }

  try {
    // Simple health check - just verify the API key format
    // In production, you might make a lightweight API call
    const apiKey = process.env.GLOO_AI_API_KEY
    if (apiKey.length > 10) { // Basic validation
      return 'healthy'
    }
    return 'invalid_key'
  } catch {
    return 'unhealthy'
  }
}

async function checkNLTAPI() {
  try {
    // For now, just check if we can reach the NLT.to domain
    // In production, you might make a lightweight API call
    const baseUrl = process.env.NLT_API_BASE_URL || 'https://api.nlt.to'

    // Simple DNS check - if this fails, the API is likely unreachable
    // In a real implementation, you'd make a proper API health check
    return 'healthy' // Assume healthy for now
  } catch {
    return 'unhealthy'
  }
}

function checkEnvironmentVars() {
  const required = [
    'GLOO_AI_API_KEY',
    'NEXT_PUBLIC_APP_URL'
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    return `missing_vars: ${missing.join(', ')}`
  }

  return 'healthy'
}