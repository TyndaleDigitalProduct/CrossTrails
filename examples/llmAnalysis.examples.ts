/**
 * Example Usage: Cross-Reference Analysis with LLM Integration
 *
 * This example demonstrates how to use the LLM integration to analyze
 * cross-references with different providers and configurations.
 */

import {
  CrossReferenceAnalysisService,
  analyzeCrossReference,
} from '@/lib/llm';
import { CrossReference, LLMClientConfig } from '@/lib/types';

// Example cross-reference data
const exampleCrossReference: CrossReference = {
  reference: 'Romans.5.8',
  display_ref: 'Romans 5:8',
  text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.',
  anchor_ref: 'John.3.16',
  connection: {
    categories: ['love', 'salvation', 'sacrifice'],
    strength: 0.92,
    type: 'thematic_echo',
    explanation:
      "Both passages emphasize Gods love demonstrated through Christ's sacrifice",
  },
  reasoning:
    "These verses both highlight the central Christian message of God's love expressed through Christ's sacrificial death for humanity, showing the universal scope of divine love for sinners.",
};

// Example 1: Basic analysis with default configuration
async function basicAnalysisExample() {
  console.log('=== Basic Cross-Reference Analysis ===');

  try {
    const result = await analyzeCrossReference({
      crossReference: exampleCrossReference,
      userObservation:
        'I notice both verses talk about Gods unconditional love for sinners',
    });

    console.log(`Provider: ${result.llm_metadata.provider}`);
    console.log(`Model: ${result.llm_metadata.model}`);
    console.log(`Response Time: ${result.llm_metadata.response_time_ms}ms`);
    console.log(`Tokens Used: ${result.llm_metadata.usage.total_tokens}`);
    console.log('\n--- Analysis ---');
    console.log(result.analysis);
    console.log('\n--- Sources Used ---');
    console.log(
      `Anchor: ${result.sources.anchor_verse.reference} - "${result.sources.anchor_verse.text}"`
    );
    console.log(
      `Cross-ref: ${result.sources.cross_reference.reference} - "${result.sources.cross_reference.text}"`
    );

    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// Example 2: Analysis with specific Gloo AI configuration
async function glooAIAnalysisExample() {
  console.log('=== Gloo AI Analysis (Specific Configuration) ===');

  const config: LLMClientConfig = {
    provider: 'gloo',
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 1500,
  };

  const service = new CrossReferenceAnalysisService(config);

  try {
    const result = await service.analyzeCrossReference({
      crossReference: exampleCrossReference,
      analysisType: 'academic',
      contextRange: 3,
      userObservation:
        'How do these passages relate to Pauline theology about justification?',
    });

    console.log('Academic Analysis Result:');
    console.log(result.analysis);

    return result;
  } catch (error) {
    console.error('Gloo AI analysis failed:', error);
    throw error;
  }
}

// Example 3: Analysis with OpenAI fallback
async function openAIFallbackExample() {
  console.log('=== OpenAI Fallback Analysis ===');

  const config: LLMClientConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000,
  };

  const service = new CrossReferenceAnalysisService(config);

  try {
    const result = await service.analyzeCrossReference({
      crossReference: exampleCrossReference,
      analysisType: 'devotional',
      userObservation: 'This gives me comfort during a difficult time',
    });

    console.log('Devotional Analysis Result:');
    console.log(result.analysis);

    return result;
  } catch (error) {
    console.error('OpenAI analysis failed:', error);

    // Fallback to default provider
    console.log('Falling back to default provider...');
    return analyzeCrossReference({
      crossReference: exampleCrossReference,
      analysisType: 'devotional',
    });
  }
}

// Example 4: Streaming analysis
async function streamingAnalysisExample() {
  console.log('=== Streaming Analysis ===');

  const service = new CrossReferenceAnalysisService();

  try {
    console.log('Starting streaming analysis...');
    let fullContent = '';
    let metadata: any = null;

    for await (const chunk of service.analyzeCrossReferenceStream({
      crossReference: exampleCrossReference,
      analysisType: 'study',
    })) {
      process.stdout.write(chunk.content);
      fullContent += chunk.content;

      if (chunk.done) {
        metadata = chunk.metadata;
        console.log('\n\n--- Streaming Complete ---');
        break;
      }
    }

    console.log(`\nFull response length: ${fullContent.length} characters`);
    console.log(`Model used: ${metadata?.model}`);
    console.log(`Provider: ${metadata?.provider}`);

    return { content: fullContent, metadata };
  } catch (error) {
    console.error('Streaming analysis failed:', error);
    throw error;
  }
}

// Example 5: Connection testing and provider comparison
async function providerComparisonExample() {
  console.log('=== Provider Comparison ===');

  const providers: LLMClientConfig[] = [
    { provider: 'gloo', model: 'gpt-4o-mini' },
    { provider: 'openai', model: 'gpt-4o-mini' },
  ];

  for (const config of providers) {
    console.log(`\nTesting ${config.provider} provider...`);

    const service = new CrossReferenceAnalysisService(config);
    const connectionTest = await service.testConnection();

    if (connectionTest.success) {
      console.log(`✓ ${config.provider} connected successfully`);
      console.log(`  Model: ${connectionTest.model}`);

      try {
        const startTime = Date.now();
        const result = await service.analyzeCrossReference({
          crossReference: exampleCrossReference,
          userObservation: 'Quick test analysis',
        });
        const responseTime = Date.now() - startTime;

        console.log(`  Response time: ${responseTime}ms`);
        console.log(`  Content length: ${result.analysis.length} characters`);
        console.log(`  Tokens used: ${result.llm_metadata.usage.total_tokens}`);
      } catch (error) {
        console.log(`  ✗ Analysis failed: ${error}`);
      }
    } else {
      console.log(
        `✗ ${config.provider} connection failed: ${connectionTest.error}`
      );
    }
  }
}

// Example 6: Error handling and retry logic
async function robustAnalysisExample() {
  console.log('=== Robust Analysis with Retry Logic ===');

  const primaryConfig: LLMClientConfig = { provider: 'gloo', model: 'gpt-4o' };
  const fallbackConfig: LLMClientConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
  };

  async function tryAnalysis(config: LLMClientConfig, label: string) {
    console.log(`Trying ${label}...`);
    const service = new CrossReferenceAnalysisService(config);

    try {
      const connectionTest = await service.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.error}`);
      }

      const result = await service.analyzeCrossReference({
        crossReference: exampleCrossReference,
        analysisType: 'default',
      });

      console.log(`✓ ${label} succeeded`);
      return result;
    } catch (error) {
      console.log(`✗ ${label} failed: ${error}`);
      throw error;
    }
  }

  try {
    // Try primary provider
    return await tryAnalysis(primaryConfig, 'Gloo AI (primary)');
  } catch (primaryError) {
    console.log('Primary provider failed, trying fallback...');

    try {
      // Try fallback provider
      return await tryAnalysis(fallbackConfig, 'OpenAI (fallback)');
    } catch (fallbackError) {
      console.log('All providers failed, using default configuration...');

      // Last resort: use default configuration
      return await analyzeCrossReference({
        crossReference: exampleCrossReference,
      });
    }
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    console.log('🚀 Running LLM Cross-Reference Analysis Examples\n');

    try {
      await basicAnalysisExample();
      console.log('\n' + '='.repeat(80) + '\n');

      await glooAIAnalysisExample();
      console.log('\n' + '='.repeat(80) + '\n');

      await openAIFallbackExample();
      console.log('\n' + '='.repeat(80) + '\n');

      await streamingAnalysisExample();
      console.log('\n' + '='.repeat(80) + '\n');

      await providerComparisonExample();
      console.log('\n' + '='.repeat(80) + '\n');

      await robustAnalysisExample();
    } catch (error) {
      console.error('Examples failed:', error);
    }
  })();
}

export {
  basicAnalysisExample,
  glooAIAnalysisExample,
  openAIFallbackExample,
  streamingAnalysisExample,
  providerComparisonExample,
  robustAnalysisExample,
};
