/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { evalExpression, evalStatements } from "../framer/scripts.js";
import { defineTool, jsonRecordSchema, sessionIdSchema, timeoutSchema } from "./helpers.js";
import type { ToolDefinition } from "../types.js";

const assetInputSchema = z.union([z.string(), jsonRecordSchema]);

export const assetTools: ToolDefinition[] = [
  defineTool(
    "framer_query_images",
    "Search for stock images via framer.agent.queryImages. Returned URLs can be used in subsequent canvas fills.",
    {
      sessionId: sessionIdSchema,
      source: z.string().default("unsplash"),
      query: z.string().min(1),
      count: z.number().int().positive().max(20).default(4),
      orientation: z.enum(["landscape", "portrait", "squarish"]).optional(),
      width: z.number().int().positive().optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, source, query, count, orientation, width, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        `framer.agent.queryImages(${JSON.stringify({ source, query, count, orientation, width })})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_upload_image",
    "Upload an image asset without assigning it to a property. Accepts a URL/string or NamedImageAssetInput object.",
    {
      sessionId: sessionIdSchema,
      image: assetInputSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, image, timeoutMs }) =>
      evalExpression(sessionId as string, `framer.uploadImage(${JSON.stringify(image)})`, {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_upload_images",
    "Upload multiple image assets without assigning them to properties.",
    {
      sessionId: sessionIdSchema,
      images: z.array(assetInputSchema).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, images, timeoutMs }) =>
      evalExpression(sessionId as string, `framer.uploadImages(${JSON.stringify(images)})`, {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_upload_file",
    "Upload a file asset without assigning it to a property. Accepts a URL/string or NamedFileAssetInput object.",
    {
      sessionId: sessionIdSchema,
      file: assetInputSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, file, timeoutMs }) =>
      evalExpression(sessionId as string, `framer.uploadFile(${JSON.stringify(file)})`, {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_upload_files",
    "Upload multiple file assets without assigning them to properties.",
    {
      sessionId: sessionIdSchema,
      files: z.array(assetInputSchema).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, files, timeoutMs }) =>
      evalExpression(sessionId as string, `framer.uploadFiles(${JSON.stringify(files)})`, {
        timeoutMs: timeoutMs as number | undefined,
      }),
  ),

  defineTool(
    "framer_add_image",
    "Upload an image and insert it on the canvas.",
    {
      sessionId: sessionIdSchema,
      image: assetInputSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, image, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `await framer.addImage(${JSON.stringify(image)}); return { ok: true };`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_add_images",
    "Upload multiple images and insert/replace selected images on the canvas.",
    {
      sessionId: sessionIdSchema,
      images: z.array(assetInputSchema).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, images, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `await framer.addImages(${JSON.stringify(images)}); return { ok: true };`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_selected_image",
    "Get or set the current selected image.",
    {
      sessionId: sessionIdSchema,
      action: z.enum(["get", "set"]),
      image: assetInputSchema.optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, action, image, timeoutMs }) =>
      action === "get"
        ? evalExpression(sessionId as string, "framer.getImage()", {
            timeoutMs: timeoutMs as number | undefined,
          })
        : evalStatements(
            sessionId as string,
            `await framer.setImage(${JSON.stringify(image)}); return { ok: true };`,
            { timeoutMs: timeoutMs as number | undefined },
          ),
  ),
];
