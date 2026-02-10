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
    const params = new URLSearchParams({
      q: query,
      limit: String(limit || this.config.maxRecallResults),
    });
    const response = await fetch(`${this.config.apiUrl}/v1/memory/search?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search memories: ${response.statusText}`);
    }

    const contexts = (await response.json()) as any[];
    return {
      memories: contexts.map((c) => ({
        id: c.id,
        content: c.content,
        context_type: c.context_type,
        temporal_class: c.temporal_class,
        confidence: c.confidence,
        created_at: c.created_at,
        message_id: c.message_id,
        space_id: c.space_id,
      })),
      total: contexts.length,
    };
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
    const response = await fetch(`${this.config.apiUrl}/v1/memory/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiToken}`,
      },
      body: JSON.stringify({ messages, metadata }),
    });

    if (!response.ok) {
      throw new Error(`Extract failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { memories: Memory[]; count: number };
    return data.memories;
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
