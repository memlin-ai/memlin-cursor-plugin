Ask the team's Memlin workspace a natural-language question. Call the
`memlin_resolve_task` MCP tool with the text after `/memlin-ask` as `task` and
an appropriate `max_tokens`, then answer from the returned memory, skills,
approved goals, schemas, and decisions. Honor approved goals and REQUIRED or
PINNED decisions/directives as constraints; use other decisions as cited
context. Include the returned document paths/versions as citations. Do not
require a terminal launcher for this MCP-backed command.
