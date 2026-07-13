#!/usr/bin/env node
import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);
import { fileURLToPath as __ftp } from 'node:url'; import { dirname as __dn } from 'node:path';
const __filename = __ftp(import.meta.url); const __dirname = __dn(__filename);

// apps/cursor-plugin/src/hooks/before-submit-prompt.ts
import path4 from "node:path";
import { fileURLToPath } from "node:url";

// apps/cursor-plugin/src/auth-notice.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
var TOKEN_FILE = path.join(os.homedir(), ".config", "memlin", "token.json");
async function readAuthStatus() {
  try {
    const raw = await fs.readFile(TOKEN_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.access_token) return { signedIn: false };
    const expiresAt = parsed.expires_at ?? 0;
    const expiresInMin = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 6e4)) : void 0;
    const expired = expiresAt > 0 && Date.now() >= expiresAt - 6e4;
    if (expired && !parsed.refresh_token) {
      return { signedIn: false, needsReLogin: true, expiresInMin: 0 };
    }
    return { signedIn: true, expiresInMin };
  } catch {
    return { signedIn: false };
  }
}
function formatAuthNotice(status) {
  if (status.signedIn) return "";
  const action = "Run `/memlin-login` for the signed bootstrap instructions (or `memlin login` when the launcher is already available). Native Cursor plugins do not add a Command Palette sign-in action.";
  if (status.needsReLogin) {
    return [
      "<memlin-auth-notice>",
      "Memlin session expired and could not be refreshed automatically.",
      action,
      "</memlin-auth-notice>"
    ].join("\n");
  }
  return ["<memlin-auth-notice>", "Memlin is not signed in.", action, "</memlin-auth-notice>"].join(
    "\n"
  );
}
function formatResolveFailureNotice(detail) {
  const lines = [
    "<memlin-auth-notice>",
    "Memlin could not resolve context for this prompt.",
    detail?.trim() || "Check auth with `/memlin-status`. Run `/memlin-login` if sign-in is needed.",
    "</memlin-auth-notice>"
  ];
  return lines.join("\n");
}

// apps/cursor-plugin/src/hook-io.ts
function readHookInput() {
  return new Promise((resolve) => {
    let data = "";
    const done = () => {
      try {
        resolve(data.trim() ? JSON.parse(data) : null);
      } catch {
        resolve(null);
      }
    };
    const timer = setTimeout(done, 1e3);
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      clearTimeout(timer);
      done();
    });
    process.stdin.on("error", () => {
      clearTimeout(timer);
      done();
    });
  });
}

