Register this workspace as a Memlin project: run `memlin add-project` in the
terminal. It records the git remote + local-path binding so every future
session auto-binds to the project.

This is CLI-only. If `memlin` is unavailable, explain that a native Marketplace
install does not create a launcher. On macOS/Linux, use the signed
`curl -fsSL https://memlin.ai/install-cursor.sh | bash` bootstrap after removing
any Marketplace copy. On Windows,
after Companion installs the local plugin, run
`node "$HOME\.cursor\plugins\local\memlin\dist\cli\main.js" add-project`.

You usually don't need this at a multi-repo workspace root. If you open your
agent at a parent folder holding several sibling git repos (e.g.
`~/Repos/Drip/{drip-api,web,mobile}`), Memlin auto-resolves to the org project
that owns those repos — no `add-project`, no per-machine config — and forks
resolve via the project's additional remotes. Reach for `add-project` only for
a single standalone repo that isn't attached yet, or a non-git folder.
