Sign in is an interactive browser device flow and cannot be completed by the
agent. Native Cursor Marketplace installs do not create a `memlin` executable
or a Command Palette sign-in command. On macOS/Linux, tell the user to run the
signed bootstrap:

`curl -fsSL https://memlin.ai/install-cursor.sh | bash`

If Memlin is already installed from Marketplace, uninstall that copy under
Cursor Customize before switching channels; the bootstrap refuses duplicate
local + Marketplace ownership. It then verifies and installs the same native
plugin, provisions `memlin`, and starts sign-in. On Windows, use Memlin
Companion's sign-in; if Companion has installed the local plugin, the direct fallback is
`node "$HOME\.cursor\plugins\local\memlin\dist\cli\main.js" login`. If
`memlin` is already available, run `memlin login` instead. Rotating tokens are
stored at `~/.config/memlin/token.json`; re-run login to switch users.
