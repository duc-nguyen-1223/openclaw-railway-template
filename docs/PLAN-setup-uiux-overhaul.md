# 🎨 UI/UX Overhaul Plan: OpenClaw Setup Wizard

> **Goal:** Make it dead-simple for users to deploy OpenClaw via Railway — with guided setup for channels (Telegram, Discord, Slack), AI providers, Tailscale networking, and diagnostics.
>
> **Status:** ✅ **IMPLEMENTED** — Phase 1–5 completed.

---

## 📋 Executive Summary

The current setup wizard (`/setup`) works but has significant UX friction:

- **One long scrollable page** with no visual hierarchy or guided flow
- **No Tailscale support** — users must SSH or use workarounds for private networking
- **Channel setup is confusing** — Telegram/Discord/Slack fields are just input boxes with no inline guidance
- **AI provider selection is overwhelming** — the dropdown lists dozens of options with no categorization help
- **No progress indicators** during onboarding
- **No success/failure states** — user doesn't know if things worked
- **Inconsistent styling** — inline styles mixed with CSS file
- **Footer links point to old "moltbot" URLs** — branding inconsistency

---

## 🏗️ Architecture Overview

### Agent Assignments (from `.agent/`)

| Phase                | Agent                  | Skills Used                                                          |
| -------------------- | ---------------------- | -------------------------------------------------------------------- |
| Planning & Breakdown | `project-planner`      | `plan-writing`, `brainstorming`, `architecture`                      |
| UI/UX Design         | `frontend-specialist`  | `frontend-design`, `ui-ux-pro-max`, `tailwind-patterns`              |
| Backend APIs         | `backend-specialist`   | `api-patterns`, `nodejs-best-practices`                              |
| Channel Integrations | `backend-specialist`   | `telegram-bot-builder`, `discord-bot-architect`, `slack-bot-builder` |
| Security Review      | `security-auditor`     | `vulnerability-scanner`, `api-security-best-practices`               |
| Testing              | `test-engineer`        | `testing-patterns`, `webapp-testing`                                 |
| Documentation        | `documentation-writer` | `documentation-templates`                                            |
| DevOps/Tailscale     | `devops-engineer`      | `docker-expert`, `deployment-procedures`                             |

### Workflows Used

| Workflow         | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `/plan`          | Generate this plan (done)                |
| `/brainstorm`    | Explore UI layout options                |
| `/ui-ux-pro-max` | Design system, color palette, typography |
| `/enhance`       | Iterative feature additions              |
| `/create`        | Implementation                           |
| `/test`          | Validate each phase                      |
| `/deploy`        | Railway deployment validation            |

---

## 🔴 Phase 1: Setup Wizard Redesign (UX Foundation)

### 1.1 — Multi-Step Wizard with Progress Bar

**Problem:** Everything is on one page, overwhelming for first-time users.

**Solution:** Convert the single-page form into a **step-by-step wizard** with:

```
Step 1: Welcome & Status     → Shows current state, version, health
Step 2: AI Provider           → Select provider + enter API key
Step 3: Channels (optional)   → Telegram / Discord / Slack tabs
Step 4: Networking (optional) → Tailscale setup
Step 5: Advanced (optional)   → Custom providers, flow selection
Step 6: Review & Deploy       → Summary + "Run Setup" button
```

**Files to modify:**

- `src/public/setup.html` — New wizard structure with step containers
- `src/public/setup-app.js` — Step navigation logic, validation per step
- `src/public/styles.css` — Step indicator, transitions, responsive layout

**Implementation details:**

- Each step is a `<div class="wizard-step" data-step="N">` hidden/shown via JS
- Progress bar at top: `Step 2 of 6 — AI Provider`
- "Back" and "Next" buttons with per-step validation
- Steps 3-5 skippable (marked "optional")
- Step 6 shows a JSON summary of all choices before running

### 1.2 — Design System Refresh

**Using:** `.agent/skills/ui-ux-pro-max` + `.agent/skills/frontend-design`

**Current aesthetic:** Dark theme with `#050810` background, `#ff4d4d` accent — decent but needs polish.

