#!/usr/bin/env node
/** Wrapper — runs migrate from apps/console (needs @libsql/client). */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(
  process.execPath,
  [join(root, "apps/console/scripts/migrate-env-to-runtime-config.mjs"), ...process.argv.slice(2)],
  { stdio: "inherit", cwd: join(root, "apps/console"), env: process.env }
);
process.exit(r.status ?? 1);
