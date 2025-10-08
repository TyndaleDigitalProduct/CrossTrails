import { getDownloadUrl } from '@vercel/blob'
/**
 * Utility function to fetch JSON data from Vercel Blob storage
 * @param filename - The blob filename (e.g., 'Matt.json')
 * @returns Promise containing the parsed JSON data
 */
export async function getBlobJSON<T>(filename: string): Promise<T> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not defined')
    }
    // console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN);
    // console.log(`[getBlobJSON] Fetching blob: ${filename}`)
    // Get the download URL for the blob
    const url = await getDownloadUrl(`https://nudzgmi4ybxinxi0.public.blob.vercel-storage.com/${filename}`, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    // console.log(`[getBlobJSON] Download URL: ${url}`)
    if (!url) {
      throw new Error(`Blob not found: ${filename}`)
    }

    // Fetch the blob content
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${filename}`)
    }

    const text = await response.text()
    return JSON.parse(text) as T
  } catch (error) {
    console.error(`Error fetching blob ${filename}:`, error)
    throw error
  }
}

/**
 * Check if blob storage is available and configured
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

/**
 * Get blob storage status for health checks
 */
export async function getBlobHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  configured: boolean
  error?: string
}> {
  try {
    if (!isBlobConfigured()) {
      return {
        status: 'unhealthy',
        configured: false,
        error: 'BLOB_READ_WRITE_TOKEN not configured'
      }
    }

    // Try to fetch a known file or check access
    // For now, just return healthy if token exists
    return {
      status: 'healthy',
      configured: true
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}