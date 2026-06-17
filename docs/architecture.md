# Architecture

This MCP server is intentionally a wrapper around `@framer/agent`.

```text
MCP client
  -> Framer MCP Threaded stdio server
  -> @framer/agent CLI
  -> local Framer relay
  -> Framer project/session
```

## Core Pieces

- `src/index.ts`: MCP stdio entry point.
- `src/framer/cli.ts`: runs `@framer/agent`, captures stdout/stderr, extracts JSON when possible, and normalizes errors.
- `src/framer/scripts.ts`: runs JavaScript inside a Framer session via `@framer/agent exec`.
- `src/tools/*.ts`: grouped MCP tool definitions.

## Why Grouped Tool Files

The Premiere MCP reference uses a very fine-grained file-per-tool layout. That is excellent for large CEP bridge dispatch, but Framer's API surface is broad and method-shaped. This server keeps one file per feature area:

- `lifecycle.ts`
- `project.ts`
- `canvas.ts`
- `components.ts`
- `assets.ts`
- `cms.ts`
- `code-files.ts`
- `styles.ts`
- `localization.ts`
- `publishing.ts`

This keeps navigation easy without creating dozens of near-empty files.

## Wrapper Strategy

The server exposes three layers:

1. Direct CLI wrappers for lifecycle operations such as sessions, projects, relay, setup, and docs.
2. Typed Framer API wrappers that run small scripts inside a session and return JSON.
3. Escape hatches for uncommon workflows:
   - `framer_exec_script`
   - `framer_call_agent_method`
   - `framer_call_method`

These layers complement each other: the typed wrappers cover common workflows ergonomically, while the escape hatches expose the full Framer API directly — so new Framer capabilities are usable immediately, without waiting for a dedicated wrapper.

## Safety Model

The server does not invent a new editing protocol. Canvas edits still go through Framer's official agent DSL and review flow:

1. Read context/state.
2. Apply changes.
3. Review changes.
4. Fix warnings/errors before claiming completion.

The MCP layer only removes the temp-file and shell-output ceremony from ordinary agent use.

