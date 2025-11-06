/**
 * Direct test of the generateCrossReferencePrompt function
 */

const {
  generateCrossReferencePrompt,
} = require('./lib/mcp-tools/generateCrossReferencePrompt.ts');

async function testDirectMCPCall() {
  console.log('🧪 Testing generateCrossReferencePrompt directly...\n');

  const testData = {
    crossReference: {
      reference: 'Luke.1.5',
      anchor_ref: 'Matt.2.1',
      connection: 'Both passages discuss timing',
    },
    userObservation: 'Test observation',
    promptTemplate: 'default',
    contextRange: 2,
  };

  try {
    console.log('📋 Input data:', JSON.stringify(testData, null, 2));

    const result = await generateCrossReferencePrompt(testData);

    console.log('\n✅ Success!');
    console.log('📄 Generated prompt length:', result.prompt.length);
    console.log('📊 Metadata:', result.metadata);
    console.log('📚 Sources count:', result.sources.length);
  } catch (error) {
    console.log('\n❌ Error in direct MCP call:');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
  }
}

testDirectMCPCall().catch(console.error);
