Sign in is an interactive browser device flow and cannot be completed by the
agent. Use Memlin Companion for the normal install and sign-in flow:

1. Open **Companion → Integrations → Cursor**.
2. Choose **Install**.
3. Turn on **Install updates automatically** if desired.

On macOS/Linux, the signed repair fallback is:

`curl -fsSL https://memlin.ai/install-cursor.sh | bash`

If Companion detects a legacy Cursor copy, remove it under Cursor Customize
before installing with Companion; the installer refuses duplicate plugin
ownership. On Windows, use Memlin Companion's sign-in. If Companion has
installed the local plugin, the direct fallback is
`node "$HOME\.cursor\plugins\local\memlin\dist\cli\main.js" login`. If
`memlin` is already available, run `memlin login` instead. Rotating tokens are
stored at `~/.config/memlin/token.json`; re-run login to switch users.
