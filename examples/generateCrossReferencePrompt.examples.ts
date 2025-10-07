/**
 * Example Usage: generateCrossReferencePrompt
 * 
 * This example demonstrates how to use the generateCrossReferencePrompt MCP tool
 * to create comprehensive LLM prompts for analyzing cross-reference relationships.
 */

import { generateCrossReferencePrompt } from '@/lib/mcp-tools/generateCrossReferencePrompt'
import { CrossReference } from '@/lib/types'

// Example: Create a comprehensive prompt for analyzing John 3:16 and Romans 5:8
async function exampleBasicUsage() {
  const crossReference: CrossReference = {
    reference: 'Romans.5.8',
    display_ref: 'Romans 5:8',
    text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.',
    anchor_ref: 'John.3.16',
    connection: {
      categories: ['love', 'salvation', 'sacrifice'],
      strength: 0.92,
      type: 'thematic_echo',
      explanation: 'Both passages emphasize Gods love demonstrated through Christ\'s sacrifice'
    },
    reasoning: 'These verses both highlight the central Christian message of God\'s love expressed through Christ\'s sacrificial death for humanity, showing the universal scope of divine love for sinners.'
  }

  try {
    const result = await generateCrossReferencePrompt({
      crossReference,
      userObservation: 'I notice both verses emphasize that God\'s love is not conditional on our righteousness',
      contextRange: 2
    })

    console.log('=== Generated LLM Prompt ===')
    console.log(result.prompt)
    console.log('\n=== Metadata ===')
    console.log(`Template: ${result.metadata.template_used}`)
    console.log(`Prompt length: ${result.metadata.prompt_length} characters`)
    console.log(`Context verses included: ${result.metadata.context_verses_included}`)
    
    return result
  } catch (error) {
    console.error('Failed to generate prompt:', error)
    throw error
  }
}

// Example: Study template for deeper analysis
async function exampleStudyTemplate() {
  const crossReference: CrossReference = {
    reference: 'Philippians.2.6-8',
    display_ref: 'Philippians 2:6-8',
    text: 'Who, being in very nature God, did not consider equality with God something to be used to his own advantage; rather, he made himself nothing by taking the very nature of a servant, being made in human likeness. And being found in appearance as a man, he humbled himself by becoming obedient to death—even death on a cross!',
    anchor_ref: 'John.1.14',
    connection: {
      categories: ['incarnation', 'christological_parallel', 'theological_principle'],
      strength: 0.95,
      type: 'christological_parallel',
      explanation: 'Both passages describe the incarnation and humiliation of Christ'
    },
    reasoning: 'These passages complement each other in describing the mystery of the incarnation - John emphasizing the Word becoming flesh, Philippians detailing the self-emptying (kenosis) of Christ in His incarnation and crucifixion.'
  }

  const result = await generateCrossReferencePrompt({
    crossReference,
    promptTemplate: 'study',
    contextRange: 1
  })

  console.log('=== Study Template Prompt ===')
  console.log(result.prompt)
  
  return result
}

// Example: Devotional template for personal reflection
async function exampleDevotionalTemplate() {
  const crossReference: CrossReference = {
    reference: 'Psalm.23.1',
    display_ref: 'Psalm 23:1',
    text: 'The Lord is my shepherd, I lack nothing.',
    anchor_ref: 'John.10.11',
    connection: {
      categories: ['shepherd_imagery', 'care', 'provision'],
      strength: 0.88,
      type: 'shared_metaphor',
      explanation: 'Both passages use shepherd imagery to describe God\'s care and provision'
    },
    reasoning: 'The shepherd metaphor connects these passages, with Psalm 23 expressing trust in God\'s provision and John 10 revealing Jesus as the Good Shepherd who lays down His life for the sheep.'
  }

  const result = await generateCrossReferencePrompt({
    crossReference,
    userObservation: 'This comforts me during a difficult time in my life',
    promptTemplate: 'devotional',
    contextRange: 1
  })

  console.log('=== Devotional Template Prompt ===')
  console.log(result.prompt)
  
  return result
}

