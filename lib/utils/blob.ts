/**
 * Vercel Blob Storage Utilities
 *
 * Provides simple access to proprietary JSON data stored in Vercel Blob.
 * Files are uploaded via Vercel dashboard and accessed at runtime.
 */

import { head } from '@vercel/blob';

/**
 * Fetches and parses a JSON file from Vercel Blob storage
 *
 * @param filename - Name of the blob file (e.g., 'cross-references.json')
 * @returns Parsed JSON data
 * @throws Error if file doesn't exist or isn't valid JSON
 *
 * @example
 * const crossRefs = await getBlobJSON<Record<string, CrossReference[]>>('cross-references.json');
 * const refs = crossRefs['John.3.16'];
 */
export async function getBlobJSON<T = any>(filename: string): Promise<T> {
  try {
    // Get blob metadata (includes URL)
    const blob = await head(filename);

    // Fetch the actual file content
    const response = await fetch(blob.url);

    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Failed to load '${filename}' from Blob storage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Checks if a blob file exists
 *
 * @param filename - Name of the blob file
 * @returns True if file exists, false otherwise
 */
export async function blobExists(filename: string): Promise<boolean> {
  try {
    await head(filename);
    return true;
  } catch {
    return false;
  }
}
