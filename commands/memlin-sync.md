Run a full bidirectional Memlin sync for this project: execute `memlin sync`
in the terminal. Report what was pulled and what was pushed. If conflicts
surface (the server has a newer version of a document also edited locally),
surface them — do not silently overwrite.

This is CLI-only. If `memlin` is unavailable, use the signed macOS/Linux
bootstrap after removing any Marketplace copy. On Windows, a Companion-managed local install can run
`node "$HOME\.cursor\plugins\local\memlin\dist\cli\main.js" sync`. Do not run a
guessed path inside Cursor's Marketplace cache.
