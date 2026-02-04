import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { OnomaClient } from '../client';
import type { OnomaConfig } from '../config';
import { buildSessionId } from '../memory';

export function buildCaptureHandler(
  api: OpenClawPluginApi,
  client: OnomaClient,
  cfg: OnomaConfig,
  getSessionKey: () => string | undefined
) {
  return async (event: Record<string, unknown>) => {
    if (!event.success || !Array.isArray(event.messages)) {
      return;
    }

    const lastTurn = getLastTurn(event.messages);

    if (lastTurn.length === 0) {
      return;
    }

    const convertedMessages = lastTurn.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })) as ChatCompletionMessageParam[];

    const sessionKey = getSessionKey();
    const metadata = {
      source: 'openclaw',
      timestamp: new Date().toISOString(),
      ...(sessionKey && { session_id: buildSessionId(sessionKey) }),
    };

    try {
      const memories = await client.extractContext(convertedMessages, metadata);

      if (cfg.debug && memories.length > 0 && api.logger.debug) {
        api.logger.debug(
          `onoma capture: stored ${memories.length} memories from conversation${sessionKey ? ` (session: ${buildSessionId(sessionKey)})` : ''}`
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      api.logger.error(`onoma capture failed: ${errorMsg}`);
    }
  };
}

function getLastTurn(
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  const result: Array<{ role: string; content: string }> = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant') {
      result.unshift(msg);
    } else if (msg.role === 'user') {
      result.unshift(msg);
      break;
    }
  }

  return result;
}
