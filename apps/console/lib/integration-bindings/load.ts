import fs from "node:fs";
import path from "node:path";
import { contractsDir } from "../contracts";
import type { IntegrationBinding } from "./types";

const cache = new Map<string, IntegrationBinding>();

export function integrationBindingsDir(): string {
  return path.join(contractsDir(), "integration-bindings");
}

export function loadBinding(id: string, version = "v1"): IntegrationBinding {
  const key = `${id}.${version}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const filePath = path.join(integrationBindingsDir(), `${key}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  const doc = JSON.parse(raw) as IntegrationBinding;
  cache.set(key, doc);
  return doc;
}