// packages/plugin-core/dist/state.js
import { promises as fs2 } from "node:fs";
import path2 from "node:path";
import os2 from "node:os";
import crypto from "node:crypto";
var STATE_FILE = path2.join(os2.homedir(), ".config", "memlin", "state.json");
var EMPTY = { documents: {} };
async function readState() {
  try {
    const raw = await fs2.readFile(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { ...EMPTY };
  }
}
async function writeState(state) {
  await fs2.mkdir(path2.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.tmp`;
  await fs2.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fs2.rename(tmp, STATE_FILE);
}
var LOCK_DIR = `${STATE_FILE}.lock`;
var LOCK_STALE_MS = 2e3;
var LOCK_WAIT_MS = 2e3;
var LOCK_RETRY_MS = 50;
async function acquireStateLock() {
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (; ; ) {
    try {
      await fs2.mkdir(LOCK_DIR);
      return true;
    } catch {
      try {
        const stat = await fs2.stat(LOCK_DIR);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          await fs2.rmdir(LOCK_DIR).catch(() => {
          });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() >= deadline) return false;
      await new Promise((r) => setTimeout(r, LOCK_RETRY_MS));
    }
  }
}
async function releaseStateLock() {
  await fs2.rmdir(LOCK_DIR).catch(() => {
  });
}
async function updateState(mutate) {
  const locked = await acquireStateLock();
  try {
    const state = await readState();
    await mutate(state);
    await writeState(state);
    return state;
  } finally {
    if (locked) await releaseStateLock();
  }
}
function getLastResolveForSession(state, sessionId) {
  if (sessionId) {
    return state.last_resolves?.[sessionId] ?? (state.last_resolve?.session_id === sessionId ? state.last_resolve : void 0);
  }
  return state.last_resolve?.session_id ? void 0 : state.last_resolve;
}
async function markLastResolveDelivered(input) {
  if (!input.auditId) return;
  try {
    await updateState((state) => {
      const entry = getLastResolveForSession(state, input.sessionId);
      if (entry?.audit_id !== input.auditId || entry.host !== input.host || entry.cwd !== input.cwd) {
        return;
      }
      entry.delivered = true;
      if (state.last_resolve?.audit_id === input.auditId && state.last_resolve.session_id === entry.session_id) {
        state.last_resolve.delivered = true;
      }
    });
  } catch {
  }
}

// packages/plugin-core/dist/continuity.js
var CONTINUITY_WINDOW_MS = 10 * 60 * 1e3;
var CONTINUATION_PATTERNS = [
  /^\s*(and|also|then|now|next|plus|but|or|so)\b(?=\s+\S)/i,
  /^\s*(what about|how about|tell me more|go on|continue|keep going)\b/i,
  /^\s*(explain|show me|expand|elaborate)\s+(that|this|it|the|more)\b/i,
  /^\s*(yes|yeah|yep|ok|okay|sure|right|sounds good)[,;:]?\s+(now|and|so|continue|keep|do|ship|merge|apply|proceed)\b/i,
  /^\s*(can you|could you)\s+(also|now|then|continue|elaborate)\b/i,
  /^\s*(can|could|would|will)\s+you\s+(please\s+)?(do|fix|change|update|ship|merge|apply|open|show|explain|retry|run|test)\s+(it|that|this|them|those|these)\b/i,
  /^\s*(do|fix|change|update|ship|merge|apply|open|show|explain|expand|remove|delete|revert|retry|run|test|review|check)\s+(it|that|this|them|those|these|the same)\b/i,
  /^\s*(go ahead|please do|do it|ship it|merge it|apply it|try again|same (for|with)|one more time)\b/i,
  /^\s*(why|how|how so|where|when|what next|which one|show me|more)\s*[?.!]*$/i,
  /^\s*(the (first|second|third|last|other) one|option\s+(one|two|three|[1-3]))\s*[?.!]*$/i,
  /^\s*(actually|instead|rather|to clarify|i mean|correction:)\b/i,
  /^\s*(here(?:'s| is) (the|that|it|what)|here you go)\b/i,
  /\b(the one|that|those|these)\b.*\?$/i
];
var IGNORABLE_PROMPT_PATTERNS = [
  /^\s*(hi|hey|hello|yo|sup|thanks?|thx|ty|ok|okay|cool|nice|got it|sounds good)[!.\s]*$/i,
  /^\s*(yes|no|yep|nope|sure|maybe|idk)[!.\s]*$/i,
  /^\s*\/[a-z-]+(?:\s|$)/i,
  // slash commands are handled by the host/agent
  /^\s*[<>][a-z]/i
  // partial host tags / XML envelopes
];
function isIgnorablePrompt(prompt) {
  const trimmed = prompt.trim();
  if (!trimmed) return true;
  return IGNORABLE_PROMPT_PATTERNS.some((re) => re.test(trimmed));
}
function isContinuation(prompt, cwd, host, last, sessionId) {
  if (last.host !== host) return false;
  if ((sessionId ?? null) !== (last.session_id ?? null)) return false;
  if (last.delivered === false) return false;
  if (last.cwd !== cwd) return false;
  if (Date.now() - last.resolved_at > CONTINUITY_WINDOW_MS) return false;
  if (!last.had_content) return false;
  const trimmed = prompt.trim();
  for (const re of CONTINUATION_PATTERNS) {
    if (re.test(trimmed)) return true;
  }
  return false;
}
function continuationForPrompt(state, prompt, cwd, host, sessionId) {
  const last = getLastResolveForSession(state, sessionId);
  return last && isContinuation(prompt, cwd, host, last, sessionId) ? last : null;
}
function buildContinuityMarker(auditId) {
  return [
    "<memlin-context-unchanged>",
    `# This turn is a follow-up to the prior turn. The same Memlin context applies.`,
    `# Refer to the bundle injected on the previous turn (audit_id: ${auditId}).`,
    "# If you need fresh context, ask the user to rephrase or invoke memlin_resolve_task directly.",
    "</memlin-context-unchanged>"
  ].join("\n");
}

// packages/plugin-core/dist/pending-bundle.js
import { spawn } from "node:child_process";
import { promises as fs3 } from "node:fs";
import path3 from "node:path";
import os3 from "node:os";
var PENDING_BUNDLE_MAX_AGE_MS = 10 * 60 * 1e3;
function pendingBundlePath() {
  return process.env.MEMLIN_RESOLVE_OUT ?? path3.join(os3.homedir(), ".config", "memlin", "pending-bundle.json");
}
async function takePendingBundle(cwd, host, match) {
  const file = pendingBundlePath();
  let bundle;
  try {
    bundle = JSON.parse(await fs3.readFile(file, "utf8"));
  } catch {
    return null;
  }
  if (typeof bundle !== "object" || bundle === null || typeof bundle.rendered !== "string" || bundle.rendered.length === 0) {
    await fs3.rm(file, { force: true }).catch(() => {
    });
    return null;
  }
  const expired = Date.now() - bundle.completed_at > PENDING_BUNDLE_MAX_AGE_MS;
  if (expired) {
    await fs3.rm(file, { force: true }).catch(() => {
    });
    return null;
  }
  if (bundle.cwd !== cwd || bundle.host !== host) {
    return null;
  }
  if (match?.sessionId != null && bundle.session_id != null && bundle.session_id !== match.sessionId) {
    return null;
  }
  if (match?.task !== void 0 && bundle.task !== match.task) {
    return null;
  }
  await fs3.rm(file, { force: true }).catch(() => {
  });
  return bundle;
}
var DEFAULT_RESOLVE_BUDGET_MS = 6e3;
function resolveBudgetMs() {
  const v = Number(process.env.MEMLIN_RESOLVE_BUDGET_MS);
  return Number.isFinite(v) && v >= 1e3 ? Math.floor(v) : DEFAULT_RESOLVE_BUDGET_MS;
}
function runResolveWithBudget(opts) {
  const budget = opts.budgetMs ?? resolveBudgetMs();
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, [opts.resolveBin, opts.task], {
        cwd: opts.cwd,
        env: {
          ...process.env,
          MEMLIN_HOST: opts.host,
          // Handoff contract with cli/resolve.ts: write the compiled bundle
          // to this file (atomic), and report a resolve.delivery telemetry
          // row when the deadline was missed.
          MEMLIN_RESOLVE_OUT: pendingBundlePath(),
          MEMLIN_RESOLVE_DEADLINE_MS: String(budget),
          // Forward the agent's session id so the resolve's usage_event is
          // attributable to this session (concurrent-work awareness).
          ...opts.sessionId ? { MEMLIN_SESSION_ID: opts.sessionId } : {}
        },
        // Detached + no shared stdio: when the caller stops waiting, the
        // child owns its own lifetime and finishes in the background.
        detached: true,
        stdio: "ignore"
      });
    } catch {
      resolve({ bundle: null, stillRunning: false });
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.unref();
      resolve({ bundle: null, stillRunning: true });
    }, budget);
    child.on("exit", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void takePendingBundle(opts.cwd, opts.host, {
        sessionId: opts.sessionId ?? null,
        task: opts.task
      }).then((bundle) => resolve({ bundle, stillRunning: false }));
    });
    child.on("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ bundle: null, stillRunning: false });
    });
  });
}
function buildLateDeliveryEnvelope(bundle) {
  return [
    "<memlin-late-context>",
    "# Memlin context resolved for the PREVIOUS prompt \u2014 it finished after that",
    `# turn's delivery deadline. Task it was resolved for: ${JSON.stringify(bundle.task.slice(0, 140))}`,
    "# Treat as background context; invoke memlin_resolve_task if this turn needs fresh context.",
    "",
    bundle.rendered,
    "</memlin-late-context>"
  ].join("\n");
}

