import { NextResponse } from 'next/server'
import { ensureValidToken, tokenInfo } from '../../../lib/utils/auth'

// --- Service checks ---

async function checkGlooAI() {
  if (!process.env.GLOO_AI_API_KEY) return 'not_configured'
  try {
    const apiKey = process.env.GLOO_AI_API_KEY
    if (apiKey.length > 10) return 'healthy'
    return 'invalid_key'
  } catch {
    return 'unhealthy'
  }
}

async function checkNLTAPI() {
  try {
    // Placeholder health check for NLT API
    return 'healthy'
  } catch {
    return 'unhealthy'
  }
}

function checkEnvironmentVars() {
  const required = ['GLOO_AI_API_KEY', 'NEXT_PUBLIC_APP_URL']
  const missing = required.filter(key => !process.env[key])
  return missing.length > 0 ? `missing_vars: ${missing.join(', ')}` : 'healthy'
}

// --- Authentication check using ensureValidToken ---

async function checkAuth() {
  try {
    // Refresh or get the cached token
    await ensureValidToken()

    if (!tokenInfo) {
      return { status: 'unhealthy', error: 'No token info available' }
    }

    return {
      status: 'healthy',
      token_type: tokenInfo.token_type,
      expires_in: tokenInfo.expires_in
    }
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message || String(error) }
  }
}

// --- API route handler ---

export async function GET() {
  const services = {
    database: 'not_applicable',
    gloo_ai: await checkGlooAI(),
    nlt_api: await checkNLTAPI(),
    environment_vars: checkEnvironmentVars(),
    authentication: await checkAuth()
  }

  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services,
    version: process.env.NEXT_PUBLIC_VERSION || '0.1.0',
    deployment: {
      vercel_region: process.env.VERCEL_REGION || 'unknown',
      vercel_url: process.env.VERCEL_URL || 'localhost'
    }
  }

  const isHealthy = Object.values(services).every((status) => {
    if (typeof status === 'string') return status === 'healthy' || status === 'not_applicable'
    if (typeof status === 'object') return status.status === 'healthy' || status.status === 'not_applicable'
    return false
  })

  return NextResponse.json(checks, {
    status: isHealthy ? 200 : 503
  })
}
