import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import type { OnomaClient, Memory } from '../client';
import type { OnomaConfig } from '../config';

export function buildRecallHandler(
  api: OpenClawPluginApi,
  client: OnomaClient,
  cfg: OnomaConfig
) {
  return async (event: Record<string, unknown>) => {
    const prompt = event.prompt as string | undefined;

    if (!prompt || prompt.length < 5) {
      return;
    }

    try {
      const results = await client.searchMemories(prompt, cfg.maxRecallResults);

      if (results.memories.length === 0) {
        return;
      }

      if (cfg.debug && api.logger.debug) {
        api.logger.debug(
          `onoma recall: found ${results.memories.length} relevant memories for query`
        );
      }

      const context = formatContext(results.memories);

      return { prependContext: context };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      api.logger.error(`onoma recall failed: ${errorMsg}`);
      return;
    }
  };
}

function formatContext(memories: Memory[]): string {
  const lines = memories
    .map((m, i) => {
      const date = new Date(m.created_at).toLocaleDateString();
      return `${i + 1}. ${m.content} (${m.temporal_class}, ${date})`;
    })
    .join('\n');

  return `<onoma-context>\nRelevant memories:\n\n${lines}\n</onoma-context>`;
}
