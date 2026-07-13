# @memlin/cursor-plugin

The Memlin integration for the Cursor IDE — the Cursor counterpart of the
Claude Code plugin (`apps/cli-plugin`). It shares the host-agnostic engine in
`@memlin/plugin-core`; this app holds only the Cursor-specific surface.

## What it ships

| File                               | Cursor surface                    |
| ---------------------------------- | --------------------------------- |
| `.cursor-plugin/plugin.json`       | native Cursor plugin manifest     |
| `mcp.json`                         | bundled local `memlin` MCP server |
| `rules/memlin.mdc`                 | always-applied resolver rule      |
| `commands/*.md`                    | `/memlin-*` slash commands        |
| `hooks/hooks.json` + `src/hooks/*` | native plugin lifecycle hooks     |

## Hooks

- **`sessionStart`** — pulls the project's plans and injects a Memlin status
  note via `additional_context`.
- **`beforeSubmitPrompt`** — resolves Memlin context for the prompt and
  returns it as `additional_context`. Newer Cursor builds inject this
  per-prompt; if a build ignores `additional_context` on this hook, the
  always-applied `rules/memlin.mdc` instructs the agent to call
  `memlin_resolve_task` itself, so context still reaches the model.
- **`afterFileEdit`** — pushes an edited plan file back to Memlin.
- **`stop`** — heartbeat plus the debounced session scribe / turn-level
  memory extraction, via the shared handler in `@memlin/plugin-core`.

## Install

**One command (macOS/Linux):**

```bash
curl -fsSL https://memlin.ai/install-cursor.sh | bash
```

Verifies the signed native bundle, installs it at
`~/.cursor/plugins/local/memlin`, provisions the `memlin` command, and signs
you in. Restart Cursor or run **Developer: Reload Window**, then run
`memlin add-project` in your repo.

Public and team installs use **Cursor → Customize → Plugins**. Cursor owns
those marketplace updates, but a marketplace install cannot create a launcher
in `~/.local/bin`; MCP-backed commands work directly, while CLI-only setup and
sync commands require the signed bootstrap above.

**Full guide (Windows + disable/uninstall):** https://memlin.ai/docs/plugin-install-guide

Rebuild locally: `pnpm package:cursor-plugin`

```
cursor://anysphere.cursor-deeplink/mcp/install?name=memlin&config=eyJ1cmwiOiJodHRwczovL21lbWxpbi5haS9tY3AifQ==
```

This adds only the hosted `memlin` MCP server (`config` is base64 of
`{"url":"https://memlin.ai/mcp"}`). The native plugin above also installs the
local stdio server, rule, commands, and hooks.

**Manual/local testing:** after `pnpm build:cursor-plugin`, copy
`cursor-plugin-out/` to `~/.cursor/plugins/local/memlin/`. The required
manifest is `.cursor-plugin/plugin.json`; restart Cursor or run
**Developer: Reload Window** after replacing the directory.

## MCP authentication

The `memlin` MCP server runs as a **local stdio process** bundled with the
plugin. It reads the Auth0 token written by `memlin login` to
`~/.config/memlin/token.json` and **refreshes it automatically** on
each tool call — the same path as hooks and slash commands.

One sign-in covers everything. Do **not** use the hosted OAuth URL
(`https://memlin.ai/mcp`) in Cursor unless you want a separate, second auth
flow that can drift out of sync with the CLI token.
