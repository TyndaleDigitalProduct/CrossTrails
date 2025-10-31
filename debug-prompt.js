/**
 * Debug the 500 error in prompt generation
 */

const baseUrl = 'http://localhost:3000';

async function debugPromptError() {
  console.log('🔍 Debugging prompt generation 500 error...\n');

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
    console.log('📤 Sending request to /api/cross-refs/prompt');
    console.log('📋 Request data:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${baseUrl}/api/cross-refs/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`\n📊 Response status: ${response.status}`);
    console.log('📋 Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const result = await response.text();
    console.log('\n📄 Raw response:');
    console.log(result);

    // Try to parse as JSON
    try {
      const jsonResult = JSON.parse(result);
      console.log('\n🔧 Parsed JSON response:');
      console.log(JSON.stringify(jsonResult, null, 2));
    } catch (parseError) {
      console.log('❌ Could not parse response as JSON');
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

debugPromptError().catch(console.error);
