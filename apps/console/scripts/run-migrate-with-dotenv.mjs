#!/usr/bin/env node
/** Load repo .env + turso.bak then run migrate-env-to-runtime-config.mjs */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(join(root, ".env"));
loadEnvFile(join(__dirname, "../.env.local.turso.bak"));
loadEnvFile(join(__dirname, "../.env.local"));

const child = spawnSync(
  process.execPath,
  [join(__dirname, "migrate-env-to-runtime-config.mjs"), ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env }
);
process.exit(child.status ?? 1);
