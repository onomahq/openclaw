# Onoma Memory Plugin for OpenClaw

Seamless memory integration for OpenClaw with automatic context recall and capture.

## Features

- **Auto-Recall**: Automatically retrieves relevant memories before agent starts
- **Auto-Capture**: Extracts and stores context after conversations end
- **Tools**: `onoma_search`, `onoma_remember`, `onoma_spaces` for explicit memory operations
- **Commands**: `/remember`, `/recall`, `/spaces` for user interaction
- **CLI**: `openclaw onoma search|spaces|stats` for command-line access

## Installation

### Standalone Build (Current)

This plugin is built standalone and ready for integration:

```bash
cd openclaw/extensions/onoma
npm install
npm run build
```

### Integration with OpenClaw (Future)

When integrating into the OpenClaw monorepo:

1. Move this directory to `openclaw/extensions/onoma/`
2. Add to `package.json`:
   ```json
   {
     "peerDependencies": {
       "openclaw": "^1.0.0"
     }
   }
   ```
3. Install the plugin:
   ```bash
   openclaw plugins install ./extensions/onoma
   ```

## Configuration

Set your API token in `~/.openclaw/.env`:

```bash
ONOMA_API_TOKEN=onoma_your_token_here
```

Get a token from [https://askonoma.com/manage/integration-tokens](https://askonoma.com/manage/integration-tokens)

### Advanced Configuration

In `~/.openclaw/config.json5`:

```json5
{
  plugins: {
    onoma: {
      apiUrl: "https://api.askonoma.com",
      autoRecall: true,
      autoCapture: true,
      maxRecallResults: 5,
      spaceMapping: {
        "telegram:*": "space-personal",
        "discord:work-*": "space-work"
      }
    }
  }
}
```

## Usage

### Automatic Memory

Just chat normally - memories are automatically captured and recalled:

```bash
openclaw chat

You: My favorite color is blue
Assistant: I'll remember that!

# Later...
You: What's my favorite color?
Assistant: Your favorite color is blue!
```

### Explicit Commands

```bash
# In a conversation
/remember I work at Apple as a software engineer

# Search your memories
/recall where do I work?

# View your spaces
/spaces
```

### CLI Commands

```bash
# Search memories from terminal
openclaw onoma search "work projects"

# List your spaces
openclaw onoma spaces

# View statistics
openclaw onoma stats
```

### Tool Use

The agent can use memory tools automatically:

```
Agent: Let me search your memories for relevant information...
[Tool: onoma_search]
Query: "previous projects"
Results: You worked on a mobile app for inventory management...
```

## How It Works

### Auto-Recall Hook (`before_agent_start`)

1. Analyzes the current conversation
2. Searches your Onoma memories for relevant context
3. Injects top results into the agent's context
4. Agent responds with full memory awareness

### Auto-Capture Hook (`agent_end`)

1. Sends conversation to Cortex for context extraction
2. Stores extracted facts/memories
3. Automatically organizes into Spaces
4. Available for future recall

### Space Mapping

Map platform-specific channels to Onoma spaces:

```json5
{
  spaceMapping: {
    "telegram:personal": "space-uuid-1",
    "discord:work-*": "space-uuid-2",
    "slack:team-alpha": "space-uuid-3"
  }
}
```

## Tools Reference

### `onoma_search`

Search memories semantically:

```typescript
{
  name: "onoma_search",
  parameters: {
    query: "string",
    limit: "number (optional)"
  }
}
```

### `onoma_remember`

Store a fact explicitly:

```typescript
{
  name: "onoma_remember",
  parameters: {
    content: "string",
    contextType: "string (optional, default: user_fact)"
  }
}
```

### `onoma_spaces`

List or get space info:

```typescript
{
  name: "onoma_spaces",
  parameters: {
    action: "list | info",
    spaceId: "string (for info action)"
  }
}
```

## Commands Reference

### `/remember <text>`

Store something in memory:

```
/remember My cat's name is Whiskers
```

### `/recall <query>`

Search your memories:

```
/recall what's my cat's name?
```

### `/spaces [list|info <id>]`

View and manage spaces:

```
/spaces
/spaces info space-uuid
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Lint
npm run lint

# Test
npm run test
```

## Troubleshooting

### "ONOMA_API_TOKEN not configured"

Set your token in `~/.openclaw/.env` or export it:

```bash
export ONOMA_API_TOKEN=onoma_your_token_here
```

### Auto-recall not working

Check your config:

```json5
{
  plugins: {
    onoma: {
      autoRecall: true  // Must be true
    }
  }
}
```

### Missing scopes error

Recreate your token with all required scopes:
- `chat:write` - Required for chat completions
- `memory:read` - Required for recall
- `memory:write` - Required for capture

## License

MIT
