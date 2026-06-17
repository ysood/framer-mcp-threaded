/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { commandPayload, runFramer } from "./cli.js";

export interface ExecOptions {
  pagePath?: string;
  timeoutMs?: number;
  forceFile?: boolean;
}

const INLINE_CODE_LIMIT = 6_000;

export function js(value: unknown): string {
  return JSON.stringify(value);
}

export async function execScript(
  sessionId: string,
  code: string,
  options: ExecOptions = {},
): Promise<Record<string, unknown>> {
  const args = ["exec", "-s", sessionId];

  if (options.forceFile || code.length > INLINE_CODE_LIMIT) {
    const dir = join(tmpdir(), "framer-mcp-threaded");
    await mkdir(dir, { recursive: true });
    const file = join(dir, `${sessionId}-${randomUUID()}.js`);
    await writeFile(file, code, "utf8");
    args.push("-f", file);
  } else {
    args.push("-e", code);
  }

  const result = await runFramer(args, { timeoutMs: options.timeoutMs });
  return commandPayload(result);
}

export async function execJson(
  sessionId: string,
  body: string,
  options: ExecOptions = {},
): Promise<Record<string, unknown>> {
  const code = `
const __framerMcpSafeStringify = (value) => {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, innerValue) => {
    if (typeof innerValue === "function") return undefined;
    if (innerValue && typeof innerValue === "object") {
      if (seen.has(innerValue)) return "[Circular]";
      seen.add(innerValue);
    }
    return innerValue;
  }, 2);
};

const __framerMcpMain = async () => {
${body}
};

const __framerMcpResult = await __framerMcpMain();
if (__framerMcpResult !== undefined) {
  console.log(__framerMcpSafeStringify(__framerMcpResult));
}
`;

  return execScript(sessionId, code, options);
}

export async function evalExpression(
  sessionId: string,
  expression: string,
  options: ExecOptions = {},
): Promise<Record<string, unknown>> {
  return execJson(sessionId, `return await (${expression});`, options);
}

export async function evalStatements(
  sessionId: string,
  statements: string,
  options: ExecOptions = {},
): Promise<Record<string, unknown>> {
  return execJson(sessionId, statements, options);
}
