/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { evalExpression, evalStatements, js } from "../framer/scripts.js";
import { defineTool, jsonRecordSchema, sessionIdSchema, timeoutSchema } from "./helpers.js";
import type { ToolDefinition } from "../types.js";

export const styleTools: ToolDefinition[] = [
  defineTool(
    "framer_list_styles",
    "List color styles and/or text styles in the Framer project.",
    {
      sessionId: sessionIdSchema,
      kind: z.enum(["color", "text", "both"]).default("both"),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, kind, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const result = {};
if (${js(kind)} === "color" || ${js(kind)} === "both") result.colorStyles = await framer.getColorStyles();
if (${js(kind)} === "text" || ${js(kind)} === "both") result.textStyles = await framer.getTextStyles();
return result;
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_style_get",
    "Get a color or text style by ID.",
    {
      sessionId: sessionIdSchema,
      kind: z.enum(["color", "text"]),
      id: z.string().min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, kind, id, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        kind === "color" ? `framer.getColorStyle(${js(id)})` : `framer.getTextStyle(${js(id)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_style_create",
    "Create a color style or text style.",
    {
      sessionId: sessionIdSchema,
      kind: z.enum(["color", "text"]),
      attributes: jsonRecordSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, kind, attributes, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        kind === "color"
          ? `framer.createColorStyle(${js(attributes)})`
          : `framer.createTextStyle(${js(attributes)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_style_update",
    "Update a color style or text style by ID.",
    {
      sessionId: sessionIdSchema,
      kind: z.enum(["color", "text"]),
      id: z.string().min(1),
      attributes: jsonRecordSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, kind, id, attributes, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const style = ${kind === "color" ? `await framer.getColorStyle(${js(id)})` : `await framer.getTextStyle(${js(id)})`};
if (!style) throw new Error("Style not found: " + ${js(id)});
return await style.setAttributes(${js(attributes)});
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_style_remove",
    "Remove a color style or text style by ID.",
    {
      sessionId: sessionIdSchema,
      kind: z.enum(["color", "text"]),
      id: z.string().min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, kind, id, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const style = ${kind === "color" ? `await framer.getColorStyle(${js(id)})` : `await framer.getTextStyle(${js(id)})`};
if (!style) throw new Error("Style not found: " + ${js(id)});
await style.remove();
return { ok: true };
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_fonts",
    "Read fonts. Use action=list for all fonts or action=get for a specific family/weight/style.",
    {
      sessionId: sessionIdSchema,
      action: z.enum(["list", "get"]),
      family: z.string().optional(),
      attributes: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, action, family, attributes, timeoutMs }) =>
      action === "list"
        ? evalExpression(sessionId as string, "framer.getFonts()", {
            timeoutMs: timeoutMs as number | undefined,
          })
        : evalExpression(
            sessionId as string,
            `framer.getFont(${js(family)}, ${js(attributes ?? {})})`,
            { timeoutMs: timeoutMs as number | undefined },
          ),
  ),

  defineTool(
    "framer_get_vector_sets",
    "Get all available Framer vector/icon sets from the plugin API.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.getVectorSets()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),
];
