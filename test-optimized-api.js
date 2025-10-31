/**
 * Test script to demonstrate API optimizations
 * Tests caching, rate limiting, and error handling
 */

const baseUrl = 'http://localhost:3000';

// Test cross-reference for optimization demo
const testCrossReference = {
  reference: 'Luke.1.5',
  anchor_ref: 'Matt.2.1',
  connection:
    "Both passages discuss the timing of Jesus' birth during specific historical periods",
};

async function testEndpoint(endpoint, data, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 Endpoint: ${endpoint}`);

  const startTime = Date.now();

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseTime = Date.now() - startTime;
    const result = await response.json();

    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status}`);

    // Show cache status if available
    if (result.data && result.data.cached !== undefined) {
      console.log(`🗄️  Cache: ${result.data.cached ? 'HIT' : 'MISS'}`);
    }

    // Show rate limit info from headers
    console.log(`🚦 Rate Limit Headers:`);
    response.headers.forEach((value, key) => {
      if (key.includes('rate') || key.includes('limit')) {
        console.log(`   ${key}: ${value}`);
      }
    });

    if (response.ok) {
      console.log(`✅ Success!`);
    } else {
      console.log(`❌ Error: ${result.error || result.message}`);
    }

    return { response, result, responseTime };
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
    return null;
  }
}

async function demonstrateOptimizations() {
  console.log('🚀 CrossTrails API Optimization Demo');
  console.log('=====================================\n');

  // Test 1: Prompt generation (should cache)
  console.log('📝 TESTING CACHING WITH PROMPT GENERATION');

  const promptData = {
    crossReference: testCrossReference,
    userObservation: 'These passages both reference historical timing',
    promptTemplate: 'default',
    contextRange: 2,
  };

  // First request - should be cache MISS
  await testEndpoint(
    '/api/cross-refs/prompt',
    promptData,
    'First prompt request (Cache MISS)'
  );

  // Second request - should be cache HIT
  await testEndpoint(
    '/api/cross-refs/prompt',
    promptData,
    'Second prompt request (Cache HIT)'
  );

  // Test 2: Rate limiting demo
  console.log('\n\n🚦 TESTING RATE LIMITING');

  // Make multiple quick requests to trigger rate limiting
  for (let i = 1; i <= 3; i++) {
    await testEndpoint(
      '/api/cross-refs/prompt',
      {
        ...promptData,
        userObservation: `Test observation ${i}`, // Slightly different to avoid cache
      },
      `Rate limit test ${i}/3`
    );
  }

  // Test 3: Error handling
  console.log('\n\n🔧 TESTING ERROR HANDLING');

  await testEndpoint(
    '/api/cross-refs/prompt',
    {
      // Missing required crossReference field
      userObservation: 'This should trigger validation error',
    },
    'Invalid request (missing crossReference)'
  );

  await testEndpoint(
    '/api/cross-refs/prompt',
    {
      crossReference: {
        // Missing required fields
        reference: 'Luke.1.5',
        // Missing anchor_ref and connection
      },
    },
    'Invalid crossReference (missing fields)'
  );

  console.log('\n🎉 Optimization demo complete!');
  console.log('\nKey features demonstrated:');
  console.log('✅ Caching: Faster response times on repeated requests');
  console.log('✅ Rate Limiting: Protection against API abuse');
  console.log(
    '✅ Error Handling: Structured error responses with helpful details'
  );
}

// Run the demo
demonstrateOptimizations().catch(console.error);
