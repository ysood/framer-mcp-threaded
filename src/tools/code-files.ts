/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { evalExpression, evalStatements, js } from "../framer/scripts.js";
import { defineTool, jsonRecordSchema, sessionIdSchema, timeoutSchema } from "./helpers.js";
import type { ToolDefinition } from "../types.js";

export const codeFileTools: ToolDefinition[] = [
  defineTool(
    "framer_list_code_files",
    "List code files in the Framer project, optionally including source content.",
    {
      sessionId: sessionIdSchema,
      includeContent: z.boolean().default(false),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, includeContent, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const files = await framer.getCodeFiles();
return files.map((file) => ({
  id: file.id,
  name: file.name,
  path: file.path,
  exports: file.exports,
  ...((${Boolean(includeContent)}) ? { content: file.content } : {}),
}));
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_read_code_file",
    "Read a code file by ID or path.",
    {
      sessionId: sessionIdSchema,
      idOrPath: z.string().min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, idOrPath, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const file = await framer.getCodeFile(${js(idOrPath)});
if (!file) throw new Error("Code file not found: " + ${js(idOrPath)});
return {
  id: file.id,
  name: file.name,
  path: file.path,
  content: file.content,
  exports: file.exports,
};
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_create_code_file",
    "Create a new Framer code file and optionally typecheck it.",
    {
      sessionId: sessionIdSchema,
      name: z.string().min(1),
      code: z.string(),
      editViaPlugin: z.boolean().optional(),
      typecheck: z.boolean().default(true),
      compilerOptions: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, name, code, editViaPlugin, typecheck, compilerOptions, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const file = await framer.createCodeFile(${js(name)}, ${js(code)}, ${js({ editViaPlugin })});
const diagnostics = ${Boolean(typecheck)} ? await file.typecheck(${js(compilerOptions ?? {})}) : undefined;
return {
  id: file.id,
  name: file.name,
  path: file.path,
  exports: file.exports,
  diagnostics,
};
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_update_code_file",
    "Replace the content of an existing Framer code file and optionally typecheck it.",
    {
      sessionId: sessionIdSchema,
      idOrPath: z.string().min(1),
      code: z.string(),
      typecheck: z.boolean().default(true),
      compilerOptions: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, idOrPath, code, typecheck, compilerOptions, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const file = await framer.getCodeFile(${js(idOrPath)});
if (!file) throw new Error("Code file not found: " + ${js(idOrPath)});
const updated = await file.setFileContent(${js(code)});
const diagnostics = ${Boolean(typecheck)} ? await updated.typecheck(${js(compilerOptions ?? {})}) : undefined;
return {
  id: updated.id,
  name: updated.name,
  path: updated.path,
  exports: updated.exports,
  diagnostics,
};
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_typecheck_code",
    "Typecheck code content without saving it to a Framer code file.",
    {
      sessionId: sessionIdSchema,
      fileName: z.string().min(1),
      content: z.string(),
      compilerOptions: jsonRecordSchema.optional(),
      typecheckSessionId: z.string().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, fileName, content, compilerOptions, typecheckSessionId, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.typecheckCode(${js(fileName)}, ${js(content)}, ${js(compilerOptions ?? {})}, ${js(typecheckSessionId)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_code_file_action",
    "Run actions on a code file: rename, remove, get versions, navigate, show progress, or remove progress.",
    {
      sessionId: sessionIdSchema,
      idOrPath: z.string().min(1),
      action: z.enum(["rename", "remove", "versions", "navigate", "show_progress", "remove_progress"]),
      newName: z.string().optional(),
      progressAttributes: jsonRecordSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, idOrPath, action, newName, progressAttributes, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const file = await framer.getCodeFile(${js(idOrPath)});
if (!file) throw new Error("Code file not found: " + ${js(idOrPath)});
switch (${js(action)}) {
  case "rename": return await file.rename(${js(newName)});
  case "remove": await file.remove(); return { ok: true };
  case "versions": return await file.getVersions();
  case "navigate": await file.navigateTo(); return { ok: true };
  case "show_progress": await file.showProgressOnInstances(${js(progressAttributes ?? {})}); return { ok: true };
  case "remove_progress": await file.removeProgressFromInstances(); return { ok: true };
}
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),
];
