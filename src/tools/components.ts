/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { evalExpression } from "../framer/scripts.js";
import { defineTool, jsonRecordSchema, optionalPageOptions, pagePathSchema, sessionIdSchema, timeoutSchema } from "./helpers.js";
import type { ToolDefinition } from "../types.js";

export const componentTools: ToolDefinition[] = [
  defineTool(
    "framer_read_component_controls",
    "Read control definitions for project or insert-panel components.",
    {
      sessionId: sessionIdSchema,
      componentIds: z.array(z.string().min(1)).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, componentIds, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.readComponentControls({ componentIds: ${JSON.stringify(componentIds)} })`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_read_icon_set_controls",
    "Read icon-set control definitions for one or more icon sets.",
    {
      sessionId: sessionIdSchema,
      iconSetNames: z.array(z.string().min(1)).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, iconSetNames, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.readIconSetControls({ iconSetNames: ${JSON.stringify(iconSetNames)} })`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_read_icons",
    "Read exact icon names available in an icon set.",
    {
      sessionId: sessionIdSchema,
      iconSetName: z.string().min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, iconSetName, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.readIcons({ iconSetName: ${JSON.stringify(iconSetName)} })`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_read_layout_template_controls",
    "Read control definitions for layout templates.",
    {
      sessionId: sessionIdSchema,
      layoutTemplateIds: z.array(z.string().min(1)).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, layoutTemplateIds, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.readLayoutTemplateControls({ layoutTemplateIds: ${JSON.stringify(layoutTemplateIds)} })`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_read_shader_controls",
    "Read control definitions for Framer shaders.",
    {
      sessionId: sessionIdSchema,
      shaderNames: z.array(z.string().min(1)).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, shaderNames, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.readShaderControls({ shaderNames: ${JSON.stringify(shaderNames)} })`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_flatten_component_instance",
    "Flatten a local component instance into raw editable layers.",
    {
      sessionId: sessionIdSchema,
      id: z.string().min(1),
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, id, pagePath, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.flattenComponentInstance({ id: ${JSON.stringify(id)} }${optionalPageOptions(pagePath)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_make_external_component_local",
    "Convert an external component instance into a local project component.",
    {
      sessionId: sessionIdSchema,
      id: z.string().min(1),
      replaceAll: z.boolean().optional(),
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, id, replaceAll, pagePath, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.makeExternalComponentLocal(${JSON.stringify({ id, replaceAll })}${optionalPageOptions(pagePath)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_add_component_instance_url",
    "Add a component instance by module URL copied from Framer's components panel.",
    {
      sessionId: sessionIdSchema,
      url: z.string().min(1),
      attributes: jsonRecordSchema.optional(),
      parentId: z.string().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, url, attributes, parentId, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.addComponentInstance(${JSON.stringify({ url, attributes, parentId })})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_add_detached_component_layers",
    "Add detached layers of a component by module URL.",
    {
      sessionId: sessionIdSchema,
      url: z.string().min(1),
      layout: jsonRecordSchema.optional(),
      attributes: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, url, layout, attributes, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.addDetachedComponentLayers(${JSON.stringify({ url, layout, attributes })})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),
];
