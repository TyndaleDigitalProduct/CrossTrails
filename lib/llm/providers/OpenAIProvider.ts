import {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamResponse,
} from '@/lib/types';

interface OpenAIConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  baseUrl: string;
}

/**
 * OpenAI Provider Implementation
 * Handles API communication with OpenAI's chat completions API
 */
export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  supportedModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ];
  supportsStreaming = true;

  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const payload = {
        model: request.model || this.config.model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.max_tokens ?? this.config.max_tokens,
        stream: false,
      };

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        },
        finish_reason:
          data.choices[0].finish_reason === 'stop'
            ? 'stop'
            : data.choices[0].finish_reason === 'length'
              ? 'length'
              : 'error',
        metadata: {
          response_time_ms: responseTime,
          provider: 'openai',
          raw_response: data,
        },
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(
        `OpenAI request failed: ${error instanceof Error ? error.message : String(error)}`
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

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API error ${response.status}: ${await response.text()}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
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
                const delta = parsed.choices[0]?.delta;

                if (delta?.content) {
                  yield {
                    content: delta.content,
                    done: false,
                    model: parsed.model,
                  };
                }

                if (parsed.choices[0]?.finish_reason) {
                  yield {
                    content: '',
                    done: true,
                    model: parsed.model,
                    usage: parsed.usage,
                  };
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error(
        `OpenAI streaming failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check with minimal request
      const response = await this.chat({
        messages: [{ role: 'user', content: 'test' }],
        model: this.config.model,
        max_tokens: 1,
      });
      return !!response.content;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}
