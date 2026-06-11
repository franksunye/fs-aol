import type { SecretKey, RuntimeSecrets } from "./types";
import { SECRET_KEYS } from "./types";

export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 6) return "***";
  return `${value.slice(0, 3)}…${value.slice(-3)}`;
}

export function maskSecrets(secrets: RuntimeSecrets): Record<SecretKey, string> {
  const out = {} as Record<SecretKey, string>;
  for (const k of SECRET_KEYS) {
    out[k] = maskSecret(secrets[k] ?? "");
  }
  return out;
}
