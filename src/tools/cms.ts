/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

import { z } from "zod";
import { evalExpression, evalStatements, js } from "../framer/scripts.js";
import { defineTool, jsonRecordSchema, sessionIdSchema, timeoutSchema } from "./helpers.js";
import type { ToolDefinition } from "../types.js";

const collectionItemInputSchema = jsonRecordSchema;
const fieldInputSchema = jsonRecordSchema;

export const cmsTools: ToolDefinition[] = [
  defineTool(
    "framer_create_collection",
    "Create a user collection or plugin-managed collection.",
    {
      sessionId: sessionIdSchema,
      name: z.string().min(1),
      managed: z.boolean().default(false),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, name, managed, timeoutMs }) =>
      evalExpression(
        sessionId as string,
        managed ? `framer.createManagedCollection(${js(name)})` : `framer.createCollection(${js(name)})`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_list_collections",
    "List all CMS collections, optionally including their fields and item counts.",
    {
      sessionId: sessionIdSchema,
      includeFields: z.boolean().default(true),
      includeItems: z.boolean().default(false),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, includeFields, includeItems, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collections = await framer.getCollections();
const result = [];
for (const collection of collections) {
  const entry = {
    id: collection.id,
    name: collection.name,
    managedBy: collection.managedBy,
    slugFieldBasedOn: collection.slugFieldBasedOn,
    slugFieldName: collection.slugFieldName,
  };
  if (${Boolean(includeFields)}) entry.fields = await collection.getFields();
  if (${Boolean(includeItems)}) entry.items = await collection.getItems();
  else entry.itemCount = (await collection.getItems()).length;
  result.push(entry);
}
return result;
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_get_collection",
    "Read a CMS collection by ID with optional fields and items.",
    {
      sessionId: sessionIdSchema,
      collectionId: z.string().min(1),
      includeFields: z.boolean().default(true),
      includeItems: z.boolean().default(true),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, collectionId, includeFields, includeItems, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collection = await framer.getCollection(${js(collectionId)});
if (!collection) throw new Error("Collection not found: " + ${js(collectionId)});
const result = {
  id: collection.id,
  name: collection.name,
  managedBy: collection.managedBy,
  slugFieldBasedOn: collection.slugFieldBasedOn,
  slugFieldName: collection.slugFieldName,
};
if (${Boolean(includeFields)}) result.fields = await collection.getFields();
if (${Boolean(includeItems)}) result.items = await collection.getItems();
return result;
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_collection_add_fields",
    "Add fields to a CMS collection.",
    {
      sessionId: sessionIdSchema,
      collectionId: z.string().min(1),
      fields: z.array(fieldInputSchema).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, collectionId, fields, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collection = await framer.getCollection(${js(collectionId)});
if (!collection) throw new Error("Collection not found: " + ${js(collectionId)});
return await collection.addFields(${js(fields)});
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_collection_remove_fields",
    "Remove fields from a CMS collection by field ID.",
    {
      sessionId: sessionIdSchema,
      collectionId: z.string().min(1),
      fieldIds: z.array(z.string().min(1)).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, collectionId, fieldIds, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collection = await framer.getCollection(${js(collectionId)});
if (!collection) throw new Error("Collection not found: " + ${js(collectionId)});
await collection.removeFields(${js(fieldIds)});
return { ok: true };
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_collection_upsert_items",
    "Add or update CMS collection items using Collection.addItems.",
    {
      sessionId: sessionIdSchema,
      collectionId: z.string().min(1),
      items: z.array(collectionItemInputSchema).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, collectionId, items, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collection = await framer.getCollection(${js(collectionId)});
if (!collection) throw new Error("Collection not found: " + ${js(collectionId)});
await collection.addItems(${js(items)});
return { ok: true };
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_collection_remove_items",
    "Remove CMS collection items by item ID.",
    {
      sessionId: sessionIdSchema,
      collectionId: z.string().min(1),
      itemIds: z.array(z.string().min(1)).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, collectionId, itemIds, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collection = await framer.getCollection(${js(collectionId)});
if (!collection) throw new Error("Collection not found: " + ${js(collectionId)});
await collection.removeItems(${js(itemIds)});
return { ok: true };
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_collection_set_order",
    "Set CMS collection field order or item order.",
    {
      sessionId: sessionIdSchema,
      collectionId: z.string().min(1),
      kind: z.enum(["fields", "items"]),
      ids: z.array(z.string().min(1)).min(1),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, collectionId, kind, ids, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collection = await framer.getCollection(${js(collectionId)});
if (!collection) throw new Error("Collection not found: " + ${js(collectionId)});
if (${js(kind)} === "fields") await collection.setFieldOrder(${js(ids)});
else await collection.setItemOrder(${js(ids)});
return { ok: true };
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_collection_item_update",
    "Set attributes on a single CMS item.",
    {
      sessionId: sessionIdSchema,
      collectionId: z.string().min(1),
      itemId: z.string().min(1),
      update: jsonRecordSchema,
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, collectionId, itemId, update, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collection = await framer.getCollection(${js(collectionId)});
if (!collection) throw new Error("Collection not found: " + ${js(collectionId)});
const items = await collection.getItems();
const item = items.find((candidate) => candidate.id === ${js(itemId)} || candidate.nodeId === ${js(itemId)});
if (!item) throw new Error("Collection item not found: " + ${js(itemId)});
return await item.setAttributes(${js(update)});
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_list_managed_collections",
    "List plugin-managed CMS collections available to this plugin/session.",
    {
      sessionId: sessionIdSchema,
      includeFields: z.boolean().default(true),
      includeItemIds: z.boolean().default(false),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, includeFields, includeItemIds, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collections = await framer.getManagedCollections();
const result = [];
for (const collection of collections) {
  const entry = { id: collection.id, name: collection.name, managedBy: collection.managedBy };
  if (${Boolean(includeFields)}) entry.fields = await collection.getFields();
  if (${Boolean(includeItemIds)}) entry.itemIds = await collection.getItemIds();
  result.push(entry);
}
return result;
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),

  defineTool(
    "framer_managed_collection_sync",
    "Set fields and/or upsert items in a plugin-managed CMS collection.",
    {
      sessionId: sessionIdSchema,
      collectionId: z.string().min(1),
      fields: z.array(fieldInputSchema).optional(),
      items: z.array(collectionItemInputSchema).optional(),
      itemOrder: z.array(z.string()).optional(),
      timeoutMs: timeoutSchema,
    },
    async ({ sessionId, collectionId, fields, items, itemOrder, timeoutMs }) =>
      evalStatements(
        sessionId as string,
        `
const collections = await framer.getManagedCollections();
const collection = collections.find((candidate) => candidate.id === ${js(collectionId)});
if (!collection) throw new Error("Managed collection not found: " + ${js(collectionId)});
if (${fields === undefined ? "false" : "true"}) await collection.setFields(${js(fields ?? [])});
if (${items === undefined ? "false" : "true"}) await collection.addItems(${js(items ?? [])});
if (${itemOrder === undefined ? "false" : "true"}) await collection.setItemOrder(${js(itemOrder ?? [])});
return { ok: true };
`,
        { timeoutMs: timeoutMs as number | undefined },
      ),
  ),
];
