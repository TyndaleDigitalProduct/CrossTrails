// Example: KV-based cross-reference data source
import { kv } from '@vercel/kv'

export class VercelKVDataSource implements CrossReferenceDataSource {
  
  async getCrossReferences(anchorRef: string): Promise<CrossReference[]> {
    // Try KV first (fastest)
    const cached = await kv.get(`cref:${anchorRef}`)
    if (cached) return cached
    
    // Fallback to Blob storage for rare misses
    const fromBlob = await this.loadFromBlob(anchorRef)
    
    // Cache in KV for next time
    if (fromBlob) {
      await kv.set(`cref:${anchorRef}`, fromBlob, { ttl: 86400 })
    }
    
    return fromBlob || []
  }
  
  async seedFromJSON(bookData: any) {
    // Migration function: JSON → KV
    const batch = []
    for (const item of bookData.items) {
      batch.push([`cref:${item.anchor_ref}`, item.cross_references])
    }
    await kv.mset(Object.fromEntries(batch))
  }
}