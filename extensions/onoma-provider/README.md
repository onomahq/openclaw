# Onoma Provider for OpenClaw

Use [Onoma](https://askonoma.com) as your AI model provider in OpenClaw. Onoma's `auto` model intelligently routes to the best available LLM for each request.

## Install

```bash
openclaw plugins install @askonoma/onoma-provider
```

## Configure

```bash
openclaw models auth login --provider onoma
```

Enter your API token (`onm_...`) when prompted. Then set it as your default model:

```bash
openclaw models set onoma/auto
```

### Environment variables

Alternatively, set these in your shell:

```bash
export ONOMA_API_TOKEN=onm_...
```

## How it works

The plugin registers a single `onoma/auto` model that sends requests to Onoma's OpenAI-compatible API. Onoma automatically routes each request to the best available LLM — no model selection needed.
