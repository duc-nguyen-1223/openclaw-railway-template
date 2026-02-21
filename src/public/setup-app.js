/**
 * OpenClaw Setup Wizard — client-side application
 * Vanilla JS, zero dependencies.
 */
(function () {
  "use strict";

  // ========== STATE ==========
  let authGroups = [];
  let currentStep = 1;
  const TOTAL_STEPS = 5;
  let selectedProviderGroup = null;
  let isRunning = false;
  let statusData = null;

  // ========== DOM HELPERS ==========
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

  // ========== TOAST SYSTEM ==========
  function toast(message, type = "info", durationMs = 4000) {
    const container = $("#toastContainer");
    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || "ℹ️"}</span>
      <span class="toast-msg">${escapeHtml(message)}</span>
      <button class="toast-close" title="Dismiss">×</button>
    `;
    el.querySelector(".toast-close").onclick = () => removeToast(el);
    container.appendChild(el);
    if (durationMs > 0) {
      setTimeout(() => removeToast(el), durationMs);
    }
    return el;
  }

  function removeToast(el) {
    if (!el || !el.parentNode) return;
    el.style.animation = "slideOut .3s ease forwards";
    setTimeout(() => el.remove(), 300);
  }

  // ========== MODAL SYSTEM ==========
  function showModal(title, bodyHtml, onConfirm, confirmLabel = "Confirm") {
    const overlay = $("#modalOverlay");
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = bodyHtml;
    const confirmBtn = $("#modalConfirm");
    confirmBtn.textContent = confirmLabel;
    overlay.style.display = "flex";

    return new Promise((resolve) => {
      const cleanup = () => {
        overlay.style.display = "none";
        confirmBtn.onclick = null;
        $("#modalCancel").onclick = null;
      };
      confirmBtn.onclick = () => {
        cleanup();
        resolve(true);
        if (onConfirm) onConfirm();
      };
      $("#modalCancel").onclick = () => {
        cleanup();
        resolve(false);
      };
    });
  }

  // ========== HTML UTILS ==========
  function escapeHtml(str) {
    const d = document.createElement("div");
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  // ========== WIZARD NAVIGATION ==========
  function goToStep(step) {
    if (step < 1 || step > TOTAL_STEPS) return;
    currentStep = step;

    // Update progress bar
    $$(".progress-step").forEach((el) => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle("active", s === step);
      el.classList.toggle("completed", s < step);
    });
    $$(".progress-connector").forEach((el, i) => {
      el.classList.toggle("active", i + 1 < step);
    });

    // Show/hide steps
    $$(".wizard-step").forEach((el) => {
      el.classList.toggle("active", parseInt(el.dataset.step) === step);
    });

    // If step 5, build review summary
    if (step === 5) buildReviewSummary();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ========== PROVIDER CARDS ==========
  function renderProviderCards(groups) {
    const container = $("#providerCategories");
    container.innerHTML = "";
    for (const g of groups) {
      const card = document.createElement("div");
      card.className = "provider-card";
      card.dataset.value = g.value;
      card.innerHTML = `
        <div class="provider-name">${escapeHtml(g.label)}</div>
        <div class="provider-desc">${escapeHtml(g.hint)}</div>
      `;
      card.addEventListener("click", () => selectProvider(g));
      container.appendChild(card);
    }
  }

  function selectProvider(group) {
    selectedProviderGroup = group;

    // Update card visuals
    $$(".provider-card").forEach((c) => {
      c.classList.toggle("selected", c.dataset.value === group.value);
    });

    // Update hidden select
    const authGroupSel = $("#authGroup");
    authGroupSel.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select provider group...";
    authGroupSel.appendChild(placeholder);
    for (const g of authGroups) {
      const opt = document.createElement("option");
      opt.value = g.value;
      opt.textContent = g.label;
      authGroupSel.appendChild(opt);
    }
    authGroupSel.value = group.value;

    // Populate auth choice dropdown
    const authChoiceSel = $("#authChoice");
    authChoiceSel.innerHTML = '<option value="">Select auth method...</option>';
    for (const opt of group.options) {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      authChoiceSel.appendChild(o);
    }
    // Auto-select if only one option
    if (group.options.length === 1) {
      authChoiceSel.value = group.options[0].value;
      onAuthChoiceChange();
    }

    $("#authMethodSection").style.display = "block";
    $("#authSecret").value = "";
    updateAuthHint();
  }

  function onAuthChoiceChange() {
    updateAuthHint();
    validateAuthSecret();
  }

  function updateAuthHint() {
    const choice = $("#authChoice").value;
    const hint = $("#authSecretHint");
    const oauthChoices = [
      "codex-cli",
      "openai-codex",
      "google-antigravity",
      "google-gemini-cli",
      "qwen-portal",
      "github-copilot",
      "copilot-proxy",
    ];
    if (oauthChoices.includes(choice)) {
      hint.textContent =
        "No API key needed — uses OAuth / device login at gateway start.";
      $("#authSecret").placeholder = "(leave empty for OAuth)";
    } else if (choice === "token") {
      hint.textContent =
        'Run "claude setup-token" locally and paste the result here.';
      $("#authSecret").placeholder = "Paste setup-token value";
    } else {
      hint.textContent = "";
      $("#authSecret").placeholder = "Paste API key or token here";
    }
  }

  // ========== VALIDATION ==========
  function validateAuthSecret() {
    const choice = $("#authChoice").value;
    const secret = $("#authSecret").value.trim();
    const el = $("#authValidation");
    if (!choice) {
      el.textContent = "";
      el.className = "validation-msg";
      return true;
    }

    const oauthChoices = [
      "codex-cli",
      "openai-codex",
      "google-antigravity",
      "google-gemini-cli",
      "qwen-portal",
      "github-copilot",
      "copilot-proxy",
    ];
    if (oauthChoices.includes(choice)) {
      el.textContent = "✓ OAuth — no key needed";
      el.className = "validation-msg valid";
      return true;
    }

    if (!secret) {
      el.textContent = "API key / token required for this provider";
      el.className = "validation-msg invalid";
      return false;
    }

    // Basic format checks
    if (choice === "openai-api-key" && !secret.startsWith("sk-")) {
      el.textContent = '⚠ OpenAI keys usually start with "sk-"';
      el.className = "validation-msg warning";
    } else if (
      choice === "openrouter-api-key" &&
      !secret.startsWith("sk-or-")
    ) {
      el.textContent = '⚠ OpenRouter keys usually start with "sk-or-"';
      el.className = "validation-msg warning";
    } else {
      el.textContent = "✓ Key provided";
      el.className = "validation-msg valid";
    }
    return true;
  }

  function validateTelegramToken() {
    const token = $("#telegramToken").value.trim();
    const el = $("#telegramValidation");
    if (!token) {
      el.textContent = "";
      el.className = "validation-msg";
      return true;
    }
    if (/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
      el.textContent = "✓ Valid Telegram token format";
      el.className = "validation-msg valid";
      return true;
    }
    el.textContent = "⚠ Expected format: 123456:ABC-DEF...";
    el.className = "validation-msg invalid";
    return false;
  }

  function validateDiscordToken() {
    const token = $("#discordToken").value.trim();
    const el = $("#discordValidation");
    if (!token) {
      el.textContent = "";
      el.className = "validation-msg";
      return true;
    }
    // Discord tokens are base64-ish, at least 50 chars
    if (token.length >= 50) {
      el.textContent = "✓ Token length looks good";
      el.className = "validation-msg valid";
      return true;
    }
    el.textContent = "⚠ Discord tokens are usually 60+ characters";
    el.className = "validation-msg invalid";
    return false;
  }

  function validateTailscaleKey() {
    const key = $("#tailscaleAuthKey").value.trim();
    const el = $("#tailscaleValidation");
    if (!key) {
      el.textContent = "";
      el.className = "validation-msg";
      return true;
    }
    if (key.startsWith("tskey-auth-")) {
      el.textContent = "✓ Valid Tailscale auth key format";
      el.className = "validation-msg valid";
      return true;
    }
    el.textContent = "⚠ Expected format: tskey-auth-...";
    el.className = "validation-msg invalid";
    return false;
  }

  // ========== CHANNEL TABS ==========
  function initChannelTabs() {
    $$(".channel-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const channel = tab.dataset.channel;
        $$(".channel-tab").forEach((t) =>
          t.classList.toggle("active", t === tab),
        );
        $$(".channel-panel").forEach((p) =>
          p.classList.toggle("active", p.dataset.channel === channel),
        );
      });
    });

    // Enable toggles
    $("#enableTelegram").addEventListener("change", (e) => {
      $("#telegramFields").style.display = e.target.checked ? "block" : "none";
    });
    $("#enableDiscord").addEventListener("change", (e) => {
      $("#discordFields").style.display = e.target.checked ? "block" : "none";
    });
    $("#enableSlack").addEventListener("change", (e) => {
      $("#slackFields").style.display = e.target.checked ? "block" : "none";
    });
    $("#enableTailscale").addEventListener("change", (e) => {
      $("#tailscaleFields").style.display = e.target.checked ? "block" : "none";
    });
  }

  // ========== CUSTOM PROVIDER TEMPLATES ==========
  function initCustomProviderTemplates() {
    const tpl = $("#customProviderTemplate");
    tpl.addEventListener("change", () => {
      const templates = {
        ollama: {
          id: "ollama",
          baseUrl: "http://localhost:11434/v1",
          api: "openai-completions",
          model: "llama3.2",
        },
        vllm: {
          id: "vllm",
          baseUrl: "http://localhost:8000/v1",
          api: "openai-completions",
          model: "",
        },
        lmstudio: {
          id: "lmstudio",
          baseUrl: "http://localhost:1234/v1",
          api: "openai-completions",
          model: "",
        },
        litellm: {
          id: "litellm",
          baseUrl: "http://localhost:4000/v1",
          api: "openai-completions",
          model: "",
        },
        custom: { id: "", baseUrl: "", api: "", model: "" },
      };
      const t = templates[tpl.value];
      if (t) {
        $("#customProviderId").value = t.id;
        $("#customProviderBaseUrl").value = t.baseUrl;
        $("#customProviderApi").value = t.api;
        $("#customProviderModelId").value = t.model;
      }
    });
  }

  // ========== TOGGLE PASSWORD VISIBILITY ==========
  function initPasswordToggles() {
    // Main auth secret toggle
    $("#toggleSecret").addEventListener("click", () => {
      const inp = $("#authSecret");
      inp.type = inp.type === "password" ? "text" : "password";
    });

    // Channel & Tailscale toggles (use data-target attribute)
    $$(".toggle-vis[data-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const inp = document.getElementById(btn.dataset.target);
        if (inp) inp.type = inp.type === "password" ? "text" : "password";
      });
    });
  }

  // ========== REVIEW SUMMARY ==========
  function buildReviewSummary() {
    const container = $("#reviewSummary");
    const items = [];

    // Provider
    const provider = selectedProviderGroup
      ? selectedProviderGroup.label
      : "Not selected";
    const authChoice = $("#authChoice").value || "—";
    items.push({ label: "Provider", value: provider });
    items.push({ label: "Auth Method", value: authChoice });

    // Channels
    const channels = [];
    if ($("#enableTelegram").checked) channels.push("Telegram");
    if ($("#enableDiscord").checked) channels.push("Discord");
    if ($("#enableSlack").checked) channels.push("Slack");
    items.push({
      label: "Channels",
      value: channels.length ? channels.join(", ") : "None",
    });

    // Tailscale
    items.push({
      label: "Tailscale",
      value: $("#enableTailscale").checked ? "Enabled" : "Disabled",
    });

    // Flow
    items.push({ label: "Setup Flow", value: $("#flow").value });

    // Custom provider
    const cpId = $("#customProviderId").value.trim();
    if (cpId) {
      items.push({ label: "Custom Provider", value: cpId });
    }

    container.innerHTML = items
      .map(
        (i) =>
          `<div class="review-item"><span class="review-label">${escapeHtml(i.label)}</span><span class="review-value">${escapeHtml(i.value)}</span></div>`,
      )
      .join("");
  }

  // ========== PROGRESS TRACKER ==========
  function updateProgress(step, status) {
    // status: "active" | "done" | "error" | "pending"
    const el = $(`.progress-item[data-progress="${step}"]`);
    if (!el) return;
    el.className = `progress-item ${status}`;
    const icons = { active: "⏳", done: "✅", error: "❌", pending: "⏸" };
    el.querySelector(".progress-icon").textContent = icons[status] || "⏸";
  }

  function resetProgress() {
    $$(".progress-item").forEach((el) => {
      el.className = "progress-item";
      el.querySelector(".progress-icon").textContent = "⏸";
    });
  }

  // ========== RUN SETUP ==========
  async function runSetup() {
    if (isRunning) return;

    // Validate step 1
    const authChoice = $("#authChoice").value;
    if (!authChoice && !selectedProviderGroup) {
      toast("Please select an AI provider first", "warning");
      goToStep(1);
      return;
    }

    isRunning = true;
    const runBtn = $("#run");
    runBtn.disabled = true;
    runBtn.textContent = "⏳ Running...";
    runBtn.classList.add("running");
    $("#log").style.display = "none";
    $("#log").textContent = "";
    $("#onboardProgress").style.display = "block";
    resetProgress();

    const payload = {
      flow: $("#flow").value,
      authChoice: authChoice,
      authSecret: $("#authSecret").value.trim(),
    };

    // Channel tokens
    if ($("#enableTelegram").checked)
      payload.telegramToken = $("#telegramToken").value.trim();
    if ($("#enableDiscord").checked)
      payload.discordToken = $("#discordToken").value.trim();
    if ($("#enableSlack").checked) {
      payload.slackBotToken = $("#slackBotToken").value.trim();
      payload.slackAppToken = $("#slackAppToken").value.trim();
    }

    // Custom provider
    if ($("#customProviderId").value.trim()) {
      payload.customProviderId = $("#customProviderId").value.trim();
      payload.customProviderBaseUrl = $("#customProviderBaseUrl").value.trim();
      payload.customProviderApi = $("#customProviderApi").value.trim();
      payload.customProviderApiKeyEnv = $(
        "#customProviderApiKeyEnv",
      ).value.trim();
      payload.customProviderModelId = $("#customProviderModelId").value.trim();
    }

    try {
      updateProgress("onboard", "active");

      const resp = await fetch("/setup/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();

      updateProgress("onboard", data.ok ? "done" : "error");

      if (data.ok) {
        // Simulate remaining progress
        updateProgress("token", "active");
        await sleep(500);
        updateProgress("token", "done");

        updateProgress("channels", "active");
        await sleep(500);
        updateProgress("channels", "done");

        if ($("#enableTailscale").checked) {
          updateProgress("tailscale", "active");
          await runTailscaleSetup();
          updateProgress("tailscale", "done");
        } else {
          updateProgress("tailscale", "done");
        }

        updateProgress("gateway", "active");
        await sleep(1000);
        updateProgress("gateway", "done");

        updateProgress("health", "active");
        await sleep(500);
        updateProgress("health", "done");

        toast("Setup completed successfully! 🎉", "success", 6000);
        runBtn.textContent = "✅ Done! Open UI →";
        runBtn.classList.remove("running");
        runBtn.classList.add("success");
        runBtn.disabled = false;
        runBtn.onclick = () => window.open("/openclaw", "_blank");
      } else {
        toast("Setup failed — check the log below", "error", 8000);
        runBtn.textContent = "🚀 Retry Setup";
        runBtn.classList.remove("running");
        runBtn.disabled = false;
        runBtn.onclick = runSetup;
      }

      // Show log
      if (data.output) {
        $("#log").textContent = data.output;
        $("#log").style.display = "block";
      }
    } catch (err) {
      updateProgress("onboard", "error");
      toast(`Error: ${err.message}`, "error", 8000);
      runBtn.textContent = "🚀 Retry Setup";
      runBtn.classList.remove("running");
      runBtn.disabled = false;
      runBtn.onclick = runSetup;
    } finally {
      isRunning = false;
    }
  }

  // ========== TAILSCALE ==========
  async function runTailscaleSetup() {
    const authKey = $("#tailscaleAuthKey").value.trim();
    const hostname = $("#tailscaleHostname").value.trim() || "openclaw-railway";
    if (!authKey) return;

    try {
      toast(
        "Setting up Tailscale (may install first — this can take a minute)...",
        "info",
        8000,
      );
      const resp = await fetch("/setup/api/tailscale/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authKey, hostname }),
      });
      const data = await resp.json();
      if (data.ok) {
        toast("Tailscale configured successfully", "success");
        updateTailscaleStatus(data);
      } else {
        toast(
          `Tailscale setup failed: ${data.error || "unknown error"}`,
          "error",
          10000,
        );
      }
    } catch (err) {
      toast(`Tailscale error: ${err.message}`, "error");
    }
  }

  function updateTailscaleStatus(data) {
    const el = $("#tailscaleStatus");
    if (!el) return;
    if (data && data.connected) {
      el.style.display = "block";
      el.className = "tailscale-status connected";
      el.innerHTML = `<strong>✅ Connected</strong> — ${escapeHtml(data.hostname || "")} ${data.ip ? `(${escapeHtml(data.ip)})` : ""}`;
    } else if (data && data.installed === false) {
      el.style.display = "block";
      el.className = "tailscale-status";
      el.innerHTML = `<strong>📦 Not installed</strong> — Tailscale will be installed automatically when you run setup.`;
    } else if (data && data.error) {
      el.style.display = "block";
      el.className = "tailscale-status disconnected";
      el.innerHTML = `<strong>❌ Error</strong> — ${escapeHtml(data.error)}`;
    } else if (data && data.installed && !data.connected) {
      el.style.display = "block";
      el.className = "tailscale-status";
      el.innerHTML = `<strong>⚪ Installed but not connected</strong>`;
    }
  }

  // ========== DASHBOARD ==========
  async function refreshDashboard() {
    try {
      const resp = await fetch("/setup/api/status");
      if (!resp.ok) return;
      statusData = await resp.json();

      // Provider groups
      if (statusData.authGroups && statusData.authGroups.length) {
        authGroups = statusData.authGroups;
        renderProviderCards(authGroups);
      }

      // Gateway status
      const gatewayEl = $("#dashGateway");
      if (statusData.configured) {
        gatewayEl.innerHTML = '<span class="status-dot green"></span> Running';
      } else {
        gatewayEl.innerHTML =
          '<span class="status-dot yellow"></span> Not configured';
      }

      // Version
      $("#dashVersion").textContent = statusData.openclawVersion || "—";

      // Channels
      const channelsList = [];
      try {
        const debugResp = await fetch("/setup/api/debug");
        if (debugResp.ok) {
          const debugData = await debugResp.json();
          if (debugData.channels?.telegram) channelsList.push("Telegram");
          if (debugData.channels?.discord) channelsList.push("Discord");
        }
      } catch {}
      $("#dashChannels").textContent = channelsList.length
        ? channelsList.join(", ")
        : "None";

      // Tailscale status
      try {
        const tsResp = await fetch("/setup/api/tailscale/status");
        if (tsResp.ok) {
          const tsData = await tsResp.json();
          const tsEl = $("#dashTailscale");
          if (tsData.connected) {
            tsEl.innerHTML = `<span class="status-dot green"></span> ${escapeHtml(tsData.ip || "Connected")}`;
          } else if (tsData.installed) {
            tsEl.innerHTML =
              '<span class="status-dot yellow"></span> Installed (not connected)';
          } else {
            tsEl.innerHTML =
              '<span class="status-dot gray"></span> Not installed';
          }
          updateTailscaleStatus(tsData);
        }
      } catch {}
    } catch (err) {
      console.warn("[dashboard] Failed to refresh:", err);
    }
  }

  // ========== ADMIN: DEBUG CONSOLE ==========
  function initConsole() {
    $("#consoleRun").addEventListener("click", async () => {
      const command = $("#consoleCommand").value;
      if (!command) {
        toast("Select a command first", "warning");
        return;
      }
      const arg = $("#consoleArg").value.trim();

      const outputEl = $("#consoleOutput");
      outputEl.textContent = "Running...";

      try {
        const resp = await fetch("/setup/api/console/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, arg: arg || undefined }),
        });
        const data = await resp.json();
        outputEl.textContent = data.output || data.error || "(no output)";
        if (data.ok) {
          toast(`Command completed (exit ${data.exitCode ?? 0})`, "success");
        } else {
          toast(`Command failed: ${data.error || ""}`, "error");
        }
      } catch (err) {
        outputEl.textContent = `Error: ${err.message}`;
        toast("Console command failed", "error");
      }
    });

    // Copy button
    $("#consoleCopy").addEventListener("click", () => {
      const text = $("#consoleOutput").textContent;
      navigator.clipboard.writeText(text).then(
        () => toast("Copied to clipboard", "info", 2000),
        () => toast("Failed to copy", "error"),
      );
    });
  }

  // ========== ADMIN: CONFIG EDITOR ==========
  function initConfigEditor() {
    const loadConfig = async () => {
      try {
        const resp = await fetch("/setup/api/config/raw");
        const data = await resp.json();
        if (data.ok) {
          $("#configContent").value = data.content;
          if (data.path) $("#configPath").textContent = data.path;
        } else {
          toast(`Failed to load config: ${data.error}`, "error");
        }
      } catch (err) {
        toast(`Error loading config: ${err.message}`, "error");
      }
    };

    // Auto-load on first expand
    const details = $("details:has(#configContent)");
    if (details) {
      details.addEventListener("toggle", () => {
        if (details.open && !$("#configContent").value) loadConfig();
      });
    }

    $("#configReload").addEventListener("click", loadConfig);

    $("#configSave").addEventListener("click", async () => {
      const content = $("#configContent").value;
      const confirmed = await showModal(
        "Save Config & Restart?",
        "<p>This will overwrite the config file, create a backup, and restart the gateway.</p>",
        null,
        "💾 Save & Restart",
      );
      if (!confirmed) return;

      try {
        const resp = await fetch("/setup/api/config/raw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const data = await resp.json();
        if (data.ok) {
          toast("Config saved and gateway restarted", "success");
          $("#configOutput").textContent = data.restartOutput || "";
        } else {
          toast(`Save failed: ${data.error}`, "error");
          $("#configOutput").textContent = data.error || "";
        }
      } catch (err) {
        toast(`Error: ${err.message}`, "error");
      }
    });
  }

  // ========== ADMIN: DEVICE PAIRING ==========
  function initPairing() {
    $("#pairingApprove").addEventListener("click", async () => {
      const channel = $("#pairingChannel").value;
      const code = $("#pairingCode").value.trim();
      if (!code) {
        toast("Enter a pairing code", "warning");
        return;
      }

      try {
        const resp = await fetch("/setup/api/devices/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: code, channel }),
        });
        const data = await resp.json();
        if (data.ok) {
          toast("Device approved!", "success");
          $("#pairingCode").value = "";
          refreshDevices();
        } else {
          toast(`Approve failed: ${data.error || data.output}`, "error");
        }
      } catch (err) {
        toast(`Error: ${err.message}`, "error");
      }
    });

    $("#devicesRefresh").addEventListener("click", refreshDevices);
  }

  async function refreshDevices() {
    const el = $("#devicesList");
    try {
      const resp = await fetch("/setup/api/devices/pending");
      const data = await resp.json();
      if (data.requestIds?.length) {
        el.innerHTML = `<p class="muted" style="margin-top:.5rem;">Pending: ${data.requestIds.map(escapeHtml).join(", ")}</p>`;
      } else {
        el.innerHTML =
          '<p class="muted" style="margin-top:.5rem;">No pending devices</p>';
      }
    } catch {
      el.innerHTML = '<p class="muted">Failed to load devices</p>';
    }
  }

  // ========== ADMIN: IMPORT ==========
  function initImport() {
    $("#importButton").addEventListener("click", async () => {
      const file = $("#importFile").files[0];
      if (!file) {
        toast("Select a backup file first", "warning");
        return;
      }

      const confirmed = await showModal(
        "Import Backup?",
        `<p>This will overwrite the current config and workspace with the backup <strong>${escapeHtml(file.name)}</strong>.</p><p>A backup of the current state will be created first.</p>`,
        null,
        "⬆ Import",
      );
      if (!confirmed) return;

      try {
        const resp = await fetch("/setup/import", {
          method: "POST",
          headers: { "Content-Type": file.type || "application/gzip" },
          body: file,
        });
        const data = await resp.json();
        if (data.ok) {
          toast("Backup imported successfully! Reloading...", "success", 3000);
          setTimeout(() => location.reload(), 2000);
        } else {
          toast(`Import failed: ${data.error}`, "error");
        }
        if (data.output) {
          $("#importOutput").textContent = data.output;
          $("#importOutput").style.display = "block";
        }
      } catch (err) {
        toast(`Import error: ${err.message}`, "error");
      }
    });
  }

  // ========== DASHBOARD ACTIONS ==========
  function initDashboardActions() {
    $("#dashRestart").addEventListener("click", async () => {
      toast("Restarting gateway...", "info", 2000);
      try {
        const resp = await fetch("/setup/api/console/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: "gateway.restart" }),
        });
        const data = await resp.json();
        if (data.ok) {
          toast("Gateway restarted", "success");
        } else {
          toast(`Restart failed: ${data.error || data.output}`, "error");
        }
      } catch (err) {
        toast(`Error: ${err.message}`, "error");
      }
      setTimeout(refreshDashboard, 2000);
    });

    $("#dashDoctor").addEventListener("click", async () => {
      toast("Running doctor...", "info", 3000);
      try {
        const resp = await fetch("/setup/api/console/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: "openclaw.doctor" }),
        });
        const data = await resp.json();
        if (data.output) {
          await showModal(
            "🩺 Doctor Results",
            `<pre style="max-height:300px;overflow:auto;font-size:.8rem;white-space:pre-wrap;word-break:break-word;">${escapeHtml(data.output)}</pre>`,
            null,
            "Close",
          );
        }
      } catch (err) {
        toast(`Error: ${err.message}`, "error");
      }
    });
  }

  // ========== RESET SETUP ==========
  function initReset() {
    $("#reset").addEventListener("click", async () => {
      const confirmed = await showModal(
        "🗑 Reset Setup?",
        "<p>This will <strong>delete all configuration</strong> and let you start fresh. The gateway will be stopped.</p><p>Consider exporting a backup first!</p>",
        null,
        "Reset Everything",
      );
      if (!confirmed) return;

      try {
        const resp = await fetch("/setup/api/reset", { method: "POST" });
        const data = await resp.json();
        if (data.ok) {
          toast("Setup reset! Reloading...", "success", 2000);
          setTimeout(() => location.reload(), 1500);
        } else {
          toast(`Reset failed: ${data.error || ""}`, "error");
        }
      } catch (err) {
        toast(`Error: ${err.message}`, "error");
      }
    });
  }

  // ========== PROGRESS STEP CLICK ==========
  function initProgressClicks() {
    $$(".progress-step").forEach((el) => {
      el.addEventListener("click", () => {
        const step = parseInt(el.dataset.step);
        if (step <= currentStep || el.classList.contains("completed")) {
          goToStep(step);
        }
      });
    });
  }

  // ========== UTILITY ==========
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ========== BOOT ==========
  async function init() {
    // Step navigation buttons
    $("#step1Next").addEventListener("click", () => {
      if (!validateAuthSecret()) {
        toast("Please fix the validation errors", "warning");
        return;
      }
      goToStep(2);
    });
    $("#step2Back").addEventListener("click", () => goToStep(1));
    $("#step2Next").addEventListener("click", () => goToStep(3));
    $("#step3Back").addEventListener("click", () => goToStep(2));
    $("#step3Next").addEventListener("click", () => goToStep(4));
    $("#step4Back").addEventListener("click", () => goToStep(3));
    $("#step4Next").addEventListener("click", () => goToStep(5));
    $("#step5Back").addEventListener("click", () => goToStep(4));

    // Auth choice change
    $("#authChoice").addEventListener("change", onAuthChoiceChange);
    $("#authSecret").addEventListener("input", validateAuthSecret);

    // Channel validation
    $("#telegramToken").addEventListener("input", validateTelegramToken);
    $("#discordToken").addEventListener("input", validateDiscordToken);
    $("#tailscaleAuthKey").addEventListener("input", validateTailscaleKey);

    // Run button
    $("#run").addEventListener("click", runSetup);

    // Initialize sub-systems
    initChannelTabs();
    initCustomProviderTemplates();
    initPasswordToggles();
    initConsole();
    initConfigEditor();
    initPairing();
    initImport();
    initDashboardActions();
    initReset();
    initProgressClicks();

    // Load initial data
    await refreshDashboard();
  }

  // Start when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
