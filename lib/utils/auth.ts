import axios from 'axios'

const CLIENT_ID = process.env.GLOO_CLIENT_ID || 'YOUR_CLIENT_ID'
const CLIENT_SECRET = process.env.GLOO_CLIENT_SECRET || 'YOUR_CLIENT_SECRET'
const TOKEN_URL = 'https://platform.ai.gloo.com/oauth2/token'

export interface TokenInfo {
  access_token: string
  expires_in: number
  expires_at: number
  token_type: string
}

// Global token storage (cached)
export let tokenInfo: TokenInfo | null = null

function isTokenExpired(token: TokenInfo | null): boolean {
  if (!token || !token.expires_at) return true
  return Date.now() / 1000 > token.expires_at - 60 // refresh 1 minute early
}

export async function getAccessToken(): Promise<TokenInfo> {
  const body = 'grant_type=client_credentials&scope=api/access'
  const response = await axios.post<TokenInfo>(TOKEN_URL, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: { username: CLIENT_ID, password: CLIENT_SECRET },
  })

  const tokenData = response.data
  tokenData.expires_at = Math.floor(Date.now() / 1000) + tokenData.expires_in

  return tokenData
}

export async function ensureValidToken(): Promise<string> {
  if (isTokenExpired(tokenInfo)) {
    console.log('Getting new access token...')
    tokenInfo = await getAccessToken()
  }
  return tokenInfo!.access_token
}

export async function makeAuthenticatedRequest(endpoint: string, payload?: any): Promise<any> {
  const token = await ensureValidToken()
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  if (payload) {
    const response = await axios.post(endpoint, payload, config)
    return response.data
  } else {
    const response = await axios.get(endpoint, config)
    return response.data
  }
}

// Authentication test function (can be called from health route)
export async function testAuthentication(): Promise<boolean> {
  try {
    const token = await ensureValidToken()
    console.log('✓ Token retrieved and validated successfully')
    return true
  } catch (error: any) {
    console.error('✗ Authentication failed:', error.message)
    return false
  }
}