// Example: Academic template for scholarly analysis
async function exampleAcademicTemplate() {
  const crossReference: CrossReference = {
    reference: 'Isaiah.53.5',
    display_ref: 'Isaiah 53:5',
    text: 'But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed.',
    anchor_ref: '1Peter.2.24',
    connection: {
      categories: ['prophecy_fulfillment', 'atonement', 'quotation'],
      strength: 0.97,
      type: 'prophecy_fulfillment',
      explanation: 'Peter quotes Isaiah 53 to explain Christ\'s atoning work'
    },
    reasoning: 'This is a clear case of New Testament use of Old Testament prophecy, where Peter directly applies Isaiah\'s Suffering Servant passage to Christ\'s crucifixion, demonstrating the early Christian understanding of Jesus as the fulfillment of Isaiah\'s prophecy.'
  }

  const result = await generateCrossReferencePrompt({
    crossReference,
    promptTemplate: 'academic',
    contextRange: 3
  })

  console.log('=== Academic Template Prompt ===')
  console.log(result.prompt)
  
  return result
}

// Example: Using with cross-reference data from JSON files
async function exampleWithRealData() {
  // This would typically come from your cross-reference data access layer
  const crossReference: CrossReference = {
    reference: 'Luke.2.4-7',
    display_ref: 'Luke 2:4-7',
    text: 'So Joseph also went up from the town of Nazareth in Galilee to Judea, to Bethlehem the town of David, because he belonged to the house and line of David. He went there to register with Mary, who was pledged to be married to him and was expecting a child. While they were there, the time came for the baby to be born, and she gave birth to her firstborn, a son. She wrapped him in cloths and placed him in a manger, because there was no guest room available for them.',
    anchor_ref: 'Matthew.2.1',
    connection: {
      categories: ['parallel_account', 'location', 'historical_reference'],
      strength: 0.92,
      type: 'parallel_account',
      explanation: 'Both passages describe Jesus being born in Bethlehem'
    },
    reasoning: 'These Gospel accounts provide complementary perspectives on the nativity, with Matthew focusing on the wise men\'s visit and Luke detailing the circumstances of the birth itself, both confirming Bethlehem as the birthplace.'
  }

  const result = await generateCrossReferencePrompt({
    crossReference,
    userObservation: 'Why do both Matthew and Luke emphasize Bethlehem specifically?',
    contextRange: 1
  })

  console.log('=== Real Data Example ===')
  console.log('Sources used:')
  console.log(`- Anchor: ${result.sources.anchor_verse.reference}`)
  console.log(`- Cross-ref: ${result.sources.cross_reference.reference}`)
  console.log(`- Connection strength: ${(result.sources.connection_data.strength * 100)}%`)
  console.log(`- Categories: ${result.sources.connection_data.categories.join(', ')}`)
  console.log('\nGenerated prompt:')
  console.log(result.prompt.substring(0, 500) + '...')
  
  return result
}

// Example: Error handling
async function exampleErrorHandling() {
  const invalidCrossReference: CrossReference = {
    reference: 'Romans.5.8',
    display_ref: 'Romans 5:8',
    text: 'But God demonstrates his own love for us...',
    // Missing anchor_ref and context - should cause error
    connection: {
      categories: ['love'],
      strength: 0.9,
      type: 'thematic_echo'
    }
  }

  try {
    await generateCrossReferencePrompt({
      crossReference: invalidCrossReference
    })
  } catch (error) {
    console.log('Expected error caught:', error instanceof Error ? error.message : String(error))
    // Expected: "Cannot determine anchor reference from CrossReference data"
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    console.log('🚀 Running generateCrossReferencePrompt Examples\n')
    
    try {
      await exampleBasicUsage()
      console.log('\n' + '='.repeat(80) + '\n')
      
      await exampleStudyTemplate()
      console.log('\n' + '='.repeat(80) + '\n')
      
      await exampleDevotionalTemplate()
      console.log('\n' + '='.repeat(80) + '\n')
      
      await exampleAcademicTemplate()
      console.log('\n' + '='.repeat(80) + '\n')
      
      await exampleWithRealData()
      console.log('\n' + '='.repeat(80) + '\n')
      
      await exampleErrorHandling()
      
    } catch (error) {
      console.error('Example failed:', error)
    }
  })()
}

export {
  exampleBasicUsage,
  exampleStudyTemplate,
  exampleDevotionalTemplate,
  exampleAcademicTemplate,
  exampleWithRealData,
  exampleErrorHandling
}