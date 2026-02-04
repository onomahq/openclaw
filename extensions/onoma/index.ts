import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { OnomaClient } from './client';
import { parseConfig, onomaConfigSchema } from './config';
import { registerSearchTool } from './tools/search';
import { registerRememberTool } from './tools/remember';
import { buildRecallHandler } from './hooks/recall';
import { buildCaptureHandler } from './hooks/capture';

export default {
  id: 'onoma',
  name: 'Onoma',
  description: 'Onoma memory integration - Automatic context recall and capture',
  kind: 'memory' as const,
  configSchema: onomaConfigSchema,

  register(api: OpenClawPluginApi) {
    const cfg = parseConfig(api.pluginConfig);
    const client = new OnomaClient(cfg);

    let sessionKey: string | undefined;
    const getSessionKey = () => sessionKey;

    // Register tools
    registerSearchTool(api, client, cfg);
    registerRememberTool(api, client, cfg);

    // Register hooks
    if (cfg.autoRecall) {
      const recallHandler = buildRecallHandler(api, client, cfg);
      api.on('before_agent_start', (event, ctx) => {
        if (ctx.sessionKey) {
          sessionKey = ctx.sessionKey as string;
        }
        return recallHandler(event);
      });
    }

    if (cfg.autoCapture) {
      api.on('agent_end', buildCaptureHandler(api, client, cfg, getSessionKey));
    }

    // Register CLI commands
    api.registerCli(
      ({ program }) => {
        const onoma = program.command('onoma').description('Onoma memory operations');

        onoma
          .command('search <query>')
          .description('Search your Onoma memories')
          .action(async (query: string) => {
            try {
              const results = await client.searchMemories(query);

              if (results.memories.length === 0) {
                console.log('No relevant memories found.');
                return;
              }

              console.log(`\nFound ${results.memories.length} relevant memories:\n`);

              results.memories.forEach((m, i) => {
                const date = new Date(m.created_at).toLocaleDateString();
                const confidence = Math.round(m.confidence * 100);
                console.log(
                  `${i + 1}. ${m.content}\n   (${m.temporal_class}, ${date}, ${confidence}% relevance)\n`
                );
              });
            } catch (error) {
              console.error(
                `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
              process.exit(1);
            }
          });

        onoma
          .command('spaces')
          .description('List your Onoma spaces')
          .action(async () => {
            try {
              const spaces = await client.listSpaces();

              if (spaces.length === 0) {
                console.log('No spaces found.');
                return;
              }

              console.log(`\nYour Onoma spaces:\n`);

              spaces.forEach((space) => {
                console.log(`• ${space.name}`);
                if (space.topics.length > 0) {
                  console.log(`  Topics: ${space.topics.join(', ')}`);
                }
                console.log(`  Active: ${space.is_active ? 'Yes' : 'No'}`);
                console.log(`  Contexts: ${space.context_count}\n`);
              });
            } catch (error) {
              console.error(
                `Failed to list spaces: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
              process.exit(1);
            }
          });

        onoma
          .command('stats')
          .description('Show your Onoma memory statistics')
          .action(async () => {
            try {
              const stats = await client.getMemoryStats();

              console.log('\nOnoma Memory Statistics:\n');
              console.log(`Total contexts: ${stats.total_contexts}`);
              console.log(`Total spaces: ${stats.total_spaces}`);
              console.log(`Recent contexts: ${stats.recent_contexts}\n`);
            } catch (error) {
              console.error(
                `Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
              process.exit(1);
            }
          });
      },
      { commands: ['onoma'] }
    );

    // Register service
    api.registerService({
      id: 'onoma',
      start: () => {
        api.logger.info('onoma: connected');
      },
      stop: () => {
        api.logger.info('onoma: stopped');
      },
    });
  },
};