**Improvements:**

- **Typography:** Add proper heading hierarchy (currently all same weight)
- **Spacing:** Consistent padding/margin system (4px grid)
- **Cards:** Add subtle hover states, better visual grouping
- **Buttons:** Primary/secondary/danger hierarchy with proper disabled states
- **Inputs:** Better focus states, inline validation indicators (✓/✗)
- **Toast notifications:** Replace `alert()` calls with inline toast system
- **Responsive:** Mobile-friendly wizard (currently not optimized for mobile)

### 1.3 — Inline Help & Contextual Guidance

**Problem:** Users don't know where to get API keys, bot tokens, etc.

**Solution:** Add expandable inline help panels:

```html
<details class="help-panel">
  <summary>📖 How to get a Telegram Bot Token</summary>
  <ol>
    <li>Open Telegram and search for <code>@BotFather</code></li>
    <li>Send <code>/newbot</code> and follow prompts</li>
    <li>Copy the token (looks like <code>123456:ABC-DEF...</code>)</li>
  </ol>
  <a href="https://core.telegram.org/bots/tutorial" target="_blank"
    >Official Docs ↗</a
  >
</details>
```

- Telegram: BotFather walkthrough with screenshots link
- Discord: Developer Portal → Bot → Token + **MESSAGE CONTENT INTENT** warning (critical!)
- Slack: App creation → Bot Token + App Token steps
- Each AI provider: Link to API key page + format hint

---

## 🔵 Phase 2: Channel Setup Overhaul

### 2.1 — Tabbed Channel Selector

**Problem:** All three channel inputs (Telegram/Discord/Slack) shown simultaneously.

**Solution:** Tabbed interface where user picks channel(s):

```
┌─────────────┬───────────────┬──────────┬──────────┐
│ 🤖 Telegram │ 💬 Discord    │ 💼 Slack  │ ➕ More  │
└─────────────┴───────────────┴──────────┴──────────┘
```

- Each tab shows only the relevant fields
- "More" tab for future channels (Matrix, WhatsApp, etc.)
- Checkbox to enable/disable each channel
- Visual status indicator (✓ configured / ⚠ missing token / ✗ error)

### 2.2 — Telegram Setup Enhancement

**Using:** `.agent/skills/telegram-bot-builder`

**New features:**

- **Token validation** — Client-side regex check for `\d+:[A-Za-z0-9_-]+` format
- **Bot info preview** — After pasting token, call Telegram API (`getMe`) to show bot name
- **Webhook vs Polling indicator** — Explain that OpenClaw uses webhooks
- **BotFather quick link** — Direct `https://t.me/BotFather` link
- **Troubleshooting checklist** — Common issues (bot not responding, privacy mode, etc.)

### 2.3 — Discord Setup Enhancement

**Using:** `.agent/skills/discord-bot-architect`

**New features:**

- **⚠️ MESSAGE CONTENT INTENT warning** — PROMINENT banner (currently a small text note; users miss it and the bot crashes)
- **Step-by-step portal guide** with direct links to Discord Developer Portal
- **Invite URL generator** — Compute the OAuth2 invite URL from Application ID
- **Permission calculator** — Show required permissions (Send Messages, Read Messages, etc.)
- **Token format validation** — Check token format before submission

### 2.4 — Slack Setup Enhancement

**Using:** `.agent/skills/slack-bot-builder`

**New features:**

- **Dual-token explanation** — Why Slack needs BOTH `xoxb-` (Bot) and `xapp-` (App) tokens
- **Socket Mode explanation** — How OpenClaw connects to Slack
- **Manifest template** — Downloadable Slack app manifest for quick creation
- **Scope checklist** — Required OAuth scopes with checkboxes

---

## 🟢 Phase 3: AI Provider Setup

### 3.1 — Categorized Provider Selection

**Problem:** The `authGroup` dropdown lists all providers flat — overwhelming.

**Solution:** Visual card-based selector grouped by category:

