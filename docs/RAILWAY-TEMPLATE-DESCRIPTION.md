# Deploy and Host openclaw-railway-template on Railway

Production-ready deployment package for OpenClaw, an AI coding assistant that integrates with multiple chat platforms. Features a redesigned dark-themed setup wizard, 12+ AI provider support, optional Tailscale private networking, enterprise-grade health monitoring, persistent storage, and a full admin dashboard — no command-line experience required.

> **NOTE:** If you experience a gateway disconnected issue in the UI, copy the value of `OPENCLAW_GATEWAY_TOKEN` from Railway environment variables and paste it on the overview page, then click connect.

## About Hosting openclaw-railway-template

This template wraps OpenClaw with a Node.js server providing complete lifecycle management through an intuitive web interface. Deploy in under 2 minutes, then walk through a modern **5-step setup wizard** to configure AI providers (OpenAI, Anthropic, Google Gemini, OpenRouter, GitHub Copilot, Moonshot, and more) and chat channels (Telegram, Discord, Slack) — all from a password-protected `/setup` page. Optionally enable **Tailscale VPN** for private networking to local LLMs, installed on-demand without bloating the Docker image. The wrapper automatically manages the OpenClaw gateway process, persists configuration to a Railway volume, and provides advanced management tools including a debug console, live config editor, device pairing, and import/export backups — all without SSH access.

## Common Use Cases

- **Personal AI Coding Assistant:** Deploy your private AI assistant accessible via Telegram, Discord, or Slack for coding help, debugging, and automation
- **Team Development Tool:** Shared AI assistant for code reviews, architecture discussions, and pair programming across multiple channels
- **Multi-Platform Bot:** Single AI assistant responding across Telegram, Discord, and Slack simultaneously with unified configuration
- **Self-Hosted LLM Integration:** Connect OpenClaw to Ollama, vLLM, or LM Studio via Tailscale private networking for GPU-accelerated inference on your own hardware
- **Production Deployments:** Pin to a stable OpenClaw release for reliability while testing new versions in a separate deployment

## Dependencies for openclaw-railway-template Hosting

- **Railway Volume:** Required for persistent storage of configuration, credentials, and workspace files (mounted at `/data`, 5GB recommended)
- **AI Provider Account:** API key for at least one provider (OpenAI, Anthropic, Google Gemini, OpenRouter, GitHub Copilot, or custom OpenAI-compatible endpoint)
- **Chat Platform Tokens (Optional):** Bot tokens for Telegram, Discord, or Slack if you want chat integration

### Deployment Dependencies

- [OpenClaw GitHub Repository](https://github.com/openclaw/openclaw) — The underlying AI assistant framework
- [Railway Volumes Documentation](https://docs.railway.com/guides/volumes) — For understanding persistent storage
- [Telegram BotFather](https://t.me/BotFather) — To create Telegram bot tokens
- [Discord Developer Portal](https://discord.com/developers/applications) — To create Discord bot tokens
- [OpenClaw Docs](https://docs.openclaw.com) — Providers and channel configuration

### Implementation Details

The template uses a Node.js wrapper server that:

- Builds OpenClaw from source during Docker build with pnpm for reliability
- Provides a **redesigned 5-step setup wizard** at `/setup` (protected by `SETUP_PASSWORD`) with a modern dark-themed UI
- Manages the OpenClaw gateway process automatically with health checks, auto-restart, and crash recovery
- Reverse-proxies all traffic (including WebSockets) to the internal gateway with authentication
- Offers advanced management tools including live config editor, debug console, device pairing helper, and backup/restore

**What's New in This Template:**

- **Modern Setup UI:** Completely redesigned dark-themed 5-step wizard replacing the old single-page form. Guided flow with inline help, token validation, and provider-specific auth guidance.
- **12+ AI Providers:** Built-in support for OpenAI, Anthropic, Google Gemini, OpenRouter, GitHub Copilot, Moonshot, Z.AI, MiniMax, Qwen, Vercel AI Gateway, Synthetic, OpenCode Zen, and custom OpenAI-compatible endpoints.
- **Tailscale VPN (Optional):** Private networking auto-installed on-demand when enabled in the wizard. No Docker image bloat — keeps the image lean by default. Perfect for routing to Ollama/vLLM on your local GPU machine.
- **Admin Dashboard:** The `/setup` page doubles as a management dashboard with system status, gateway health, version info, and channel status at a glance.

**Key Management Features:**

- **Live Config Editor:** Edit `openclaw.json` via web UI with automatic timestamped backups and gateway auto-restart on save
- **Debug Console:** Execute 13+ allowlisted commands (`gateway.restart`, `openclaw.doctor`, `openclaw.logs.tail`, `openclaw.devices.approve`) without SSH
- **Device Pairing Helper:** Visual interface to approve WebSocket devices (fixes "pairing required" errors)
- **Backup & Restore:** One-click export/import of complete configuration archives
- **Health Monitoring:** Public `/healthz` endpoint with error tracking and automatic diagnostics

**Key environment variables:**

```
SETUP_PASSWORD=your-password            # Protects the setup wizard
OPENCLAW_STATE_DIR=/data/.openclaw     # Persists config/credentials
OPENCLAW_WORKSPACE_DIR=/data/workspace # Persists workspace files
OPENCLAW_VERSION=v2026.2.15            # Optional: pin specific version
```

## Why Deploy openclaw-railway-template on Railway?

**Production-Grade Infrastructure:** Railway provides persistent volumes with snapshots, secure credential management, automatic HTTPS, real-time logs, and Hobby plan compatibility (512MB memory, ~250MB idle usage).

**Modern Setup Experience:** Unlike other OpenClaw templates that require editing JSON files or running terminal commands, this template provides a polished 5-step browser wizard with inline guides, token validation, and a full admin dashboard — making OpenClaw accessible to everyone regardless of technical experience.

**Private Networking Ready:** Optional Tailscale integration lets you connect to local LLMs and private services without exposing anything to the public internet, installed on-demand to keep deployments lean.

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying openclaw-railway-template on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
