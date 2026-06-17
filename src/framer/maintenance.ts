/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FramerCliError, runCommand, runFramer } from "./cli.js";

/**
 * Absolute path to this MCP server's package root.
 * dist/framer/maintenance.js -> root is two levels up.
 */
function serverRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..");
}

async function readAgentVersion(timeoutMs?: number): Promise<string | null> {
  try {
    const result = await runFramer(["--version"], { timeoutMs });
    const line = result.stdout.trim().split(/\r?\n/).pop();
    return line ?? null;
  } catch {
    return null;
  }
}

export interface UpdateAgentOptions {
  version?: string;
  timeoutMs?: number;
}

/**
 * Update the bundled @framer/agent dependency to a target version (default
 * "latest") by running `npm install @framer/agent@<version> --save-exact` in
 * the server root. Pins the result in package.json so the upgrade is an
 * explicit, reviewable change rather than silent @latest drift.
 */
export async function updateFramerAgent(
  options: UpdateAgentOptions = {},
): Promise<Record<string, unknown>> {
  const version = options.version?.trim() || "latest";
  const cwd = serverRoot();

  const previousVersion = await readAgentVersion(options.timeoutMs);

  const install = await runCommand(
    "npm",
    ["install", `@framer/agent@${version}`, "--save-exact"],
    { cwd, timeoutMs: options.timeoutMs ?? 300_000 },
  );

  const newVersion = await readAgentVersion(options.timeoutMs);

  return {
    requestedVersion: version,
    previousVersion,
    newVersion,
    changed: Boolean(newVersion) && previousVersion !== newVersion,
    packageJson: join(cwd, "package.json"),
    install: {
      command: install.command,
      exitCode: install.exitCode,
      stdout: install.stdout,
      stderr: install.stderr,
    },
  };
}

interface StepResult {
  ok: boolean;
  command?: string[];
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  error?: string;
}

/** Run a command and capture its result without throwing, for multi-step reports. */
async function step(
  command: string,
  args: string[],
  options: { cwd: string; timeoutMs?: number },
): Promise<StepResult> {
  try {
    const r = await runCommand(command, args, options);
    return {
      ok: true,
      command: r.command,
      exitCode: r.exitCode,
      stdout: r.stdout,
      stderr: r.stderr,
    };
  } catch (error) {
    if (error instanceof FramerCliError) {
      return {
        ok: false,
        command: error.result.command,
        exitCode: error.result.exitCode,
        stdout: error.result.stdout,
        stderr: error.result.stderr,
        error: error.message,
      };
    }
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export interface UpdateServerOptions {
  /** "ff" (default) fast-forwards only; "hard" force-resets to the upstream commit. */
  mode?: "ff" | "hard";
  timeoutMs?: number;
}

/**
 * Self-update: sync this MCP server to its git remote, reinstall deps, and
 * rebuild. Intended for distributed installs — when the maintainer pushes
 * updates, an end user runs this to pull them in. Changes take effect after the
 * MCP client restarts the server (the running process keeps the old build in
 * memory).
 *
 * Steps: git fetch -> ff-merge (or hard reset) -> npm install -> npm run build,
 * each captured and reported. Install/build run only when the commit changed.
 */
export async function updateServer(
  options: UpdateServerOptions = {},
): Promise<Record<string, unknown>> {
  const cwd = serverRoot();
  const mode = options.mode ?? "ff";
  const longTimeout = options.timeoutMs ?? 300_000;
  const shortTimeout = 30_000;

  const before = await step("git", ["rev-parse", "HEAD"], { cwd, timeoutMs: shortTimeout });
  const fetch = await step("git", ["fetch", "--all", "--prune"], { cwd, timeoutMs: longTimeout });

  const sync = fetch.ok
    ? mode === "hard"
      ? await step("git", ["reset", "--hard", "@{u}"], { cwd, timeoutMs: longTimeout })
      : await step("git", ["merge", "--ff-only", "@{u}"], { cwd, timeoutMs: longTimeout })
    : { ok: false, error: "skipped: git fetch failed" };

  const after = sync.ok
    ? await step("git", ["rev-parse", "HEAD"], { cwd, timeoutMs: shortTimeout })
    : before;

  const changed =
    Boolean(before.stdout && after.stdout) &&
    before.stdout!.trim() !== after.stdout!.trim();

  let install: StepResult | { ok: true; skipped: string } | undefined;
  let build: StepResult | { ok: true; skipped: string } | undefined;
  if (sync.ok && changed) {
    install = await step("npm", ["install"], { cwd, timeoutMs: longTimeout });
    build = install.ok
      ? await step("npm", ["run", "build"], { cwd, timeoutMs: longTimeout })
      : { ok: false, error: "skipped: npm install failed" };
  } else if (sync.ok) {
    install = { ok: true, skipped: "already up to date" };
    build = { ok: true, skipped: "already up to date" };
  }

  const success =
    fetch.ok &&
    sync.ok &&
    (!install || (install as StepResult).ok) &&
    (!build || (build as StepResult).ok);

  return {
    serverRoot: cwd,
    mode,
    success,
    changed,
    previousCommit: before.stdout?.trim() ?? null,
    currentCommit: after.stdout?.trim() ?? null,
    restartRequired: changed,
    note: changed
      ? "Updated. Restart the MCP client so the server reloads the new build."
      : "Already up to date.",
    steps: { before, fetch, sync, install, build },
  };
}
