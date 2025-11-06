import { getCrossReferenceConnection } from '@/lib/mcp-tools/getCrossReferenceConnection';
import { CrossReferenceConnectionRequest } from '@/lib/types';

describe('getCrossReferenceConnection - Detailed Analysis', () => {
  it('should show current mock data structure for Matthew 2:1', async () => {
    const request: CrossReferenceConnectionRequest = {
      anchor_verse: 'Matthew.2.1',
      candidate_refs: ['Luke.1.5', 'Luke.2.4-7', 'John.7.42'],
      min_strength: 0.1, // Low threshold to see all data
    };

    const result = await getCrossReferenceConnection(request);

    console.log('=== CURRENT MOCK DATA RESULTS ===');
    console.log('Anchor verse:', request.anchor_verse);
    console.log('Candidate refs:', request.candidate_refs);
    console.log('Total connections found:', result.connections.length);
    console.log();

    result.connections.forEach((connection, index) => {
      console.log(`Connection ${index + 1}:`);
      console.log('  Reference:', connection.reference);
      console.log('  Strength:', connection.strength);
      console.log('  Type:', connection.type);
      console.log('  Categories:', connection.categories);
      console.log('  Explanation:', connection.explanation);
      console.log('  Metadata:', JSON.stringify(connection.metadata, null, 4));
      console.log();
    });

    // Basic assertions
    expect(result.connections).toBeDefined();
    expect(Array.isArray(result.connections)).toBe(true);
  });

  it('should show mock data for Matthew 2:2 (more complex example)', async () => {
    const request: CrossReferenceConnectionRequest = {
      anchor_verse: 'Matthew.2.2',
      candidate_refs: ['Num.24.17', 'Jer.23.5', 'Rev.22.16'],
      min_strength: 0.1,
    };

    const result = await getCrossReferenceConnection(request);

    console.log('=== MATTHEW 2:2 MOCK DATA ===');
    console.log('Total connections found:', result.connections.length);

    result.connections.forEach((connection, index) => {
      console.log(
        `${connection.reference}: strength=${connection.strength}, type=${connection.type}`
      );
    });

    expect(result.connections.length).toBeGreaterThan(0);
  });

  it('should show what happens with non-matching candidates', async () => {
    const request: CrossReferenceConnectionRequest = {
      anchor_verse: 'Matthew.2.1',
      candidate_refs: ['Genesis.1.1', 'Revelation.1.1', 'Psalms.1.1'], // These shouldn't match
      min_strength: 0.1,
    };

    const result = await getCrossReferenceConnection(request);

    console.log('=== NON-MATCHING CANDIDATES TEST ===');
    console.log('Anchor verse:', request.anchor_verse);
    console.log('Candidate refs (should not match):', request.candidate_refs);
    console.log('Connections found:', result.connections.length);

    expect(result.connections.length).toBe(0);
  });
});
