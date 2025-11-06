import { generateCrossReferencePrompt } from '@/lib/mcp-tools/generateCrossReferencePrompt';
import type { CrossReference } from '@/lib/types';

describe('Demo Prompt Generation', () => {
  it('should generate prompt for Matt.2.1 -> Luke.1.5 cross-reference', async () => {
    // Mock the cross-reference based on the actual data from Matt.json
    const crossReference: CrossReference = {
      reference: 'Luke.1.5',
      display_ref: 'Luke 1:5',
      text: 'When Herod was king of Judea, there was a Jewish priest named Zechariah. He was a member of the priestly order of Abijah, and his wife, Elizabeth, was also from the priestly line of Aaron.',
      anchor_ref: 'Matt.2.1',
      connection: {
        categories: ['parallel_account', 'theological_principle'],
        strength: 0.95,
        type: 'parallel_account',
        explanation:
          'Both passages reference the reign of King Herod as historical context for the birth narrative',
      },
      reasoning:
        "PARALLEL_ACCOUNT: Same gospel event. Shared names/narrative structure. Both passages establish the historical timeframe during Herod's reign.",
    };

    console.log('\\n=== CROSS-REFERENCE DETAILS ===');
    console.log(`Anchor: ${crossReference.anchor_ref}`);
    console.log(`Cross-Reference: ${crossReference.reference}`);
    console.log(`Connection Type: ${crossReference.connection.type}`);
    console.log(`Strength: ${crossReference.connection.strength}`);
    console.log(
      `Categories: ${crossReference.connection.categories.join(', ')}`
    );

    const result = await generateCrossReferencePrompt({
      crossReference: crossReference,
      userObservation:
        "I'm studying the birth narrative and want to understand how Matthew and Luke complement each other.",
      contextRange: 2,
      promptTemplate: 'default',
    });

    console.log('\\n=== GENERATED PROMPT ===');
    console.log(result.prompt);

    console.log('\\n=== PROMPT METADATA ===');
    console.log(`Template used: ${result.metadata.template_used}`);
    console.log(`Prompt length: ${result.metadata.prompt_length} characters`);
    console.log(
      `Context verses included: ${result.metadata.context_verses_included}`
    );

    console.log('\\n=== SOURCE DATA ===');
    console.log(`Anchor verse: ${result.sources.anchor_verse.reference}`);
    console.log(`Anchor text: "${result.sources.anchor_verse.text}"`);
    console.log(
      `Anchor context: ${result.sources.anchor_verse.context?.length || 0} verses`
    );
    console.log(`Cross-ref verse: ${result.sources.cross_reference.reference}`);
    console.log(`Cross-ref text: "${result.sources.cross_reference.text}"`);
    console.log(
      `Cross-ref context: ${result.sources.cross_reference.context?.length || 0} verses`
    );

    // Basic assertions to ensure the test passes
    expect(result.prompt).toBeDefined();
    expect(result.prompt).toContain('Matt.2.1');
    expect(result.prompt).toContain('Luke.1.5');
    expect(result.sources.anchor_verse.reference).toBe('Matt.2.1');
    expect(result.sources.cross_reference.reference).toBe('Luke.1.5');
  });
});
