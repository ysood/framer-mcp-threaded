/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { commandPayload, errorPayload, runFramer } from "../framer/cli.js";
import { jsonResult } from "../types.js";
import type { ToolDefinition } from "../types.js";

export const sessionIdSchema = z
  .string()
  .min(1)
  .describe("Framer agent session ID returned by framer_open_session.");

export const pagePathSchema = z
  .string()
  .optional()
  .describe("Target page path, for example '/'. Defaults to the active page.");

export const timeoutSchema = z
  .number()
  .int()
  .positive()
  .max(900_000)
  .optional()
  .describe("Optional timeout in milliseconds.");

export const jsonRecordSchema = z.record(z.unknown());

export function defineTool(
  name: string,
  description: string,
  inputSchema: z.ZodRawShape,
  handler: (args: Record<string, unknown>) => Promise<unknown>,
): ToolDefinition {
  return {
    name,
    description,
    inputSchema,
    handler: async (args) => {
      try {
        return jsonResult(await handler(args));
      } catch (error) {
        return jsonResult(errorPayload(error), true);
      }
    },
  };
}

export async function cliTool(
  args: string[],
  options: { timeoutMs?: number } = {},
): Promise<Record<string, unknown>> {
  const result = await runFramer(args, { timeoutMs: options.timeoutMs });
  return commandPayload(result);
}

export function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

export function optionalPageOptions(pagePath: unknown): string {
  return pagePath ? `, { pagePath: ${JSON.stringify(pagePath)} }` : "";
}
