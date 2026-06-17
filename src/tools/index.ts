/**
 * Framer MCP Threaded
 * © 2026 Studio Threaded ++ Yuvraj Sood
 * github.com/ysood/framer-mcp-threaded [not affiliated with Framer]
 */

/**
 * Tool registry. Tools are grouped by Framer feature area instead of one file
 * per function so future edits have a predictable home without creating a
 * forest of tiny files.
 */

import { assetTools } from "./assets.js";
import { canvasTools } from "./canvas.js";
import { cmsTools } from "./cms.js";
import { codeFileTools } from "./code-files.js";
import { componentTools } from "./components.js";
import { lifecycleTools } from "./lifecycle.js";
import { localizationTools } from "./localization.js";
import { projectTools } from "./project.js";
import { publishingTools } from "./publishing.js";
import { styleTools } from "./styles.js";

export const tools = [
  ...lifecycleTools,
  ...projectTools,
  ...canvasTools,
  ...componentTools,
  ...assetTools,
  ...cmsTools,
  ...codeFileTools,
  ...styleTools,
  ...localizationTools,
  ...publishingTools,
];
