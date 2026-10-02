#!/usr/bin/env node
/**
 * qa-check-routes.js
 *
 * Thin wrapper: spawns tsx with the qa-check-routes.ts script.
 * Works on Windows paths that contain spaces by using spawnSync
 * with the script path as a quoted argv element (no shell interpolation).
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const tsScript = path.join(__dirname, "qa-check-routes.ts");

// Resolve the tsx entry-point as an absolute path so that spawnSync with
// shell:false receives the full path without any shell word-splitting.
const tsxEntry = path.join(
  __dirname, "..", "node_modules", "tsx", "dist", "cli.mjs"
);

const result = spawnSync(
  process.execPath,            // node itself — always safe
  [tsxEntry, tsScript],        // node tsx/dist/cli.mjs <script>
  {
    stdio: "inherit",
    env: { ...process.env },
  }
);

process.exit(result.status ?? 0);
