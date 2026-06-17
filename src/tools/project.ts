/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { evalExpression, evalStatements } from "../framer/scripts.js";
import {
  defineTool,
  jsonRecordSchema,
  sessionIdSchema,
  timeoutSchema,
} from "./helpers.js";
import type { ToolDefinition } from "../types.js";

export const projectTools: ToolDefinition[] = [
  defineTool(
    "framer_get_context",
    "Read the project-specific Framer agent context string: fonts, components, tokens, site map, icon sets, and more.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.agent.getContext()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_get_system_prompt",
    "Read the static Framer agent system prompt, including DSL command syntax and query documentation.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.agent.getSystemPrompt()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_get_project_info",
    "Read Framer project metadata such as project name and ID.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.getProjectInfo()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_get_current_user",
    "Read the Framer user currently authorized for this session.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.getCurrentUser()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_ping",
    "Run a liveness round-trip through the Framer transport.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        "await framer.ping(); return { ok: true };",
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_get_changed_paths",
    "Read changed page paths in the current project/branch.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.getChangedPaths()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_get_change_contributors",
    "Read change contributors between optional project versions.",
    {
      sessionId: sessionIdSchema,
      fromVersion: z.number().int().optional(),
      toVersion: z.number().int().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, fromVersion, toVersion, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.getChangeContributors(${fromVersion ?? "undefined"}, ${toVersion ?? "undefined"})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_get_custom_code",
    "Read custom code snippets configured by the current plugin/session.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.getCustomCode()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_set_custom_code",
    "Set or clear a custom code snippet. Pass html=null to clear the snippet at the location.",
    {
      sessionId: sessionIdSchema,
      location: z.enum(["headStart", "headEnd", "bodyStart", "bodyEnd"]),
      html: z.string().nullable(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, location, html, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.setCustomCode(${JSON.stringify({ location, html })})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_set_plugin_data",
    "Set global plugin data on the Framer project. Pass value=null to remove.",
    {
      sessionId: sessionIdSchema,
      key: z.string().min(1),
      value: z.string().nullable(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, key, value, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.setPluginData(${JSON.stringify(key)}, ${JSON.stringify(value)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_get_plugin_data",
    "Read global plugin data from the Framer project.",
    {
      sessionId: sessionIdSchema,
      key: z.string().min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, key, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.getPluginData(${JSON.stringify(key)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_get_plugin_data_keys",
    "List global plugin data keys for the Framer project.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.getPluginDataKeys()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_call_agent_method",
    "Escape hatch for calling a framer.agent method by name with JSON arguments.",
    {
      sessionId: sessionIdSchema,
      method: z.string().min(1).describe("Method name inside framer.agent, for example getNode."),
      args: z.array(z.unknown()).default([]),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, method, args, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const method = ${JSON.stringify(method)};
if (!framer.agent[method]) throw new Error("Unknown framer.agent method: " + method);
return await framer.agent[method](...${JSON.stringify(args ?? [])});
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_call_method",
    "Escape hatch for calling a top-level framer method by name with JSON arguments.",
    {
      sessionId: sessionIdSchema,
      method: z.string().min(1).describe("Method name inside framer, for example getProjectInfo."),
      args: z.array(z.unknown()).default([]),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, method, args, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const method = ${JSON.stringify(method)};
if (!framer[method]) throw new Error("Unknown framer method: " + method);
return await framer[method](...${JSON.stringify(args ?? [])});
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),
];
