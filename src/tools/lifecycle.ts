/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { cliTool, defineTool, timeoutSchema } from "./helpers.js";
import { updateFramerAgent, updateServer } from "../framer/maintenance.js";
import type { ToolDefinition } from "../types.js";

export const lifecycleTools: ToolDefinition[] = [
  defineTool(
    "framer_version",
    "Print the installed @framer/agent CLI version.",
    {},
    async () => cliTool(["--version"]),
  ),

  defineTool(
    "framer_update_agent",
    "Update the bundled @framer/agent CLI to a target version (default 'latest') by running npm install --save-exact in the server root. Pins the new version in package.json and returns previous/new versions. Use this to bump the agent deliberately instead of relying on @latest.",
    {
      version: z
        .string()
        .optional()
        .describe("npm version or dist-tag to install. Defaults to 'latest'."),
      timeoutMs: timeoutSchema,
    },
    async ({ version, timeoutMs }) =>
      updateFramerAgent({
        version: version as string | undefined,
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_update_server",
    "Self-update this MCP server from its git remote, then reinstall deps and rebuild. Use when the maintainer has pushed updates. Runs git fetch -> ff-merge (or hard reset) -> npm install -> npm run build in the server root. Changes take effect after the MCP client restarts the server. Returns a per-step report and previous/current commit.",
    {
      mode: z
        .enum(["ff", "hard"])
        .optional()
        .describe(
          "'ff' (default) fast-forwards only and fails on local divergence; 'hard' force-resets to the upstream commit, discarding local changes.",
        ),
      timeoutMs: timeoutSchema,
    },
    async ({ mode, timeoutMs }) =>
      updateServer({
        mode: mode as "ff" | "hard" | undefined,
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_setup",
    "Run @framer/agent setup to install Framer agent skills into the local agent skill folders.",
    {
      timeoutMs: timeoutSchema,
    },
    async ({ timeoutMs }) => cliTool(["setup"], { timeoutMs: timeoutMs as number | undefined }),
  ),

  defineTool(
    "framer_docs_lookup",
    "Look up @framer/agent API docs. Accepts no query, a class/type name, or method names such as 'framer.agent.getNode'.",
    {
      queries: z.array(z.string()).default([]),
      timeoutMs: timeoutSchema,
    },
    async ({ queries, timeoutMs }) =>
      cliTool(["docs", ...(queries as string[])], {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_list_projects",
    "List recently used Framer projects known to @framer/agent.",
    {
      timeoutMs: timeoutSchema,
    },
    async ({ timeoutMs }) =>
      cliTool(["project", "list"], { timeoutMs: timeoutMs as number | undefined }),
  ),

  defineTool(
    "framer_auth_project",
    "Authorize and save access for a Framer project URL or project ID.",
    {
      projectUrlOrId: z.string().min(1),
      apiKey: z.string().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ projectUrlOrId, apiKey, timeoutMs }) =>
      cliTool(
        [
          "project",
          "auth",
          projectUrlOrId as string,
          ...(apiKey ? [apiKey as string] : []),
        ],
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_create_project",
    "Create a new Framer project via browser approval and save its credentials.",
    {
      timeoutMs: timeoutSchema,
    },
    async ({ timeoutMs }) =>
      cliTool(["project", "new"], { timeoutMs: timeoutMs as number | undefined }),
  ),

  defineTool(
    "framer_remix_project",
    "Remix/duplicate an existing Framer project via browser approval and save its credentials.",
    {
      sourceProjectUrlOrId: z.string().min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sourceProjectUrlOrId, timeoutMs }) =>
      cliTool(["project", "remix", sourceProjectUrlOrId as string], {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_open_session",
    "Create a live @framer/agent session for a project URL or ID. Returns the session ID in stdout.",
    {
      projectUrlOrId: z.string().min(1),
      serverUrl: z.string().url().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ projectUrlOrId, serverUrl, timeoutMs }) =>
      cliTool(
        [
          "session",
          "new",
          ...(serverUrl ? ["--server-url", serverUrl as string] : []),
          projectUrlOrId as string,
        ],
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_list_sessions",
    "List active @framer/agent sessions.",
    {
      timeoutMs: timeoutSchema,
    },
    async ({ timeoutMs }) =>
      cliTool(["session", "list"], { timeoutMs: timeoutMs as number | undefined }),
  ),

  defineTool(
    "framer_destroy_session",
    "Destroy an active @framer/agent session.",
    {
      sessionId: z.string().min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      cliTool(["session", "destroy", sessionId as string], {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_relay_restart",
    "Restart the local @framer/agent relay server.",
    {
      timeoutMs: timeoutSchema,
    },
    async ({ timeoutMs }) =>
      cliTool(["relay", "restart"], { timeoutMs: timeoutMs as number | undefined }),
  ),

  defineTool(
    "framer_relay_stop",
    "Stop the local @framer/agent relay server.",
    {
      timeoutMs: timeoutSchema,
    },
    async ({ timeoutMs }) =>
      cliTool(["relay", "stop"], { timeoutMs: timeoutMs as number | undefined }),
  ),

  defineTool(
    "framer_telemetry",
    "Manage @framer/agent telemetry.",
    {
      action: z.enum(["status", "enable", "disable"]),
      timeoutMs: timeoutSchema,
    },
    async ({ action, timeoutMs }) =>
      cliTool(["telemetry", action as string], {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),
];
