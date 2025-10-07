/**
 * Simple test to check if server is responding
 */

async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await fetch('http://localhost:3000/api/health');
    const result = await response.json();
    console.log('Health check result:', result.status);
    return true;
  } catch (error) {
    console.log('Health check failed:', error.message);
    return false;
  }
}

async function testPromptWhenReady() {
  // Test health first
  const isHealthy = await testHealth();
  if (!isHealthy) {
    console.log('Server not ready, exiting');
    return;
  }
  
  console.log('\nServer is ready, testing prompt endpoint...');
  
  const testData = {
    crossReference: {
      reference: "Luke.1.5",
      anchor_ref: "Matt.2.1",
      connection: "Both passages discuss timing"
    },
    userObservation: "Test observation",
    promptTemplate: "default",
    contextRange: 2
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/cross-refs/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log('Response:', result);
    
  } catch (error) {
    console.log('Prompt test failed:', error.message);
  }
}

testPromptWhenReady().catch(console.error);