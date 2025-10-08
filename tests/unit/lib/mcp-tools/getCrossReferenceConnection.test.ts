import { getCrossReferenceConnection } from '@/lib/mcp-tools/getCrossReferenceConnection'
import { CrossReferenceConnectionRequest } from '@/lib/types'

describe('getCrossReferenceConnection', () => {
  it('should return connections for Matthew 2:1 with mock data', async () => {
    const request: CrossReferenceConnectionRequest = {
      anchor_verse: 'Matthew.2.1',
      candidate_refs: ['Luke.1.5', 'Luke.2.4-7', 'John.7.42'],
      min_strength: 0.5
    }

    const result = await getCrossReferenceConnection(request)

    expect(result.connections).toBeDefined()
    expect(Array.isArray(result.connections)).toBe(true)
    
    // Should find connections for Luke.1.5 and Luke.2.4-7 in mock data
    const lukeConnections = result.connections.filter(c => 
      c.reference === 'Luke.1.5' || c.reference === 'Luke.2.4-7'
    )
    expect(lukeConnections.length).toBeGreaterThan(0)

    // Connections should have required properties
    result.connections.forEach(connection => {
      expect(connection).toHaveProperty('reference')
      expect(connection).toHaveProperty('strength')
      expect(connection).toHaveProperty('categories')
      expect(connection).toHaveProperty('type')
      expect(connection).toHaveProperty('explanation')
      expect(connection.strength).toBeGreaterThanOrEqual(0.5)
    })
  })

  it('should return empty connections for non-existent anchor verse', async () => {
    const request: CrossReferenceConnectionRequest = {
      anchor_verse: 'Genesis.1.1',
      candidate_refs: ['Luke.1.5'],
      min_strength: 0.5
    }

    const result = await getCrossReferenceConnection(request)

    expect(result.connections).toEqual([])
  })

  it('should filter connections by minimum strength', async () => {
    const request: CrossReferenceConnectionRequest = {
      anchor_verse: 'Matthew.2.2',
      candidate_refs: ['Num.24.17', 'Jer.23.5', 'Rev.22.16'],
      min_strength: 0.85 // High threshold - should filter out some connections
    }

    const result = await getCrossReferenceConnection(request)

    // All returned connections should meet minimum strength
    result.connections.forEach(connection => {
      expect(connection.strength).toBeGreaterThanOrEqual(0.85)
    })
  })

  it('should sort connections by strength (highest first)', async () => {
    const request: CrossReferenceConnectionRequest = {
      anchor_verse: 'Matthew.2.2',
      candidate_refs: ['Num.24.17', 'Jer.23.5', 'Rev.22.16'],
      min_strength: 0.1 // Low threshold to get all connections
    }

    const result = await getCrossReferenceConnection(request)

    if (result.connections.length > 1) {
      for (let i = 0; i < result.connections.length - 1; i++) {
        expect(result.connections[i].strength).toBeGreaterThanOrEqual(
          result.connections[i + 1].strength
        )
      }
    }
  })

  it('should normalize reference formats correctly', async () => {
    const request: CrossReferenceConnectionRequest = {
      anchor_verse: 'Matthew.2.1',
      candidate_refs: ['Luke 1:5', 'Luke.2.4-7'], // Mixed formats
      min_strength: 0.5
    }

    const result = await getCrossReferenceConnection(request)

    // Should still find connections despite different reference formats
    expect(result.connections.length).toBeGreaterThan(0)
  })
})