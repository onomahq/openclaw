import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { OnomaConfig } from './config';

export interface Memory {
  id: string;
  content: string;
  context_type: string;
  temporal_class: string;
  confidence: number;
  created_at: string;
  message_id?: string;
  space_id?: string;
}

export interface Space {
  id: string;
  name: string;
  confidence: number;
  status: string;
  is_auto: boolean;
  is_active: boolean;
  context_count: number;
  topics: string[];
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemorySearchResult {
  memories: Memory[];
  total: number;
}

export interface MemoryStats {
  total_contexts: number;
  total_spaces: number;
  recent_contexts: number;
}

interface SpacesResponse {
  spaces: Space[];
}

export class OnomaClient {
  private config: OnomaConfig;
  private client: OpenAI;

  constructor(config: OnomaConfig) {
    this.config = config;

    this.client = new OpenAI({
      baseURL: `${this.config.apiUrl}/v1`,
      apiKey: this.config.apiToken,
    });
  }

  async searchMemories(query: string, limit?: number): Promise<MemorySearchResult> {
    const response = await fetch(`${this.config.apiUrl}/v1/memory/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiToken}`,
      },
      body: JSON.stringify({
        query,
        limit: limit || this.config.maxRecallResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search memories: ${response.statusText}`);
    }

    return (await response.json()) as MemorySearchResult;
  }

  async getMemoryStats(): Promise<MemoryStats> {
    const response = await fetch(`${this.config.apiUrl}/v1/memory/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get memory stats: ${response.statusText}`);
    }

    return (await response.json()) as MemoryStats;
  }

  async listSpaces(): Promise<Space[]> {
    const response = await fetch(`${this.config.apiUrl}/v1/spaces`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list spaces: ${response.statusText}`);
    }

    const data = (await response.json()) as SpacesResponse;
    return data.spaces || [];
  }

  async createMemory(
    content: string,
    contextType: string = 'user_fact',
    metadata?: Record<string, any>
  ): Promise<Memory> {
    const response = await fetch(`${this.config.apiUrl}/v1/memory/contexts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiToken}`,
      },
      body: JSON.stringify({
        content,
        context_type: contextType,
        ...(metadata && { metadata }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create memory: ${response.statusText}`);
    }

    return (await response.json()) as Memory;
  }

  async extractContext(
    messages: ChatCompletionMessageParam[],
    metadata?: Record<string, any>
  ): Promise<Memory[]> {
    const response = await this.client.chat.completions.create({
      model: 'cortex',
      messages: [
        {
          role: 'system',
          content:
            'Extract factual information and memories from this conversation. Return full sentences, not fragments.',
        },
        ...messages,
      ],
      stream: false,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    // Parse extracted contexts from response
    const lines = content.split('\n').filter((line) => line.trim());
    const memories: Memory[] = [];

    for (const line of lines) {
      if (line.length > 10) {
        try {
          const memory = await this.createMemory(line, 'extracted', metadata);
          memories.push(memory);
        } catch (error) {
          console.error(`Failed to store memory: ${error}`);
        }
      }
    }

    return memories;
  }

  async chat(
    messages: ChatCompletionMessageParam[],
    options?: {
      stream?: boolean;
      model?: string;
      maxTokens?: number;
    }
  ): Promise<any> {
    return this.client.chat.completions.create({
      model: options?.model || 'onoma/memory',
      messages,
      stream: options?.stream ?? false,
      max_tokens: options?.maxTokens,
    });
  }
}

export function createClient(config: OnomaConfig): OnomaClient {
  return new OnomaClient(config);
}
