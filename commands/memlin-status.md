Show Memlin status: call the `memlin_status` MCP tool (no arguments) and relay
its `summary` field verbatim. It reports auth (access-token presence, expiry +
refresh state), the bound account and project, MCP routing/host, last sync, and
pending local changes — read from `~/.config/memlin/` by the local stdio MCP
server. Prefer this tool over a terminal command. If the tool is unavailable,
tell the user to restart Cursor or run **Developer: Reload Window**. If sign-in
is still missing, direct them to `/memlin-login`; do not claim a Command Palette
sign-in action exists.
