Save a one-line durable memory with zero ceremony: run
`memlin remember <text>` in the terminal, passing the user's text through
verbatim (e.g. `memlin remember our database is RLS; include RLS
instructions when updating a stored procedure or table`).

The text routes through the server-side scribe dedup — a repeated fact
corroborates the existing memory instead of duplicating it — and lands as a
provenance-verified user directive: team-scoped, active immediately, with
supersede power over the stale fact it corrects.

Flags: `--project` binds to the current project instead of team scope,
`--skill` saves an agent procedure instead of a memory, `--title "<t>"`
overrides the derived title, `--type <fact|preference|reference|correction>`
sets the memory type. The command prints the resulting document id/version
and whether dedup merged it into an existing doc.
