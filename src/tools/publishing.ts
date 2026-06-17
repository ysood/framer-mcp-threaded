/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { evalExpression, evalStatements, js } from "../framer/scripts.js";
import { defineTool, jsonRecordSchema, sessionIdSchema, timeoutSchema } from "./helpers.js";
import type { ToolDefinition } from "../types.js";

export const publishingTools: ToolDefinition[] = [
  defineTool(
    "framer_agent_publish",
    "Run the Framer agent publish flow. Supports preview, confirm_publish, and deploy_to_production inputs.",
    {
      sessionId: sessionIdSchema,
      input: jsonRecordSchema.default({ action: "preview" }),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, input, timeoutMs }) =>
      evalExpression(sessionId as string, `framer.agent.publish(${js(input)})`, {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_publish_info",
    "Read current publish info for staging and production.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.getPublishInfo()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_deployments",
    "List deployments or deploy a deployment ID to optional domains via the plugin API.",
    {
      sessionId: sessionIdSchema,
      action: z.enum(["list", "deploy"]),
      deploymentId: z.string().optional(),
      domains: z.array(z.string()).optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, action, deploymentId, domains, timeoutMs }) =>
      action === "list"
        ? evalExpression(sessionId as string, "framer.getDeployments()", {
            timeoutMs: timeoutMs as number | undefined,
          })
        : evalExpression(
            sessionId as string,
            `framer.deploy(${js(deploymentId)}, ${js(domains ?? [])})`,
            { timeoutMs: timeoutMs as number | undefined },
          ),
  ),

  defineTool(
    "framer_branches",
    "Manage Framer branches through the agent API.",
    {
      sessionId: sessionIdSchema,
      action: z.enum(["active", "list", "create", "switch", "rename", "delete", "join", "leave", "merge", "changes"]),
      branchId: z.string().optional(),
      title: z.string().optional(),
      targetBranchId: z.string().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, action, branchId, title, targetBranchId, timeoutMs }) => {
      const expressions: Record<string, string> = {
        active: "framer.agent.getActiveBranch()",
        list: "framer.agent.getBranches()",
        create: `framer.agent.createBranch(${js(title)})`,
        switch: `framer.agent.switchBranch(${js(branchId)})`,
        rename: `framer.agent.renameBranch(${js(branchId)}, ${js(title)})`,
        delete: `framer.agent.deleteBranch(${js(branchId)})`,
        join: `framer.agent.joinBranch(${js(branchId)})`,
        leave: `framer.agent.leaveBranch(${js(branchId)})`,
        merge: `framer.agent.mergeBranch(${js(targetBranchId)})`,
        changes: `framer.agent.getBranchChanges(${js(branchId)})`,
      };

      const expression = expressions[action as string];
      if (["switch", "rename", "delete", "join", "leave", "merge"].includes(action as string)) {
        return evalStatements(
          sessionId as string,
          `await ${expression}; return { ok: true };`,
          { timeoutMs: timeoutMs as number | undefined },
        );
      }

      return evalExpression(sessionId as string, expression, {
        timeoutMs: timeoutMs as number | undefined,
      });
    },
  ),

  defineTool(
    "framer_redirects",
    "List, add/update, remove, reorder, or update redirects.",
    {
      sessionId: sessionIdSchema,
      action: z.enum(["list", "add", "remove", "order", "update"]),
      redirects: z.array(jsonRecordSchema).optional(),
      redirectIds: z.array(z.string()).optional(),
      redirectId: z.string().optional(),
      attributes: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, action, redirects, redirectIds, redirectId, attributes, timeoutMs }) => {
      if (action === "list") {
        return evalExpression(sessionId as string, "framer.getRedirects()", {
          timeoutMs: timeoutMs as number | undefined,
        });
      }

      const statementsByAction: Record<string, string> = {
        add: `return await framer.addRedirects(${js(redirects ?? [])});`,
        remove: `await framer.removeRedirects(${js(redirectIds ?? [])}); return { ok: true };`,
        order: `await framer.setRedirectOrder(${js(redirectIds ?? [])}); return { ok: true };`,
        update: `
const redirects = await framer.getRedirects();
const redirect = redirects.find((candidate) => candidate.id === ${js(redirectId)});
if (!redirect) throw new Error("Redirect not found: " + ${js(redirectId)});
return await redirect.setAttributes(${js(attributes ?? {})});
`,
      };

      return evalStatements(sessionId as string, statementsByAction[action as string], {
        timeoutMs: timeoutMs as number | undefined,
      });
    },
  ),

  defineTool(
    "framer_publish_plugin_api",
    "Call the top-level plugin API publish method.",
    {
      sessionId: sessionIdSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, timeoutMs }) =>
      evalExpression(sessionId as string, "framer.publish()", {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),
];
