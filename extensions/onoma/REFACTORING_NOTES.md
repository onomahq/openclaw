# Onoma OpenClaw Plugin Refactoring Notes

## Status: Complete ✓

Plugin location: `/Users/Mischa/Github/onoma/openclaw/extensions/onoma/`
Installed at: `~/.openclaw/extensions/onoma/` (currently shows as "loaded")

## Completed ✓

1. **config.ts** - Updated with proper parseConfig() pattern
   - Env var resolution: `${VARIABLE}` syntax
   - Exports `onomaConfigSchema = { parse: parseConfig }`
   - Added `debug` field

2. **client.ts** - Updated constructor
   - Now takes `OnomaConfig` directly (not Partial)
   - Removed `getConfig()` dependency

3. **tools/search.ts** - Rewritten with TypeBox
   - Uses `Type.Object()` for parameters
   - Returns `{ content: [...], details: {...} }` (details always present)
   - Proper error handling with api.logger
   - Fixed logger calls to pass single string parameter

4. **tools/remember.ts** - Rewritten with TypeBox
   - Same pattern as search tool
   - Returns proper OpenClaw tool response format
   - Fixed logger calls to pass single string parameter

5. **@sinclair/typebox** - Installed as dependency

6. **hooks/recall.ts** - Created following supermemory pattern
   - Exports buildRecallHandler(api, client, cfg)
   - Returns { prependContext: context } for auto-recall
   - Proper error handling with logger

7. **hooks/capture.ts** - Created following supermemory pattern
   - Exports buildCaptureHandler(api, client, cfg, getSessionKey)
   - Calls client.extractContext() to store memories
   - Proper error handling with logger

8. **index.ts** - Completely rewritten
   - Uses configSchema: onomaConfigSchema
   - Registers hooks with api.on('before_agent_start', ...) and api.on('agent_end', ...)
   - Registers tools using registerSearchTool() and registerRememberTool()
   - Registers CLI commands (openclaw onoma search|spaces|stats)
   - Registers service with start/stop handlers
   - Session key tracking for context association

9. **openclaw.plugin.json** - Updated configSchema
   - Changed to reference parse function: `{ "parse": "./config.ts" }`
   - Kept uiHints for UI display

10. **package.json** - Added openclaw devDependency
    - Added "openclaw": "^2026.2.1" to devDependencies
    - Required for TypeScript compilation

11. **tsconfig.json** - Updated module resolution
    - Changed module from "commonjs" to "ES2020"
    - Changed moduleResolution from "node" to "bundler"
    - Removed commands/*.ts from include (no longer exists)

12. **Cleanup** - Removed old files
    - Deleted commands/ directory (CLI now in index.ts)
    - Deleted hooks/auto-recall.ts (replaced with hooks/recall.ts)
    - Deleted hooks/auto-capture.ts (replaced with hooks/capture.ts)
    - Deleted tools/spaces.ts (functionality now in CLI)

## All Refactoring Complete ✓

The plugin has been completely refactored following the supermemory pattern and successfully installed in OpenClaw.

## Backend Integration (Already Complete)

### Platform ✓
- Migration: `integration_tokens` table
- Model: `IntegrationToken` with token hashing
- Controller: `IntegrationTokenController`
- Routes: `/api/v1/integrations/tokens` + `/api/internal/integrations/tokens/validate`
- UI: `ManageIntegrationTokens` Livewire component at `/manage/integration-tokens`

### Cortex ✓
- Dual auth in `auth/service_auth.py`
- `verify_integration_token()` calls Platform for validation
- `verify_service_token()` routes `onoma_` tokens to integration handler

## Testing Steps

1. **Get API Token**:
   - Visit https://onoma.test/manage/integration-tokens
   - Create token with scopes: chat:write, memory:read, memory:write
   - Copy token (starts with `onoma_`)

2. **Configure OpenClaw**:
   ```bash
   openclaw config set plugins.entries.onoma.config.apiToken "onoma_..."
   ```

3. **Test CLI**:
   ```bash
   openclaw onoma spaces
   openclaw onoma stats
   openclaw onoma search "test query"
   ```

4. **Test in Conversation**:
   - Start chat in OpenClaw
   - Verify memories auto-inject (recall)
   - Verify new memories get stored (capture)

## Build & Install

```bash
cd /Users/Mischa/Github/onoma/openclaw/extensions/onoma
npm run build
openclaw plugins install /Users/Mischa/Github/onoma/openclaw/extensions/onoma
openclaw plugins list | grep onoma
```

Should show: `loaded` status with tools `onoma_search, onoma_remember`

## Reference Plugin

Full working example: `~/Downloads/openclaw-supermemory-main/`
- Shows complete hook implementation
- Proper TypeBox usage
- Event handling patterns
- CLI registration
