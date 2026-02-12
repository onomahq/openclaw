import type {
  OpenClawPluginApi,
  ProviderAuthContext,
  ProviderAuthResult,
} from 'openclaw/plugin-sdk';

const DEFAULT_API_URL = 'https://completion.askonoma.com';

function buildAutoModel() {
  return {
    id: 'auto',
    name: 'Onoma Auto',
    api: 'openai-completions' as const,
    reasoning: true,
    input: ['text', 'image'] as Array<'text' | 'image'>,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 200000,
    maxTokens: 16384,
  };
}

function resolveConfig(pluginConfig: Record<string, unknown> | undefined) {
  const cfg = pluginConfig ?? {};
  const apiToken =
    (typeof cfg.apiToken === 'string' && cfg.apiToken) ||
    process.env.ONOMA_API_TOKEN ||
    '';
  const apiUrl =
    (typeof cfg.apiUrl === 'string' && cfg.apiUrl) ||
    process.env.ONOMA_API_URL ||
    DEFAULT_API_URL;
  return { apiToken, apiUrl: apiUrl.replace(/\/+$/, '') };
}

export default {
  id: 'onoma-provider',
  name: 'Onoma',
  description: 'AI model provider powered by Onoma',

  register(api: OpenClawPluginApi) {
    const { apiToken, apiUrl } = resolveConfig(api.pluginConfig);

    api.registerProvider({
      id: 'onoma',
      label: 'Onoma',
      envVars: ['ONOMA_API_TOKEN', 'ONOMA_API_URL'],
      ...(apiToken
        ? {
            models: {
              baseUrl: `${apiUrl}/v1`,
              apiKey: apiToken,
              api: 'openai-completions',
              authHeader: true,
              models: [buildAutoModel()],
            },
          }
        : {}),
      auth: [
        {
          id: 'api_key',
          label: 'API Key',
          hint: 'Enter your Onoma API token (onm_...)',
          kind: 'custom',
          run: async (ctx: ProviderAuthContext): Promise<ProviderAuthResult> => {
            const token = await ctx.prompter.text({
              message: 'Onoma API Token',
              initialValue: process.env.ONOMA_API_TOKEN || '',
              validate: (v: string) =>
                v.trim().startsWith('onm_') ? undefined : 'Must start with onm_',
            });
            const url = await ctx.prompter.text({
              message: 'Onoma API URL',
              initialValue: process.env.ONOMA_API_URL || DEFAULT_API_URL,
            });
            const baseUrl = url.replace(/\/+$/, '') + '/v1';

            return {
              profiles: [
                {
                  profileId: 'onoma:default',
                  credential: {
                    type: 'token',
                    provider: 'onoma',
                    token: token.trim(),
                  },
                },
              ],
              configPatch: {
                models: {
                  providers: {
                    onoma: {
                      baseUrl,
                      apiKey: token.trim(),
                      api: 'openai-completions',
                      authHeader: true,
                      models: [buildAutoModel()],
                    },
                  },
                },
              },
              defaultModel: 'onoma/auto',
              notes: [
                'Onoma "auto" routes to the best model automatically.',
              ],
            };
          },
        },
      ],
    });
  },
};