```
┌──────────────────────────────────────────────┐
│  🌟 Popular                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │Anthropic│ │ OpenAI  │ │ Google  │       │
│  │ Claude  │ │ GPT-4o  │ │ Gemini  │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                              │
│  🔧 Self-Hosted / Open Source                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Ollama  │ │  vLLM   │ │LM Studio│       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                              │
│  🔗 Other Providers                          │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐      │
│  │OpenRouter│ │ Moonshot │ │  ZAI    │      │
│  └─────────┘ └──────────┘ └─────────┘      │
└──────────────────────────────────────────────┘
```

### 3.2 — Smart API Key Input

- **Format validation** per provider:
  - Anthropic: `sk-ant-...`
  - OpenAI: `sk-...`
  - Google: validated length/format
- **"Test Connection" button** — Verify API key works before proceeding
- **Secure input** — Password field with show/hide toggle
- **Persistent hint** — "Your key is stored locally on your Railway volume, never transmitted externally"

### 3.3 — Custom Provider UX

**Problem:** Current custom provider form has too many fields shown at once.

**Solution:**

- Collapse custom provider behind "➕ Add Custom Provider" button
- Pre-fill common providers (Ollama at `http://host:11434/v1`, etc.)
- Template dropdown: "Ollama" / "vLLM" / "LiteLLM" / "Custom" pre-fills URL+API type
- Inline validation for URL format and env var naming

---

## 🟡 Phase 4: Tailscale Integration (NEW)

### 4.1 — Why Tailscale?

Users want private networking to:

- Access OpenClaw without exposing to public internet
- Connect local machines to Railway-hosted OpenClaw
- Use with Ollama/vLLM running on local GPU machines

### 4.2 — Setup Wizard: Tailscale Tab

**New Step 4 in wizard: "Networking"**

```
┌─────────────────────────────────────────────────┐
│  🌐 Networking                                   │
│                                                   │
│  ☐ Enable Tailscale (private networking)          │
│                                                   │
│  Auth Key:  [________________________]  🔑        │
│  Hostname:  [openclaw-railway________]             │
│                                                   │
│  📖 How to get a Tailscale auth key:              │
│  1. Go to admin.tailscale.com/settings/keys       │
│  2. Generate auth key (reusable recommended)      │
│  3. Paste it above                                │
│                                                   │
│  ⚙️ Advanced Options:                             │
│  ☐ Advertise as exit node                         │
│  ☐ Enable Tailscale SSH                           │
│  Tags: [tag:railway________________]              │
└─────────────────────────────────────────────────┘
```

### 4.3 — Backend: Tailscale Daemon Management

**New in `src/server.js`:**

```javascript
// POST /setup/api/tailscale/configure
// - Writes auth key to /data/.tailscale/
// - Starts tailscaled daemon
// - Runs `tailscale up --authkey=<key> --hostname=<hostname>`
// - Returns Tailscale IP (100.x.x.x)

// GET /setup/api/tailscale/status
// - Returns tailscale status (connected/disconnected, IP, hostname)
```

### 4.4 — Dockerfile Changes

**Add to runtime stage:**

```dockerfile
# Install Tailscale
RUN curl -fsSL https://tailscale.com/install.sh | sh
```

**Add to entrypoint or server startup:**

- Start `tailscaled` in background if Tailscale auth key is configured
- Run `tailscale up` with stored credentials
- Health check includes Tailscale status

### 4.5 — Tailscale + Custom Provider Synergy

If user enables both Tailscale and a custom provider (e.g., Ollama):

- Auto-suggest using Tailscale IP for provider URL
- Example: "Your Ollama at `http://100.64.x.x:11434/v1` is reachable via Tailscale"
- Test connectivity button for Tailscale-routed providers

---

## 🟠 Phase 5: Admin Dashboard Improvements

### 5.1 — Debug Console Overhaul

**Problem:** Dropdown + text input is clunky.

**Solution:**

- **Command palette** (Ctrl+K or `/` to search) — type-ahead search for commands
- **Recent commands** — Show last 5 commands run
- **Output syntax highlighting** — Color JSON, logs, errors
- **Copy button** on output
- **Auto-scroll** with "scroll to bottom" anchor