// packages/plugin-core/dist/scribe-notice.js
async function takeScribeNotice(currentSessionId) {
  let state;
  try {
    state = await readState();
  } catch {
    return "";
  }
  const notice = state.scribe_notice;
  const n = notice?.unsurfaced ?? 0;
  if (n <= 0) return "";
  try {
    delete state.scribe_notice;
    await writeState(state);
  } catch {
  }
  if (currentSessionId && notice?.session_id && notice.session_id !== currentSessionId) {
    return "";
  }
  return [
    "<memlin-notice>",
    "# Status line for the user \u2014 surface it, do not act on it.",
    `Memlin auto-captured ${n} new proposal${n === 1 ? "" : "s"} \u2014 review and accept/reject with /memlin-inbox.`,
    "</memlin-notice>",
    ""
  ].join("\n");
}
async function takeCorrectionNotice(currentSessionId) {
  let state;
  try {
    state = await readState();
  } catch {
    return "";
  }
  const notice = state.correction_notice;
  if (!notice || !notice.rule_title) return "";
  try {
    delete state.correction_notice;
    await writeState(state);
  } catch {
  }
  if (currentSessionId && notice.session_id && notice.session_id !== currentSessionId) {
    return "";
  }
  return [
    "<memlin-notice>",
    "# Status line for the user \u2014 surface it, do not act on it.",
    `\u26A1 Memlin captured a correction \u2192 rule: "${notice.rule_title}". It's active now; review or undo with /memlin-inbox.`,
    "</memlin-notice>",
    ""
  ].join("\n");
}

