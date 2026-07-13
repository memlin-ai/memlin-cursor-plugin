Let Memlin manage your memory: run `memlin manage-memory` in the terminal. Once
Memlin captures and resolves your memory, the editor's built-in native
auto-memory is a redundant, machine-bound silo that loads an unranked blob into
context every session — this hands it to Memlin.

This NEVER touches Memlin — Memlin stays on as your single store. Run
`memlin manage-memory --status` to see the current state first, or
`memlin manage-memory --revert` to hand memory back to the editor. Everything
Memlin stores is fully exportable (`memlin pull`, or Settings → Export memory).
