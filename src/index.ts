#!/usr/bin/env node
/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

/**
 * Framer MCP Threaded — entry point.
 *
 * Stdio MCP server that wraps the official @framer/agent CLI. Tools are
 * grouped by feature area, while the Framer connection/session mechanics stay
 * centralized in src/framer.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tools } from "./tools/index.js";
import { serverInfo } from "./branding.js";

const server = new McpServer(serverInfo);

for (const tool of tools) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema as any,
    tool.handler as any,
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
