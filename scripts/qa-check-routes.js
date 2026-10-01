#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tsScript = path.join(__dirname, "qa-check-routes.ts");

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npx, ["tsx", tsScript], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
