export interface OnomaConfig {
  apiUrl: string;
  apiToken: string;
  autoRecall: boolean;
  autoCapture: boolean;
  maxRecallResults: number;
  spaceMapping: Record<string, string>;
  debug: boolean;
}

const ALLOWED_KEYS = [
  'apiUrl',
  'apiToken',
  'autoRecall',
  'autoCapture',
  'maxRecallResults',
  'spaceMapping',
  'debug',
];

function resolveEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, envVar: string) => {
    const envValue = process.env[envVar];
    if (!envValue) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }
    return envValue;
  });
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowed: string[],
  label: string
): void {
  const unknown = Object.keys(value).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw new Error(`${label} has unknown keys: ${unknown.join(', ')}`);
  }
}

export function parseConfig(raw: unknown): OnomaConfig {
  const cfg =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  if (Object.keys(cfg).length > 0) {
    assertAllowedKeys(cfg, ALLOWED_KEYS, 'onoma config');
  }

  const apiToken =
    typeof cfg.apiToken === 'string' && cfg.apiToken.length > 0
      ? resolveEnvVars(cfg.apiToken)
      : process.env.ONOMA_API_TOKEN;

  if (!apiToken) {
    throw new Error(
      'onoma: apiToken is required (set in plugin config or ONOMA_API_TOKEN env var)'
    );
  }

  const apiUrl =
    typeof cfg.apiUrl === 'string' && cfg.apiUrl.length > 0
      ? resolveEnvVars(cfg.apiUrl)
      : process.env.ONOMA_API_URL || 'https://api.askonoma.com';

  return {
    apiUrl,
    apiToken,
    autoRecall: (cfg.autoRecall as boolean) ?? true,
    autoCapture: (cfg.autoCapture as boolean) ?? true,
    maxRecallResults: (cfg.maxRecallResults as number) ?? 5,
    spaceMapping: (cfg.spaceMapping as Record<string, string>) ?? {},
    debug: (cfg.debug as boolean) ?? false,
  };
}

export const onomaConfigSchema = {
  parse: parseConfig,
};
