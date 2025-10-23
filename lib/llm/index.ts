// Export main services
export {
  CrossReferenceAnalysisService,
  analyzeCrossReference,
  analyzeCrossReferenceWithConfig,
} from './CrossReferenceAnalysisService';
export { LLMClientFactory, llmClientFactory } from './LLMClientFactory';

// Export providers
export { GlooAIProvider } from './providers/GlooAIProvider';
export { OpenAIProvider } from './providers/OpenAIProvider';

// Re-export relevant types for convenience
export type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamResponse,
  LLMClientConfig,
  CrossReferenceAnalysisRequest,
  CrossReferenceAnalysisResponse,
} from '@/lib/types';
