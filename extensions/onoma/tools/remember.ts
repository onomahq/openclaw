import { Type } from '@sinclair/typebox';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import type { OnomaClient } from '../client';
import type { OnomaConfig } from '../config';

export function registerRememberTool(
  api: OpenClawPluginApi,
  client: OnomaClient,
  cfg: OnomaConfig
): void {
  api.registerTool(
    {
      name: 'onoma_remember',
      label: 'Store in Onoma Memory',
      description: 'Explicitly store a fact or piece of information in your Onoma memory.',
      parameters: Type.Object({
        content: Type.String({
          description: 'The information to remember (must be a complete sentence, not a fragment)',
        }),
        contextType: Type.Optional(
          Type.String({
            description: 'The type of context (default: user_fact)',
            enum: ['user_fact', 'preference', 'goal', 'relationship', 'event', 'knowledge'],
          })
        ),
      }),
      async execute(
        _toolCallId: string,
        params: { content: string; contextType?: string }
      ) {
        const contextType = params.contextType || 'user_fact';

        if (cfg.debug && api.logger.debug) {
          api.logger.debug(
            `onoma_remember: storing ${contextType} (${params.content.length} chars)`
          );
        }

        if (params.content.length < 10) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Content must be at least 10 characters (use complete sentences, not fragments)',
              },
            ],
            details: { error: 'Content too short' },
          };
        }

        try {
          const memory = await client.createMemory(params.content, contextType);

          return {
            content: [
              {
                type: 'text' as const,
                text: `Successfully stored: "${params.content}"`,
              },
            ],
            details: {
              id: memory.id,
              content: memory.content,
              type: memory.context_type,
              created_at: memory.created_at,
            },
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          api.logger.error(`onoma_remember failed: ${errorMsg}`);
          return {
            content: [
              {
                type: 'text' as const,
                text: `Failed to store memory: ${errorMsg}`,
              },
            ],
            details: { error: errorMsg },
          };
        }
      },
    },
    { name: 'onoma_remember' }
  );
}
