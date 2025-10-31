import {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamResponse,
} from '@/lib/types';
import { makeAuthenticatedRequest, ensureValidToken } from '@/lib/utils/auth';

interface GlooAIConfig {
  clientId?: string;
  clientSecret?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  baseUrl: string;
}

/**
 * Gloo AI Provider Implementation
 * Handles authentication and API communication with Gloo AI platform
 */
export class GlooAIProvider implements LLMProvider {
  name = 'Gloo AI';
  supportedModels = [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4',
    'gpt-3.5-turbo',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];
  supportsStreaming = true;

  private config: GlooAIConfig;

  constructor(config: GlooAIConfig) {
    this.config = config;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Prepare the request payload for Gloo AI - using standard chat completions format
      const payload = {
        model: request.model || this.config.model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.max_tokens ?? this.config.max_tokens,
        stream: false,
      };

      // Use the correct Gloo AI endpoint - based on their API documentation
      // Base URL: https://platform.ai.gloo.com/ai/v1
      const endpoint = `${this.config.baseUrl}/ai/v1/chat/completions`;
      const response = await makeAuthenticatedRequest(endpoint, payload);

      const responseTime = Date.now() - startTime;

      return {
        content: this.extractContent(response),
        model: response.model || payload.model,
        usage: this.extractUsage(response),
        finish_reason: this.extractFinishReason(response),
        metadata: {
          response_time_ms: responseTime,
          provider: 'gloo',
          raw_response: response,
        },
      };
    } catch (error) {
      console.error('Gloo AI API error:', error);
      throw new Error(
        `Gloo AI request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamResponse> {
    try {
      const payload = {
        model: request.model || this.config.model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.max_tokens ?? this.config.max_tokens,
        stream: true,
      };

      // Get access token for streaming request
      const token = await ensureValidToken();
      const endpoint = `${this.config.baseUrl}/ai/v1/chat/completions`;

      // Make streaming request to Gloo AI
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gloo AI streaming error ${response.status}: ${errorText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available for streaming');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              if (data === '[DONE]') {
                yield { content: '', done: true };
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;

                if (delta?.content) {
                  yield {
                    content: delta.content,
                    done: false,
                    model: parsed.model,
                  };
                }

                if (parsed.choices?.[0]?.finish_reason) {
                  yield {
                    content: '',
                    done: true,
                    model: parsed.model,
                    usage: parsed.usage,
                  };
                  return;
                }
              } catch (parseError) {
                console.warn(
                  'Failed to parse Gloo AI streaming chunk:',
                  parseError
                );
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Gloo AI streaming error:', error);

      // Fallback to non-streaming if streaming fails
      console.log('Falling back to non-streaming chat completion...');
      const response = await this.chat({ ...request, stream: false });

      // Simulate streaming by yielding the full response
      yield {
        content: response.content,
        done: true,
        model: response.model,
        usage: response.usage,
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - ensure we can get a valid token
      await ensureValidToken();
      return true;
    } catch (error) {
      console.error('Gloo AI health check failed:', error);
      return false;
    }
  }

  private extractContent(response: any): string {
    // Adjust this based on actual Gloo AI response format
    if (
      response.choices &&
      response.choices[0] &&
      response.choices[0].message
    ) {
      return response.choices[0].message.content || '';
    }
    if (response.content) {
      return response.content;
    }
    if (response.text) {
      return response.text;
    }
    return String(response);
  }

  private extractUsage(response: any): {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } {
    if (response.usage) {
      return {
        prompt_tokens: response.usage.prompt_tokens || 0,
        completion_tokens: response.usage.completion_tokens || 0,
        total_tokens: response.usage.total_tokens || 0,
      };
    }

    // Fallback estimation if usage not provided
    return {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
  }

  private extractFinishReason(response: any): 'stop' | 'length' | 'error' {
    if (
      response.choices &&
      response.choices[0] &&
      response.choices[0].finish_reason
    ) {
      const reason = response.choices[0].finish_reason;
      if (reason === 'stop' || reason === 'length') {
        return reason;
      }
    }
    return 'stop'; // Default assumption
  }
}
