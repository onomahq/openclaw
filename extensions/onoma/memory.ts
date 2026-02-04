export function buildSessionId(sessionKey: string): string {
  return sessionKey
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
