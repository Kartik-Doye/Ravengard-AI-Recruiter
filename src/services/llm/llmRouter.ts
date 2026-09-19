import { OpenAI } from 'openai';

/**
 * LLM Router with automatic failover across multiple providers
 * Uses OpenAI SDK format for compatibility with various providers
 */
class LLMRouter {
  private providers: Array<{
    name: string;
    client: OpenAI;
    enabled: boolean;
  }>;

  constructor() {
    this.providers = [];
    this.initializeProviders();
  }

  private initializeProviders() {
    // Google AI Studio (Gemini) via OpenAI-compatible endpoint
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiClient = new OpenAI({
          apiKey: process.env.GEMINI_API_KEY,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        });
        this.providers.push({ name: 'gemini', client: geminiClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize Gemini client:', error);
      }
    }

    // Groq Cloud
    if (process.env.GROQ_API_KEY) {
      try {
        const groqClient = new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: 'https://api.groq.com/openai/v1',
        });
        this.providers.push({ name: 'groq', client: groqClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize Groq client:', error);
      }
    }

    // OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const openrouterClient = new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': process.env.APP_URL || 'https://ravengard.ai',
            'X-Title': 'Ravengard AI Recruiter',
          },
        });
        this.providers.push({ name: 'openrouter', client: openrouterClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize OpenRouter client:', error);
      }
    }

    // Mistral AI
    if (process.env.MISTRAL_API_KEY) {
      try {
        const mistralClient = new OpenAI({
          apiKey: process.env.MISTRAL_API_KEY,
          baseURL: 'https://api.mistral.ai/v1',
        });
        this.providers.push({ name: 'mistral', client: mistralClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize Mistral client:', error);
      }
    }

    // NVIDIA NIM
    if (process.env.NVIDIA_API_KEY) {
      try {
        const nvidiaClient = new OpenAI({
          apiKey: process.env.NVIDIA_API_KEY,
          baseURL: 'https://integrate.api.nvidia.com/v1',
        });
        this.providers.push({ name: 'nvidia', client: nvidiaClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize NVIDIA client:', error);
      }
    }

    // Cloudflare Workers AI
    if (process.env.CLOUDFLARE_API_KEY && process.env.CLOUDFLARE_ACCOUNT_ID) {
      try {
        const cloudflareClient = new OpenAI({
          apiKey: process.env.CLOUDFLARE_API_KEY,
          baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/`,
        });
        this.providers.push({ name: 'cloudflare', client: cloudflareClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize Cloudflare client:', error);
      }
    }

    // GitHub Models
    if (process.env.GITHUB_TOKEN) {
      try {
        const githubClient = new OpenAI({
          apiKey: process.env.GITHUB_TOKEN,
          baseURL: 'https://models.inference.ai.azure.com',
        });
        this.providers.push({ name: 'github', client: githubClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize GitHub Models client:', error);
      }
    }

    // SiliconFlow
    if (process.env.SILICONFLOW_API_KEY) {
      try {
        const siliconflowClient = new OpenAI({
          apiKey: process.env.SILICONFLOW_API_KEY,
          baseURL: 'https://api.siliconflow.cn/v1',
        });
        this.providers.push({ name: 'siliconflow', client: siliconflowClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize SiliconFlow client:', error);
      }
    }

    // Cohere
    if (process.env.COHERE_API_KEY) {
      try {
        const cohereClient = new OpenAI({
          apiKey: process.env.COHERE_API_KEY,
          baseURL: 'https://api.cohere.ai/v1',
        });
        this.providers.push({ name: 'cohere', client: cohereClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize Cohere client:', error);
      }
    }

    // Qwen Studio
    if (process.env.QWEN_API_KEY) {
      try {
        const qwenClient = new OpenAI({
          apiKey: process.env.QWEN_API_KEY,
          baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        });
        this.providers.push({ name: 'qwen', client: qwenClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize Qwen client:', error);
      }
    }

    // Hugging Face Inference API
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const hfClient = new OpenAI({
          apiKey: process.env.HUGGINGFACE_API_KEY,
          baseURL: 'https://api-inference.huggingface.co/v1/',
        });
        this.providers.push({ name: 'huggingface', client: hfClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize Hugging Face client:', error);
      }
    }

    // Ollama (local)
    if (process.env.OLLAMA_BASE_URL) {
      try {
        const ollamaClient = new OpenAI({
          apiKey: 'ollama', // required but unused
          baseURL: process.env.OLLAMA_BASE_URL,
        });
        this.providers.push({ name: 'ollama', client: ollamaClient, enabled: true });
      } catch (error) {
        console.warn('Failed to initialize Ollama client:', error);
      }
    }

    // Sort providers by preference (can be customized via env)
    const priority = process.env.LLM_PROVIDER_PRIORITY?.split(',') || [];
    this.providers.sort((a, b) => {
      const indexA = priority.indexOf(a.name);
      const indexB = priority.indexOf(b.name);
      // If not in priority list, put at end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    console.info(`LLM Router initialized with ${this.providers.length} providers:`,
      this.providers.map(p => `${p.name}${p.enabled ? '' : '(disabled)'}`).join(', '));
  }

  /**
   * Get list of enabled providers
   */
  getEnabledProviders() {
    return this.providers.filter(p => p.enabled);
  }

  /**
   * Generate text completion with automatic failover
   * @param params - OpenAI-compatible completion parameters
   * @returns OpenAI completion response
   */
  async chatCompletion(params: any) {
    const lastErrors: Array<{ provider: string; error: any }> = [];

    for (const provider of this.getEnabledProviders()) {
      try {
        const response = await provider.client.chat.completions.create(params);
        return response;
      } catch (error: any) {
        // Check if error is retryable (429 rate limit, 5xx server error)
        const status = error.status || error.statusCode;
        const isRetryable = status === 429 || (status >= 500 && status < 600);

        lastErrors.push({ provider: provider.name, error });

        if (!isRetryable) {
          // For non-retryable errors, don't try other providers
          throw error;
        }

        // Log and continue to next provider
        console.warn(`LLM provider ${provider.name} failed (${status}):`, error.message);
      }
    }

    // All providers failed
    const errorSummary = lastErrors.map(e => `${e.provider}: ${e.error.message}`).join('; ');
    throw new Error(`All LLM providers failed. Errors: ${errorSummary}`);
  }

  /**
   * Generate text completion with streaming
   * @param params - OpenAI-compatible completion parameters with stream: true
   * @returns Async iterable stream
   */
  async *chatCompletionStream(params: any) {
    const lastErrors: Array<{ provider: string; error: any }> = [];

    for (const provider of this.getEnabledProviders()) {
      try {
        const stream = await provider.client.chat.completions.create({
          ...params,
          stream: true,
        });

        // Yield each chunk from the stream
        for await (const chunk of stream) {
          yield chunk;
        }
        return; // Success, exit
      } catch (error: any) {
        const status = error.status || error.statusCode;
        const isRetryable = status === 429 || (status >= 500 && status < 600);

        lastErrors.push({ provider: provider.name, error });

        if (!isRetryable) {
          throw error;
        }

        console.warn(`LLM provider ${provider.name} stream failed (${status}):`, error.message);
      }
    }

    const errorSummary = lastErrors.map(e => `${e.provider}: ${e.error.message}`).join('; ');
    throw new Error(`All LLM providers failed for streaming. Errors: ${errorSummary}`);
  }

  /**
   * Generate structured JSON output with validation and failover
   * @param params - OpenAI-compatible parameters with response_format: { type: "json_object" }
   * @param schema - Zod schema for validation
   * @returns Parsed and validated JSON object
   */
  async structuredOutput<T>(
    params: any,
    schema: any
  ): Promise<T> {
    const lastErrors: Array<{ provider: string; error: any }> = [];

    for (const provider of this.getEnabledProviders()) {
      try {
        const response = await provider.client.chat.completions.create({
          ...params,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message.content;
        if (!content) {
          throw new Error('Empty response from LLM');
        }

        const parsed = JSON.parse(content);
        // Validate with Zod schema
        const validated = schema.parse(parsed);
        return validated;
      } catch (error: any) {
        const status = error.status || error.statusCode;
        const isRetryable = status === 429 || (status >= 500 && status < 600);

        lastErrors.push({ provider: provider.name, error });

        if (!isRetryable) {
          // For non-retryable errors (including validation errors), don't retry
          throw error;
        }

        console.warn(`LLM provider ${provider.name} structured output failed (${status}):`, error.message);
      }
    }

    const errorSummary = lastErrors.map(e => `${e.provider}: ${e.error.message}`).join('; ');
    throw new Error(`All LLM providers failed for structured output. Errors: ${errorSummary}`);
  }
}

// Export singleton instance
export const llmRouter = new LLMRouter();
export type { LLMRouter };