import { NextResponse } from 'next/server'
import { ensureValidToken, tokenInfo, testAuthentication } from '../../../lib/utils/auth'
import { checkNLTHealth } from '../../../lib/bible-api/nltHealth'
import { LLMClientFactory } from '@/lib/llm/LLMClientFactory'
import { getBlobHealth } from '@/lib/utils/blob'
import { blob } from 'stream/consumers'

// --- Service checks ---

async function checkNLTAPI() {
  try {
    return await checkNLTHealth()
  } catch (err) {
    console.error('checkNLTAPI error:', err)
    return 'unhealthy'
  }
}

async function checkLLMProvider() {
  try {
    const factory = LLMClientFactory.getInstance()
    const defaultProvider = await factory.getDefaultProvider()
    const isHealthy = await defaultProvider.healthCheck()
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      provider: defaultProvider.name,
      default_config: factory.getDefaultConfig()
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'LLM provider check failed'
    }
  }
}

async function checkGlooAuth() {
  try {
    const isHealthy = await testAuthentication()
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      configured: !!(process.env.GLOO_CLIENT_ID && process.env.GLOO_CLIENT_SECRET)
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Gloo auth check failed'
    }
  }
}

function checkEnvironmentVars() {
  const required = ['NEXT_PUBLIC_APP_URL']
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
    nlt_api: await checkNLTAPI(),
    environment_vars: checkEnvironmentVars(),
    authentication: await checkAuth(),
    llm_provider: await checkLLMProvider(),
    gloo_auth: await checkGlooAuth(),
    blob_storage: await getBlobHealth()
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
