/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface FramerCommandOptions {
  cwd?: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface FramerCommandResult {
  command: string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
  json?: unknown;
}

export class FramerCliError extends Error {
  result: FramerCommandResult;

  constructor(message: string, result: FramerCommandResult) {
    super(message);
    this.name = "FramerCliError";
    this.result = result;
  }
}

const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Resolve the bundled @framer/agent CLI installed as a dependency of this
 * server. dist/framer/cli.js -> package root is two levels up. Returns null if
 * the dependency is not installed (e.g. running straight from a clone before
 * `npm install`).
 */
export function resolveLocalAgentCli(): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidate = join(
    here,
    "..",
    "..",
    "node_modules",
    "@framer",
    "agent",
    "dist",
    "cli.js",
  );
  return existsSync(candidate) ? candidate : null;
}

function baseCommand(): { command: string; prefix: string[] } {
  const explicit = process.env.FRAMER_AGENT_BIN;

  // An explicit non-npx binary always wins.
  if (explicit && explicit !== "npx") {
    return { command: explicit, prefix: [] };
  }

  // Default: prefer the pinned, locally-installed agent (fast, offline-capable,
  // no per-call npx registry resolution). Run it directly with this Node.
  if (!explicit) {
    const localCli = resolveLocalAgentCli();
    if (localCli) {
      return { command: process.execPath, prefix: [localCli] };
    }
  }

  // FRAMER_AGENT_BIN=npx, or no local install: fall back to npx-resolving the
  // configured package (defaults to @latest only as a last resort).
  return {
    command: "npx",
    prefix: [process.env.FRAMER_AGENT_PACKAGE ?? "@framer/agent@latest"],
  };
}

export async function runFramer(
  args: string[],
  options: FramerCommandOptions = {},
): Promise<FramerCommandResult> {
  const { command, prefix } = baseCommand();
  const fullArgs = [...prefix, ...args];
  return runCommand(command, fullArgs, options);
}

/**
 * Generic capture-spawn used by both the Framer CLI and maintenance commands
 * (e.g. npm) so timeout/stdio/JSON-extraction behavior stays consistent.
 */
export async function runCommand(
  command: string,
  fullArgs: string[],
  options: FramerCommandOptions = {},
): Promise<FramerCommandResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const child = spawn(command, fullArgs, {
      cwd: options.cwd ?? process.env.FRAMER_MCP_CWD ?? process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2_000).unref();
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      const result = {
        command: [command, ...fullArgs],
        exitCode: null,
        stdout,
        stderr,
      };
      reject(new FramerCliError(error.message, result));
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      const result: FramerCommandResult = {
        command: [command, ...fullArgs],
        exitCode,
        stdout,
        stderr,
      };

      const parsed = parseJsonFromStdout(stdout);
      if (parsed.ok) {
        result.json = parsed.value;
      }

      if (timedOut) {
        reject(
          new FramerCliError(
            `Framer CLI command timed out after ${timeoutMs}ms`,
            result,
          ),
        );
        return;
      }

      if (exitCode !== 0) {
        reject(
          new FramerCliError(
            `Framer CLI command failed with exit code ${exitCode}`,
            result,
          ),
        );
        return;
      }

      resolve(result);
    });

    if (options.stdin) {
      child.stdin.end(options.stdin);
    } else {
      child.stdin.end();
    }
  });
}

function parseJsonFromStdout(
  stdout: string,
): { ok: true; value: unknown } | { ok: false } {
  const trimmed = stdout.trim();
  if (!trimmed) return { ok: false };

  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    // @framer/agent can print relay/status lines before script JSON. Try every
    // suffix that begins with a JSON-looking line.
  }

  const lines = trimmed.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const candidate = lines.slice(index).join("\n").trim();
    if (!candidate.startsWith("{") && !candidate.startsWith("[")) continue;
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      // Keep scanning.
    }
  }

  return { ok: false };
}

export function commandPayload(result: FramerCommandResult): Record<string, unknown> {
  return {
    command: result.command,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    ...(result.json === undefined ? {} : { json: result.json }),
  };
}

export function errorPayload(error: unknown): Record<string, unknown> {
  if (error instanceof FramerCliError) {
    return {
      error: error.message,
      ...commandPayload(error.result),
    };
  }

  return {
    error: error instanceof Error ? error.message : String(error),
  };
}
