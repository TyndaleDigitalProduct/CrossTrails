/**
 * Test the full data pipeline: Raw JSON → Data Access Layer → MCP Tools
 */

import { getCrossReferenceConnection } from '@/lib/mcp-tools/getCrossReferenceConnection'
import { generateCrossReferencePrompt } from '@/lib/mcp-tools/generateCrossReferencePrompt'

async function testFullPipeline() {
  console.log('🧪 Testing Full Data Pipeline...\n')

  // Step 1: Simulate raw data from John.json (what we'd get from file)
  console.log('📋 Step 1: Raw John.json data format')
  const rawJohnData = {
    anchor_ref: "John.1.9",
    cross_ref: "1Jn.2.8",
    primary_category: "literary_parallel",
    secondary_category: "theological_principle", 
    confidence: 88,
    reasoning: "Johannine corpus connection shares distinctive vocabulary and themes."
  }
  console.log('Raw data:', JSON.stringify(rawJohnData, null, 2))

  // Step 2: Use data-access layer to get proper connection format
  console.log('\n🔄 Step 2: Data Access Layer transformation')
  try {
    const connectionRequest = {
      anchor_verse: rawJohnData.anchor_ref,
      candidate_refs: [rawJohnData.cross_ref],
      min_strength: 0.5
    }
    
    console.log('Connection request:', JSON.stringify(connectionRequest, null, 2))
    
    const connectionResponse = await getCrossReferenceConnection(connectionRequest)
    console.log('✅ Connection response:', JSON.stringify(connectionResponse, null, 2))
    
    if (connectionResponse.connections.length === 0) {
      console.log('❌ No connections found - data access layer may not have this reference')
      return false
    }

    const connection = connectionResponse.connections[0]
    
    // Step 3: Create properly formatted CrossReference for MCP tools
    console.log('\n📋 Step 3: Formatted CrossReference for MCP tools')
    const properCrossReference = {
      reference: rawJohnData.cross_ref,
      display_ref: rawJohnData.cross_ref.replace(/\./g, ' '),
      text: "", // Would be populated by verse fetching
      anchor_ref: rawJohnData.anchor_ref,
      connection: {
        categories: connection.categories,
        strength: connection.strength,
        type: connection.type,
        explanation: connection.explanation
      }
    }
    
    console.log('Proper format:', JSON.stringify(properCrossReference, null, 2))
    
    // Step 4: Test MCP tool with properly formatted data
    console.log('\n🎯 Step 4: MCP Tool (generateCrossReferencePrompt)')
    const promptRequest = {
      crossReference: properCrossReference,
      userObservation: "Testing the full pipeline from raw data to prompt generation",
      promptTemplate: "default" as const,
      contextRange: 2
    }
    
    const promptResult = await generateCrossReferencePrompt(promptRequest)
    
    console.log('✅ Prompt generated successfully!')
    console.log('Prompt length:', promptResult.prompt.length)
    console.log('Metadata keys:', Object.keys(promptResult.metadata))
    console.log('Sources keys:', Object.keys(promptResult.sources))
    
    return true
    
  } catch (error) {
    console.log('❌ Pipeline failed:', error.message)
    console.log('Stack:', error.stack)
    return false
  }
}

async function testWithMockDataAccess() {
  console.log('\n🔧 Testing with mock data transformation (simulating what data-access should do)...\n')
  
  // Simulate what the data-access layer should transform raw John.json to
  const rawJohnData = {
    anchor_ref: "John.1.9", 
    cross_ref: "1Jn.2.8",
    primary_category: "literary_parallel",
    secondary_category: "theological_principle",
    confidence: 88,
    reasoning: "Johannine corpus connection shares distinctive vocabulary and themes."
  }
  
  // Transform to proper format (what data-access layer should do)
  const transformedCrossReference = {
    reference: rawJohnData.cross_ref,
    display_ref: rawJohnData.cross_ref.replace(/\./g, ' '),
    text: "", // Would be populated by verse fetching
    anchor_ref: rawJohnData.anchor_ref,
    connection: {
      categories: [rawJohnData.primary_category, rawJohnData.secondary_category].filter(Boolean),
      strength: rawJohnData.confidence / 100, // Convert percentage to decimal
      type: "parallel" as const, // Map from categories
      explanation: rawJohnData.reasoning
    }
  }
  
  console.log('📋 Transformed data:', JSON.stringify(transformedCrossReference, null, 2))
  
  try {
    const promptRequest = {
      crossReference: transformedCrossReference,
      userObservation: "Testing manual transformation of raw John.json data",
      promptTemplate: "default",
      contextRange: 2
    }
    
    const promptResult = await generateCrossReferencePrompt(promptRequest)
    
    console.log('✅ Manual transformation worked!')
    console.log('Prompt length:', promptResult.prompt.length)
    
    return true
    
  } catch (error) {
    console.log('❌ Manual transformation failed:', error.message)
    return false
  }
}

async function runPipelineTests() {
  console.log('🚀 Full Data Pipeline Test Suite')
  console.log('==================================\n')
  
  const test1 = await testFullPipeline()
  const test2 = await testWithMockDataAccess() 
  
  console.log('\n📊 Results:')
  console.log(`Full Pipeline (with data-access): ${test1 ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Manual Transformation: ${test2 ? '✅ PASS' : '❌ FAIL'}`)
  
  if (test2 && !test1) {
    console.log('\n💡 Conclusion: MCP tools work with proper format, but data-access layer needs John.json integration')
  } else if (test1 && test2) {
    console.log('\n🎉 Conclusion: Full pipeline working end-to-end!')
  } else {
    console.log('\n🔧 Conclusion: Need to investigate MCP tool or data format issues')
  }
}

runPipelineTests().catch(console.error)