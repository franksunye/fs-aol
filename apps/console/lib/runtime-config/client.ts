"use client";

import type { RuntimeConfigJson, RuntimeSecrets } from "./types";

export type RuntimeConfigPublic = {
  scope: string;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
  config: RuntimeConfigJson;
  secretsMasked: Record<string, string>;
};

export async function fetchRuntimeConfig(): Promise<RuntimeConfigPublic> {
  const res = await fetch("/api/runtime/config");
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function saveRuntimeConfig(
  config: Partial<RuntimeConfigJson>,
  changeSummary?: string
): Promise<RuntimeConfigPublic> {
  const res = await fetch("/api/runtime/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, changeSummary }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function saveRuntimeSecrets(
  secrets: Partial<RuntimeSecrets>,
  changeSummary?: string
): Promise<RuntimeConfigPublic> {
  const res = await fetch("/api/runtime/secrets", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secrets, changeSummary }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export type RuntimeConfigRevisionSummary = {
  version: number;
  changeSummary: string;
  updatedAt: string;
  updatedBy: string | null;
};

export async function fetchRuntimeConfigRevisions(
  limit = 10
): Promise<RuntimeConfigRevisionSummary[]> {
  const res = await fetch(`/api/runtime/config/revisions?limit=${limit}`);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { revisions?: RuntimeConfigRevisionSummary[] };
  return data.revisions ?? [];
}

export async function rollbackRuntimeConfig(
  version: number
): Promise<RuntimeConfigPublic> {
  const res = await fetch("/api/runtime/config/rollback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function testConnector(
  kind: "llm" | "mongo" | "wecom",
  payload?: { config?: Partial<RuntimeConfigJson>; secrets?: Partial<RuntimeSecrets> }
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`/api/runtime/test/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  return res.json();
}