// apps/cursor-plugin/src/hooks/before-submit-prompt.ts
var HOOK_DIR = path4.dirname(fileURLToPath(import.meta.url));
var RESOLVE_BIN = path4.resolve(HOOK_DIR, "../cli/resolve.js");
function respond(body) {
  process.stdout.write(JSON.stringify(body));
}
function allow() {
  respond({ continue: true });
}
async function main() {
  const input = await readHookInput();
  const prompt = input?.prompt ?? "";
  const cwd = input?.workspace_roots?.[0] ?? process.cwd();
  const sessionId = input?.session_id ?? input?.conversation_id ?? null;
  if (isIgnorablePrompt(prompt)) {
    allow();
    return;
  }
  const auth = await readAuthStatus();
  if (!auth.signedIn) {
    respond({ continue: true, additional_context: formatAuthNotice(auth) });
    return;
  }
  const scribeNotice = await takeCorrectionNotice(sessionId ?? void 0) + await takeScribeNotice(sessionId ?? void 0);
  try {
    const state = await readState();
    const continuation = continuationForPrompt(state, prompt, cwd, "cursor", sessionId);
    if (continuation) {
      respond({
        continue: true,
        additional_context: scribeNotice + buildContinuityMarker(continuation.audit_id)
      });
      return;
    }
  } catch {
  }
  const lateBundle = await takePendingBundle(cwd, "cursor", { sessionId });
  const outcome = await runResolveWithBudget({
    resolveBin: RESOLVE_BIN,
    task: prompt,
    cwd,
    host: "cursor",
    sessionId
  });
  if (outcome.bundle?.rendered) {
    const block = [
      "<memlin-resolved-context>",
      "# Auto-resolved by Memlin for the prompt below. Authoritative project",
      "# context \u2014 apply skills; honor approved goals and required/pinned decisions/directives;",
      "# use other decisions as cited context; validate schemas; cite sources.",
      "",
      outcome.bundle.rendered,
      "</memlin-resolved-context>"
    ].join("\n");
    respond({ continue: true, additional_context: scribeNotice + block });
    return;
  }
  if (lateBundle) {
    respond({
      continue: true,
      additional_context: scribeNotice + buildLateDeliveryEnvelope(lateBundle)
    });
    await markLastResolveDelivered({
      auditId: lateBundle.audit_id,
      sessionId,
      host: "cursor",
      cwd
    });
    return;
  }
  respond({
    continue: true,
    additional_context: scribeNotice + formatResolveFailureNotice(
      outcome.stillRunning ? "resolve exceeded the delivery budget \u2014 it finishes in the background and injects next turn" : void 0
    )
  });
}
main().catch(() => {
  allow();
  process.exit(0);
});
