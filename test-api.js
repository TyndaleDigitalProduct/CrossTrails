// Simple test script to verify API endpoints
const baseUrl = 'http://localhost:3000'

async function testEndpoint(endpoint, options = {}) {
  try {
    console.log(`\n🧪 Testing ${endpoint}...`)
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      ...options
    })
    
    const data = await response.json()
    
    console.log(`✅ Status: ${response.status}`)
    console.log(`📄 Response:`, JSON.stringify(data, null, 2))
    
    return { success: true, status: response.status, data }
    
  } catch (error) {
    console.log(`❌ Error:`, error.message)
    return { success: false, error: error.message }
  }
}

async function testPostEndpoint(endpoint, body) {
  try {
    console.log(`\n🧪 Testing POST ${endpoint}...`)
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    console.log(`✅ Status: ${response.status}`)
    console.log(`📄 Response:`, JSON.stringify(data, null, 2))
    
    return { success: true, status: response.status, data }
    
  } catch (error) {
    console.log(`❌ Error:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Testing CrossTrails API Endpoints...')
  
  // Test health check
  await testEndpoint('/api/health')
  
  // Test LLM providers
  await testEndpoint('/api/llm/providers')
  
  // Test prompt templates
  await testEndpoint('/api/cross-refs/prompt')
  
  // Test prompt generation
  const sampleCrossReference = {
    reference: 'Luke.1.5',
    display_ref: 'Luke 1:5', 
    text: 'When Herod was king of Judea, there was a Jewish priest named Zechariah.',
    anchor_ref: 'Matt.2.1',
    connection: {
      categories: ['parallel_account', 'theological_principle'],
      strength: 0.95,
      type: 'parallel_account',
      explanation: 'Both passages reference the reign of King Herod'
    },
    reasoning: 'PARALLEL_ACCOUNT: Same gospel event.'
  }
  
  await testPostEndpoint('/api/cross-refs/prompt', {
    crossReference: sampleCrossReference,
    userObservation: 'Test prompt generation',
    promptTemplate: 'default',
    contextRange: 2
  })
  
  console.log('\n🎉 API Testing Complete!')
}

runTests().catch(console.error)