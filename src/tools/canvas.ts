/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { cliTool, defineTool, jsonRecordSchema, optionalPageOptions, pagePathSchema, sessionIdSchema, timeoutSchema } from "./helpers.js";
import { evalExpression, evalStatements, execScript, js } from "../framer/scripts.js";
import type { ToolDefinition } from "../types.js";

const readProjectQuerySchema = z.record(z.unknown());
const nodeTypesSchema = z.array(z.string().min(1)).min(1);

export const canvasTools: ToolDefinition[] = [
  defineTool(
    "framer_exec_script",
    "Execute arbitrary JavaScript inside a Framer agent session. Use as an escape hatch when typed tools do not cover a workflow.",
    {
      sessionId: sessionIdSchema,
      code: z.string().min(1),
      forceFile: z.boolean().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, code, forceFile, timeoutMs }) =>
      execScript(sessionId as string, code as string, {
        forceFile: forceFile as boolean | undefined,
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_read_project",
    "Run framer.agent.readProject queries. Query types include font-search, implementation-guide-from-index, and screenshot.",
    {
      sessionId: sessionIdSchema,
      queries: z.array(readProjectQuerySchema).min(1),
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, queries, pagePath, timeoutMs }) =>
      cliTool(
        [
          "read-project",
          "-s",
          sessionId as string,
          "-q",
          JSON.stringify(queries),
          ...(pagePath ? ["-p", pagePath as string] : []),
        ],
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_apply_changes",
    "Apply Framer agent canvas DSL changes to a page. Optionally review changes immediately after applying.",
    {
      sessionId: sessionIdSchema,
      dsl: z.string().min(1),
      pagePath: z.string().default("/"),
      autoReview: z.boolean().default(false),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, dsl, pagePath, autoReview, timeoutMs }) => {
      const apply = await cliTool(
        [
          "apply-changes",
          "-s",
          sessionId as string,
          "-e",
          dsl as string,
          "-p",
          pagePath as string,
        ],
        { timeoutMs: timeoutMs as number | undefined },
      );

      if (!autoReview) return { apply };

      const review = await evalExpression(
        sessionId as string,
        "framer.agent.reviewChanges()",
        { timeoutMs: timeoutMs as number | undefined },
      );
      return { apply, review };
    },
  ),

  defineTool(
    "framer_review_changes",
    "Review changes accumulated in the current Framer agent session after applyChanges calls.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.agent.reviewChanges()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_get_nodes_of_types",
    "Get every node on a page matching one or more Framer node types.",
    {
      sessionId: sessionIdSchema,
      types: nodeTypesSchema,
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, types, pagePath, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.getNodesOfTypes({ types: ${js(types)} }${optionalPageOptions(pagePath)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_get_node",
    "Read a single node and its children from the active or specified page.",
    {
      sessionId: sessionIdSchema,
      id: z.string().min(1),
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, id, pagePath, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.getNode({ id: ${js(id)} }${optionalPageOptions(pagePath)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_get_nodes",
    "Read multiple nodes and their children from the active or specified page.",
    {
      sessionId: sessionIdSchema,
      ids: z.array(z.string().min(1)).min(1),
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, ids, pagePath, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.getNodes({ ids: ${js(ids)} }${optionalPageOptions(pagePath)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_serialize_node",
    "Serialize a node with optional depth, attributeFilter, and ancestorPath.",
    {
      sessionId: sessionIdSchema,
      id: z.string().min(1),
      depth: z.number().int().nonnegative().optional(),
      attributeFilter: z.array(z.string()).optional(),
      ancestorPath: z.boolean().optional(),
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, id, depth, attributeFilter, ancestorPath, pagePath, timeoutMs }) => {
      const input = { id, depth, attributeFilter, ancestorPath };
      return evalExpression(
        sessionId as string,
        `framer.agent.serialize(${js(input)}${optionalPageOptions(pagePath)})`,
        { timeoutMs: timeoutMs as number | undefined },
      );
    },
  ),

  defineTool(
    "framer_serialize_nodes",
    "Serialize multiple nodes with optional depth, attributeFilter, and ancestorPath.",
    {
      sessionId: sessionIdSchema,
      ids: z.array(z.string().min(1)).min(1),
      depth: z.number().int().nonnegative().optional(),
      attributeFilter: z.array(z.string()).optional(),
      ancestorPath: z.boolean().optional(),
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, ids, depth, attributeFilter, ancestorPath, pagePath, timeoutMs }) => {
      const input = { ids, depth, attributeFilter, ancestorPath };
      return evalExpression(
        sessionId as string,
        `framer.agent.serializeNodes(${js(input)}${optionalPageOptions(pagePath)})`,
        { timeoutMs: timeoutMs as number | undefined },
      );
    },
  ),

  ...[
    ["framer_get_parent_node", "framer.agent.getParentNode"],
    ["framer_get_ancestors", "framer.agent.getAncestors"],
    ["framer_get_scope_node", "framer.agent.getScopeNode"],
    ["framer_get_ground_node", "framer.agent.getGroundNode"],
  ].map(([name, method]) =>
    defineTool(
      name,
      `Call ${method} for a node.`,
      {
        sessionId: sessionIdSchema,
        id: z.string().min(1),
        pagePath: pagePathSchema,
        timeoutMs: timeoutSchema,
      },
      async ({ sessionId, id, pagePath, timeoutMs }) =>
        evalExpression(
          sessionId as string,
          `${method}({ id: ${js(id)} }${optionalPageOptions(pagePath)})`,
          { timeoutMs: timeoutMs as number | undefined },
        ),
    ),
  ),

  defineTool(
    "framer_paginate",
    "Paginate a large array across calls using framer.agent.paginate.",
    {
      sessionId: sessionIdSchema,
      input: jsonRecordSchema,
      pagePath: pagePathSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, input, pagePath, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.paginate(${js(input)}${optionalPageOptions(pagePath)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_canvas_add_text",
    "Add a new text node to the canvas using the plugin API.",
    {
      sessionId: sessionIdSchema,
      text: z.string(),
      options: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, text, options, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `await framer.addText(${js(text)}, ${js(options ?? {})}); return { ok: true };`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_canvas_add_svg",
    "Add or replace an SVG on the canvas using the plugin API.",
    {
      sessionId: sessionIdSchema,
      svg: z.union([z.string(), jsonRecordSchema]),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, svg, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `await framer.addSVG(${js(svg)}); return { ok: true };`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_canvas_create_page",
    "Create a web page or design page via the plugin API.",
    {
      sessionId: sessionIdSchema,
      kind: z.enum(["web", "design"]),
      pathOrName: z.string().min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, kind, pathOrName, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        kind === "web"
          ? `framer.createWebPage(${js(pathOrName)})`
          : `framer.createDesignPage(${js(pathOrName)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_canvas_create_node",
    "Create a frame, text, or component node using low-level plugin APIs.",
    {
      sessionId: sessionIdSchema,
      kind: z.enum(["frame", "text", "component"]),
      name: z.string().optional(),
      attributes: jsonRecordSchema.optional(),
      parentId: z.string().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, kind, name, attributes, parentId, timeoutMs }) => {
      const expression =
        kind === "component"
          ? `framer.createComponentNode(${js(name ?? "Component")})`
          : kind === "text"
            ? `framer.createTextNode(${js(attributes ?? {})}, ${js(parentId)})`
            : `framer.createFrameNode(${js(attributes ?? {})}, ${js(parentId)})`;
      return evalExpression(sessionId as string, expression, {
        timeoutMs: timeoutMs as number | undefined,
      });
    },
  ),

  defineTool(
    "framer_canvas_set_attributes",
    "Set attributes on a node using the low-level plugin API.",
    {
      sessionId: sessionIdSchema,
      nodeId: z.string().min(1),
      attributes: jsonRecordSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, nodeId, attributes, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.setAttributes(${js(nodeId)}, ${js(attributes)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_canvas_set_parent",
    "Move a node to a parent at an optional index using the low-level plugin API.",
    {
      sessionId: sessionIdSchema,
      nodeId: z.string().min(1),
      parentId: z.string().min(1),
      index: z.number().int().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, nodeId, parentId, index, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `await framer.setParent(${js(nodeId)}, ${js(parentId)}, ${index ?? "undefined"}); return { ok: true };`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_canvas_selection",
    "Set the current Framer canvas selection.",
    {
      sessionId: sessionIdSchema,
      nodeIds: z.union([z.string(), z.array(z.string())]),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, nodeIds, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `await framer.setSelection(${js(nodeIds)}); return { ok: true };`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_canvas_text",
    "Get or set selected text through the top-level text helpers.",
    {
      sessionId: sessionIdSchema,
      action: z.enum(["get", "set"]),
      text: z.string().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, action, text, timeoutMs }) =>
      action === "get"
        ? evalExpression(sessionId as string, "framer.getText()", {
            timeoutMs: timeoutMs as number | undefined,
          })
        : evalStatements(
            sessionId as string,
            `await framer.setText(${js(text ?? "")}); return { ok: true };`,
            { timeoutMs: timeoutMs as number | undefined },
          ),
  ),

  defineTool(
    "framer_canvas_node_action",
    "Run common low-level canvas actions: clone node, remove nodes, get children, parent, rect, screenshot, or export SVG.",
    {
      sessionId: sessionIdSchema,
      action: z.enum(["clone", "remove", "children", "parent", "rect", "screenshot", "export_svg"]),
      nodeId: z.string().optional(),
      nodeIds: z.array(z.string()).optional(),
      screenshotOptions: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, action, nodeId, nodeIds, screenshotOptions, timeoutMs }) => {
      const id = js(nodeId);
      const expressionByAction: Record<string, string> = {
        clone: `framer.cloneNode(${id})`,
        children: `framer.getChildren(${id})`,
        parent: `framer.getParent(${id})`,
        rect: `framer.getRect(${id})`,
        screenshot: `framer.screenshot(${id}, ${js(screenshotOptions ?? {})})`,
        export_svg: `framer.exportSVG(${id})`,
        remove: `framer.removeNodes(${js(nodeIds ?? (nodeId ? [nodeId] : []))})`,
      };

      if (action === "remove") {
        return evalStatements(
          sessionId as string,
          `await ${expressionByAction.remove}; return { ok: true };`,
          { timeoutMs: timeoutMs as number | undefined },
        );
      }

      return evalExpression(sessionId as string, expressionByAction[action as string], {
        timeoutMs: timeoutMs as number | undefined,
      });
    },
  ),
];
