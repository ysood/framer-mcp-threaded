# Framer MCP Threaded

Agent-friendly MCP wrapper around the official `@framer/agent` CLI.

This server shells out to the official Framer agent, manages the boring session/script plumbing, and exposes labelled MCP tools grouped by capability area. It includes instructions for agents to install the server, hence I recommend you delegate this to them.

## What It Wraps

The underlying bridge is:

```text
MCP client -> framer-mcp-threaded -> @framer/agent (bundled CLI) -> Framer relay/API -> Framer project
```

The MCP server exposes typed tools for:

- setup, project auth, sessions, relay, docs, telemetry
- project context and plugin data
- agent-native canvas reads, serialization, apply changes, review changes
- components, icon sets, layout templates, shaders
- assets and stock image queries
- CMS collections/items/fields
- code files and typechecking
- styles, fonts, vector sets
- localization
- publishing, branches, deployments, redirects

The typed tools are convenience wrappers over a lower-level access layer, which
is also exposed directly for anything they don't cover:

- `framer_exec_script` — run arbitrary JavaScript inside a Framer session.
- `framer_call_method` / `framer_call_agent_method` — call any `framer` or
  `framer.agent` API method by name.

These give you the full Framer API surface and keep the server forward-compatible:
new Framer capabilities are usable immediately, before a dedicated wrapper exists.

## Install

```bash
git clone https://github.com/ysood/framer-mcp-threaded.git
cd framer-mcp-threaded
npm install      # also fetches the pinned @framer/agent
npm run build
```

Register the server with Claude Desktop (backs up the existing config and points
it at this clone's `dist/index.js`):

```bash
npm run register:claude
```

Or register it with Codex. The Codex CLI, app, and IDE extension share
`~/.codex/config.toml`, so this command wires the same server into each Codex
surface using that Codex home:

```bash
codex mcp add framer-mcp-threaded -- node "$(pwd)/dist/index.js"
```

If you prefer to edit Codex config by hand, add this to `~/.codex/config.toml`
with the absolute path to this clone:

```toml
[mcp_servers.framer-mcp-threaded]
command = "node"
args = ["<ABSOLUTE_PATH_TO_REPO>/dist/index.js"]
```

Then restart the MCP client or start a new Codex session.

> `dist/` and `node_modules/` are gitignored — the clone builds them locally,
> which is why `npm install && npm run build` is required after cloning or
> updating.

You also need the Framer agent skills installed on the machine once. This runs
the pinned agent already in `node_modules` (no network fetch, no `@latest`):

```bash
npm run setup
```

This is recommended but not required for the server to register and run.

### Letting a coding agent install it

Point Claude Code / Codex at this repo and they can self-install — the root
[AGENTS.md](AGENTS.md) contains the deterministic setup steps an agent reads and
runs. A prompt like "set up this MCP server per AGENTS.md" is enough.

### Manual client config (non–Claude Desktop/non-Codex)

Add a stdio entry pointing at this clone's `dist/index.js` (use the absolute
path from `pwd`):

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

## Connect a project

Once the server is registered and your client restarted, point it at the Framer
project you want to work on. You only do this once per machine — auth and
sessions are stored globally in `~/.framer`, never in this repo.

1. Copy your project URL or ID from Framer — the editor URL works (it looks like
   `https://framer.com/projects/My-Site--abc123…`), or just the ID at the end.
2. Tell your agent to use it, e.g.:

   > Open my Framer project https://framer.com/projects/My-Site--abc123 and work on it.

   The agent authorizes the project (the first time may open a browser or ask for
   an API key) and opens a session. From then on you just describe what you want.

Prefer to do it by hand? The equivalent CLI is:

```bash
npx @framer/agent@latest project auth "<project-url-or-id>"   # one-time authorization
npx @framer/agent@latest session new  "<project-url-or-id>"   # prints a session id
```

Inside the MCP, the same steps are the `framer_auth_project` and
`framer_open_session` tools. Session-scoped tools take the returned session id.

## Example prompts

With a project connected, you drive everything in natural language. A few things
you can ask for:

- "Add a full-width section 600px tall with a `#0F172A` background."
- "Create a 3-column feature grid; each card has an icon, a 20px bold title, and
  a 16px body."
- "Set the hero heading to 64px, weight 600, centered, with 1.1 line height."
- "Add an image from `<url>`, make it fill the container, and round the corners 12px."
- "Create a CMS collection `Posts` with title, slug, date, and rich-text body fields,
  then add three sample entries."
- "Change the primary color style to `#2563EB` everywhere it's used."
- "Add a new page at `/pricing` and link it from the nav."
- "Publish the site."

Under the hood these map onto the canvas tools (`framer_apply_changes`), CMS
tools, style tools, and publishing tools — but you rarely need to name them; the
agent picks the right one. It reads project context first and reviews canvas
changes after applying them.

## Updating

When new changes are pushed to the repo, pull them in with the
`framer_update_server` tool (no shell needed):

- Default `mode: "ff"` runs `git fetch` → `git merge --ff-only` →
  `npm install` → `npm run build`, and fails safely if you have local commits.
- `mode: "hard"` force-resets to the upstream commit (discards local changes) —
  use for a clean end-user install.

The equivalent by hand:

```bash
git pull --ff-only && npm install && npm run build
```

Either way, **restart the MCP client afterwards** so the server reloads the new
build — the running process keeps the old build in memory.

To bump only the bundled Framer agent (not this server), use `framer_update_agent`.

## Structure

```text
AGENTS.md          setup + runtime usage + contributing (read by coding agents)
src/
  framer/          shared @framer/agent CLI and session script helpers
  tools/           grouped MCP tools by feature area
docs/
  architecture.md  design notes
  tool-map.md      tool catalog by capability area
```

## Framer Agent Resolution

`@framer/agent` is bundled as a pinned dependency of this server. By default each
CLI call runs that local copy directly (`node node_modules/@framer/agent/dist/cli.js`),
which avoids the per-call `npx` registry resolution — roughly an order of
magnitude faster per call, and works offline.

To upgrade the agent deliberately (instead of silently drifting on `@latest`),
use the `framer_update_agent` tool, or run `npm install @framer/agent@latest --save-exact`
in this directory. Either way the new version is pinned in `package.json` so the
bump is a reviewable change.

## Environment

- `FRAMER_AGENT_BIN`: override the executable. If set to anything other than
  `npx`, it is used directly (e.g. a global `agent` binary). If set to `npx`,
  the server falls back to npx resolution. If unset, the bundled local agent is
  preferred, falling back to npx only when it is not installed.
- `FRAMER_AGENT_PACKAGE`: package spec used only on the npx fallback path.
  Defaults to `@framer/agent@latest`.
- `FRAMER_MCP_CWD`: working directory for CLI calls. Defaults to the MCP server process cwd.

The published bin name for the package is `agent` (`bin.agent -> dist/cli.js`),
so a global install would be invoked with `FRAMER_AGENT_BIN=agent`.

## About

Framer MCP Threaded is an independent, unofficial project — not affiliated with,
endorsed by, or supported by Framer. It's a personal project built by
**Yuvraj Sood** at **Studio Threaded**.

Issues and pull requests are welcome on GitHub. For anything else, reach out at
[yuvraj@studiothreaded.com](mailto:yuvraj@studiothreaded.com).

If this saved you some time, a follow would mean a lot and helps support the
work — **[@yvsdna](https://instagram.com/yvsdna)** on Instagram and
**[@yvsdna](https://x.com/yvsdna)** on X. Thank you 🧵

Licensed under the [MIT License](LICENSE).
