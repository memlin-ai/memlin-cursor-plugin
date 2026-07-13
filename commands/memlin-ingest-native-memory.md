Pull this host's native auto-memory into Memlin: run `memlin ingest-native-memory`
in the terminal. It reads Claude Code's native auto-memory index
(`~/.claude/projects/<repo>/memory/MEMORY.md`) and runs each entry through the
Memlin scribe dedup, so native learnings corroborate what Memlin already knows
instead of duplicating.

Run this once before letting Memlin manage memory (`memlin manage-memory`) so
nothing is lost — everything moves into the governed, fully exportable corpus.
