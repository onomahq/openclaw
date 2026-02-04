import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import type { OnomaClient } from '../client';
import type { OnomaConfig } from '../config';

export function registerSearchTool(
  api: OpenClawPluginApi,
  client: OnomaClient,
  cfg: OnomaConfig
): void {
  api.registerTool(
    {
      name: 'onoma_search',
      label: 'Search Onoma Memories',
      description: 'Search through your Onoma memories semantically for relevant information.',
      parameters: Type.Object({
        query: Type.String({ description: 'Search query to find relevant memories' }),
        limit: Type.Optional(
          Type.Number({ description: 'Maximum number of results to return (default: 10)' })
        ),
      }),
      async execute(_toolCallId: string, params: { query: string; limit?: number }) {
        const limit = params.limit ?? cfg.maxRecallResults;

        if (cfg.debug && api.logger.debug) {
          api.logger.debug(`onoma_search: query="${params.query}" limit=${limit}`);
        }

        try {
          const results = await client.searchMemories(params.query, limit);

          if (results.memories.length === 0) {
            return {
              content: [{ type: 'text' as const, text: 'No relevant memories found.' }],
              details: { count: 0, memories: [] },
            };
          }

          const text = results.memories
            .map((m, i) => {
              const date = new Date(m.created_at).toLocaleDateString();
              const confidence = Math.round(m.confidence * 100);
              return `${i + 1}. ${m.content}\n   (${m.temporal_class}, ${date}, ${confidence}% relevance)`;
            })
            .join('\n\n');

          return {
            content: [
              {
                type: 'text' as const,
                text: `Found ${results.memories.length} relevant memories:\n\n${text}`,
              },
            ],
            details: {
              count: results.memories.length,
              memories: results.memories.map((m) => ({
                id: m.id,
                content: m.content,
                type: m.context_type,
                temporal_class: m.temporal_class,
                confidence: m.confidence,
                created_at: m.created_at,
              })),
            },
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          api.logger.error(`onoma_search failed: ${errorMsg}`);
          return {
            content: [
              {
                type: 'text' as const,
                text: `Search failed: ${errorMsg}`,
              },
            ],
            details: { error: errorMsg },
          };
        }
      },
    },
    { name: 'onoma_search' }
  );
}
