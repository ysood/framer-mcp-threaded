#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const serverPath = resolve(projectRoot, "dist/index.js");
const configPath =
  process.argv[2] ??
  `${homedir()}/Library/Application Support/Claude/claude_desktop_config.json`;

const serverName = "framer-mcp-threaded";
const serverConfig = {
  command: "node",
  args: [serverPath],
};

mkdirSync(dirname(configPath), { recursive: true });

const config = existsSync(configPath)
  ? JSON.parse(readFileSync(configPath, "utf8"))
  : {};

config.mcpServers ??= {};
const previous = config.mcpServers[serverName];
config.mcpServers[serverName] = serverConfig;

if (existsSync(configPath)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  copyFileSync(configPath, `${configPath}.bak-${stamp}`);
}

writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      configPath,
      serverName,
      serverConfig,
      replacedExistingEntry: Boolean(previous),
    },
    null,
    2,
  ),
);
