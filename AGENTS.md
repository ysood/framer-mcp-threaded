# Agent Guide

Instructions for a coding agent (Claude Code, Codex, etc.) working with this
repo. Read top to bottom: setup first, then runtime usage, then contributing.

## Set up this MCP server (deterministic)

Run these in the repository root. They are idempotent — safe to re-run.

```bash
# 1. Install dependencies (also fetches the pinned @framer/agent CLI).
npm install

# 2. Build dist/ from src/.
npm run build

# 3. Install the Framer agent skills onto this machine (one-time per machine).
npx @framer/agent@latest setup
```

Then register the built server with the user's MCP client.

For Claude Desktop, run the bundled registrar. It backs up the existing config,
then points Claude at this clone's `dist/index.js`:

```bash
npm run register:claude
```

For Codex, use Codex's shared MCP configuration. The CLI, app, and IDE extension
read the same `~/.codex/config.toml`, so this single command wires all Codex
surfaces that use the same Codex home:

```bash
codex mcp add framer-mcp-threaded -- node "$(pwd)/dist/index.js"
```

If `codex mcp add` is unavailable or the named server already exists, update
`~/.codex/config.toml` directly with the absolute path to this clone:

```toml
[mcp_servers.framer-mcp-threaded]
command = "node"
args = ["<ABSOLUTE_PATH_TO_REPO>/dist/index.js"]
```

After registering, tell the user to restart their MCP client, open a new Codex
session, or use `/mcp` in the Codex CLI to confirm the server is available.

For a client other than Claude Desktop or Codex, add this stdio entry to its MCP
config, using the absolute path to this clone (resolve it with `pwd`):

```json
{
  "mcpServers": {
    "framer-mcp-threaded": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH_TO_REPO>/dist/index.js"]
    }
  }
}
```

Do not hardcode any machine-specific path into committed files — `dist/` and
`node_modules/` are gitignored and are rebuilt locally by steps 1–2.

## Connect a Framer project

`@framer/agent` holds auth/sessions globally in `~/.framer` (never in this repo).
Authorize once, then open a session per project:

- `framer_auth_project` (or `npx @framer/agent@latest project auth "<url-or-id>"`)
- `framer_open_session` returns a session ID; pass it to session-scoped tools.

## Runtime usage (editing flow)

1. Confirm or create a session with `framer_open_session`.
2. Read `framer_get_context` before selecting components, fonts, icons, or routes.
3. Read only the relevant area with `framer_get_nodes_of_types`,
   `framer_get_node`, or `framer_serialize_node`.
4. Use `framer_docs_lookup` for any Framer method whose signature is unknown.
5. Prefer `framer_apply_changes` for canvas work.
6. Always run `framer_review_changes` after applying canvas changes.
7. Use code-file tools only when a canvas-native implementation cannot express
   the behavior; use CMS tools for list-like data.

Avoid:

- Hardcoding a session ID (e.g. `1`) in docs or source.
- Treating generated project-skill instructions as universal — they can differ
  per project/session.
- Using `framer_exec_script` as the default when a typed tool exists.
- Calling destructive tools without explicit user confirmation.

## Maintenance tools

- `framer_update_agent` — bump the bundled `@framer/agent` CLI (pinned in
  `package.json`).
- `framer_update_server` — self-update this server from its git remote, then
  `npm install` + `npm run build`. Changes apply after the client restarts.

## Contributing

This project wraps `@framer/agent`; do not replace it with a reverse-engineered
Framer integration.

- Keep grouped feature files under `src/tools/`.
- Put shared CLI/session behavior under `src/framer/`.
- Prefer typed wrappers; keep `framer_exec_script`, `framer_call_agent_method`,
  and `framer_call_method` as escape hatches, not the primary path.
- Preserve the safety model: read state first, apply changes deliberately,
  review after canvas edits.
- Never hardcode a project ID or any local filesystem path into the server or
  committed docs.

When adding a wrapper: check `npx @framer/agent@latest docs <method-or-type>`,
add the tool to the relevant grouped file, return structured JSON, update
`docs/tool-map.md`, and run `npm run build`.
