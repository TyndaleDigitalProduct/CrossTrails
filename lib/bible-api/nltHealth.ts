/**
 * Lightweight health check for NLT.to API.
 * Returns 'not_configured' if no API key is present, otherwise 'healthy'|'unhealthy'.
 */
export async function checkNLTHealth(): Promise<'healthy' | 'unhealthy' | 'not_configured'> {
  const key = process.env.NLT_API_KEY || process.env.NLT_API_TOKEN || ''
  if (!key) return 'not_configured'

  const base = (process.env.NLT_API_BASE_URL || 'https://api.nlt.to').replace(/\/$/, '')
  const url = `${base}/api/passages?ref=John.1.1&version=NLT&key=${encodeURIComponent(key)}`

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 4000)
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal })
      if (!res.ok) {
        return 'unhealthy'
      }
      const text = await res.text()
      // Basic content check: look for verse marker or book header
      if (text && /<verse_export|\w+\s+\d+:\d+,\s*NLT/i.test(text)) {
        return 'healthy'
      }
      // If the endpoint returned plain text, ensure it's non-empty
      if (text && text.trim().length > 10) return 'healthy'
      return 'unhealthy'
    } finally {
      clearTimeout(id)
    }
  } catch (err) {
    console.error('NLT health fetch error:', err)
    return 'unhealthy'
  }
}

export default { checkNLTHealth }