### 5.2 — Config Editor Improvements

**Problem:** Plain textarea for JSON editing.

**Solution:**

- **JSON syntax highlighting** using a lightweight lib (e.g., CodeMirror lite or custom tokenizer)
- **JSON validation** with line-number error reporting
- **Diff view** — Show what changed before saving
- **Schema hints** — Known config keys with descriptions on hover
- **Undo** — Reload from last backup

### 5.3 — Real-Time Status Dashboard

**New card at top of `/setup`:**

```
┌─────────────────────────────────────────────────┐
│  📊 System Status                                │
│                                                   │
│  Gateway:     🟢 Running (PID 1234)              │
│  Uptime:      2h 34m                              │
│  Channels:    🟢 Telegram  🟢 Discord  ⚪ Slack   │
│  Tailscale:   🟢 Connected (100.64.1.2)          │
│  Memory:      128MB / 512MB                       │
│  Version:     v2026.2.15                          │
│                                                   │
│  [Restart Gateway]  [View Logs]  [Run Doctor]     │
└─────────────────────────────────────────────────┘
```

**Backend API:** `GET /setup/api/dashboard` returning structured status.

### 5.4 — Onboarding Progress

**Problem:** "Running..." with no visibility into what's happening.

**Solution:** Real-time progress via Server-Sent Events (SSE):

```
Step 1/6: Running onboard command...          ✓
Step 2/6: Syncing gateway token...            ✓
Step 3/6: Configuring Telegram channel...     ✓
Step 4/6: Configuring Discord channel...      ⏳
Step 5/6: Starting gateway...                 ⏸
Step 6/6: Verifying health...                 ⏸
```

- Convert `POST /setup/api/run` to stream progress via SSE or chunked response
- Each step updates in real-time
- Failure on any step shows specific error + retry button

---

## 🟣 Phase 6: Polish & Quality

### 6.1 — Branding Cleanup

- Fix footer links (currently point to `moltbot` / `moltinginstar` repos)
- Update `CONTRIBUTING.md` links to correct repo
- Consistent naming: "OpenClaw" everywhere (not "Openclaw" or "openclaw")
- Add favicon

### 6.2 — Error Handling UX

- Replace all `alert()` calls with inline toast notifications
- Replace all `prompt()` calls with modal dialogs
- Add "copy error to clipboard" for bug reporting
- Auto-suggest GitHub issue creation with pre-filled template

### 6.3 — Accessibility

- Proper ARIA labels on all interactive elements
- Keyboard navigation through wizard steps
- Focus management when steps change
- Screen reader announcements for status changes
- Color contrast check (current `#8892b0` muted text may fail WCAG AA)

### 6.4 — Mobile Responsiveness

- Current layout breaks on mobile (900px max-width + 2rem margin)
- Wizard steps should stack vertically on mobile
- Touch-friendly button sizes (min 44px tap target)
- Collapsible sections on mobile

### 6.5 — Offline/Error States

- Show meaningful UI when gateway is down
- Cached previous status for comparison
- Retry buttons with exponential backoff
- Connection lost indicator with auto-reconnect

---

## 📊 Task Priority & Effort Matrix

