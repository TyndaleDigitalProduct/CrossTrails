/**
 * Test the providers endpoint to verify optimizations
 */

const baseUrl = 'http://localhost:3000';

async function testProviders() {
  console.log('🧪 Testing /api/llm/providers (should show caching)');
  
  // First request - should be cache MISS
  console.log('\n📍 First request (Cache MISS):');
  const start1 = Date.now();
  const response1 = await fetch(`${baseUrl}/api/llm/providers`);
  const result1 = await response1.json();
  const time1 = Date.now() - start1;
  
  console.log(`⏱️  Response time: ${time1}ms`);
  console.log(`🗄️  Cache: ${result1.data.cached ? 'HIT' : 'MISS'}`);
  
  // Second request - should be cache HIT
  console.log('\n📍 Second request (Cache HIT):');
  const start2 = Date.now();
  const response2 = await fetch(`${baseUrl}/api/llm/providers`);
  const result2 = await response2.json();
  const time2 = Date.now() - start2;
  
  console.log(`⏱️  Response time: ${time2}ms`);
  console.log(`🗄️  Cache: ${result2.data.cached ? 'HIT' : 'MISS'}`);
  
  console.log(`\n📊 Performance improvement: ${Math.round(((time1 - time2) / time1) * 100)}% faster`);
  
  // Show available providers
  console.log('\n🔧 Available providers:');
  Object.keys(result2.data.providers).forEach(provider => {
    console.log(`  - ${provider}: ${result2.data.providers[provider].name}`);
  });
}

testProviders().catch(console.error);