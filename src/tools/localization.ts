/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { evalExpression } from "../framer/scripts.js";
import { defineTool, jsonRecordSchema, sessionIdSchema, timeoutSchema } from "./helpers.js";
import type { ToolDefinition } from "../types.js";

export const localizationTools: ToolDefinition[] = [
  defineTool(
    "framer_locales",
    "Read locale data, language/region catalogs, or create a locale.",
    {
      sessionId: sessionIdSchema,
      action: z.enum(["default", "list", "languages", "regions", "create"]),
      languageCode: z.string().optional(),
      input: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, action, languageCode, input, timeoutMs }) => {
      const expressionByAction: Record<string, string> = {
        default: "framer.getDefaultLocale()",
        list: "framer.getLocales()",
        languages: "framer.getLocaleLanguages()",
        regions: `framer.getLocaleRegions(${JSON.stringify(languageCode)})`,
        create: `framer.createLocale(${JSON.stringify(input ?? {})})`,
      };

      return evalExpression(sessionId as string, expressionByAction[action as string], {
        timeoutMs: timeoutMs as number | undefined,
      });
    },
  ),

  defineTool(
    "framer_get_localization_groups",
    "Read localization groups, optionally filtered by type or group IDs.",
    {
      sessionId: sessionIdSchema,
      filter: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, filter, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.getLocalizationGroups(${JSON.stringify(filter ?? undefined)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_set_localization_data",
    "Update localization values and/or locale statuses.",
    {
      sessionId: sessionIdSchema,
      update: jsonRecordSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, update, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.setLocalizationData(${JSON.stringify(update)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),
];