| Task                    | Priority | Effort | Impact    | Dependencies       |
| ----------------------- | -------- | ------ | --------- | ------------------ |
| 1.1 Multi-step wizard   | 🔴 P0    | Large  | Very High | None               |
| 1.2 Design refresh      | 🔴 P0    | Medium | High      | None               |
| 1.3 Inline help         | 🟡 P1    | Small  | High      | None               |
| 2.1 Tabbed channels     | 🔴 P0    | Medium | High      | 1.1                |
| 2.2 Telegram UX         | 🟡 P1    | Small  | Medium    | 2.1                |
| 2.3 Discord UX          | 🔴 P0    | Small  | High      | 2.1                |
| 2.4 Slack UX            | 🟡 P1    | Small  | Medium    | 2.1                |
| 3.1 Provider cards      | 🟡 P1    | Medium | High      | 1.1                |
| 3.2 API key validation  | 🟡 P1    | Small  | Medium    | 3.1                |
| 3.3 Custom provider UX  | 🟢 P2    | Small  | Medium    | 3.1                |
| 4.1-4.5 Tailscale       | 🟡 P1    | Large  | High      | Dockerfile changes |
| 5.1 Debug console       | 🟢 P2    | Medium | Medium    | None               |
| 5.2 Config editor       | 🟢 P2    | Medium | Medium    | None               |
| 5.3 Status dashboard    | 🟡 P1    | Medium | High      | Backend API        |
| 5.4 Onboarding progress | 🔴 P0    | Medium | Very High | SSE backend        |
| 6.1 Branding            | 🔴 P0    | Small  | Medium    | None               |
| 6.2 Error handling      | 🟡 P1    | Small  | High      | None               |
| 6.3 Accessibility       | 🟡 P1    | Medium | Medium    | 1.1                |
| 6.4 Mobile responsive   | 🟡 P1    | Medium | High      | 1.1, 1.2           |
| 6.5 Offline states      | 🟢 P2    | Small  | Medium    | None               |

---

## 🗓️ Implementation Schedule

### Sprint 1 (Week 1-2): Foundation

- [ ] **1.1** Multi-step wizard skeleton
- [ ] **1.2** Design system refresh (CSS overhaul)
- [ ] **6.1** Branding cleanup
- [ ] **5.4** SSE-based onboarding progress

### Sprint 2 (Week 2-3): Channel Setup

- [ ] **2.1** Tabbed channel selector
- [ ] **2.3** Discord MESSAGE CONTENT INTENT warning (⚡ quick win, high impact)
- [ ] **2.2** Telegram setup helper
- [ ] **2.4** Slack setup helper
- [ ] **1.3** Inline contextual help panels

### Sprint 3 (Week 3-4): AI Provider & Networking

- [ ] **3.1** Card-based provider selector
- [ ] **3.2** API key validation & test
- [ ] **4.1-4.5** Tailscale integration (Dockerfile + backend + UI)

### Sprint 4 (Week 4-5): Admin & Polish

- [ ] **5.3** Real-time status dashboard
- [ ] **5.1** Debug console improvements
- [ ] **5.2** Config editor upgrade
- [ ] **3.3** Custom provider UX
- [ ] **6.2** Toast notifications (replace alert/prompt)
- [ ] **6.3** Accessibility audit
- [ ] **6.4** Mobile responsiveness
- [ ] **6.5** Offline/error states

---

## 🔧 Technical Constraints

1. **No build step** — Must stay as vanilla JS/CSS/HTML (no React, no Webpack)
2. **No new npm dependencies for frontend** — All client-side code is vanilla
3. **Backend is Express 5** — Can add middleware, SSE endpoints
4. **Railway volume** — Tailscale state must persist at `/data/.tailscale/`
5. **Dockerfile changes** — Must not break existing build (multi-stage)
6. **Zero-downtime** — Setup wizard must work while gateway is running
7. **Security** — All new APIs behind `requireSetupAuth` middleware

---

## ✅ Definition of Done (per task)

- [ ] Feature works in Docker local test
- [ ] No `node -c` syntax errors
- [ ] Works on mobile viewport (375px+)
- [ ] Keyboard navigable
- [ ] No `alert()`/`prompt()` calls (toast/modal instead)
- [ ] Updated CLAUDE.md if architecture changed
- [ ] Smoke test passes (`npm run smoke`)

---

## 📝 Notes

- The project uses **vanilla JS** (no framework) — keep it that way for simplicity
- CSS is in `src/public/styles.css` — avoid inline styles (some exist in HTML, migrate them)
- The footer still references "moltbot" — needs cleanup
- `AUTH_GROUPS` constant is defined server-side and sent to frontend — extend this for categorized provider display
- WebSocket proxy requires `http-proxy` event handlers (not `req.headers` modification) — don't break this
- Tailscale integration is the most complex item — may need a separate sub-plan
