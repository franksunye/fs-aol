import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { RuntimeSecrets } from "./types";

const ALGO = "aes-256-gcm";

function parseKey(raw: string): Buffer {
  const s = raw.trim();
  if (!s) throw new Error("AOL_CONFIG_ENCRYPTION_KEY is required");
  try {
    const key = Buffer.from(s, "base64");
    if (key.length === 32) return key;
  } catch {
    /* hex */
  }
  if (s.length === 64 && /^[0-9a-fA-F]+$/.test(s)) {
    return Buffer.from(s, "hex");
  }
  throw new Error("AOL_CONFIG_ENCRYPTION_KEY must be base64 32 bytes or hex 64");
}

export function encryptSecrets(
  secrets: RuntimeSecrets,
  keyRaw: string
): { ciphertext: string; nonce: string } {
  const key = parseKey(keyRaw);
  const nonce = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, nonce);
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(secrets), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([enc, tag]).toString("base64"),
    nonce: nonce.toString("base64"),
  };
}

export function decryptSecrets(
  ciphertextB64: string,
  nonceB64: string,
  keyRaw: string
): RuntimeSecrets {
  const key = parseKey(keyRaw);
  const nonce = Buffer.from(nonceB64, "base64");
  const combined = Buffer.from(ciphertextB64, "base64");
  const tag = combined.subarray(combined.length - 16);
  const enc = combined.subarray(0, combined.length - 16);
  const decipher = createDecipheriv(ALGO, key, nonce);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString(
    "utf8"
  );
  const data = JSON.parse(plain) as Record<string, string>;
  return {
    fsm_mongo_url: data.fsm_mongo_url ?? "",
    hunyuan_api_key: data.hunyuan_api_key ?? "",
    llm_api_key: data.llm_api_key ?? "",
    wecom_webhook: data.wecom_webhook ?? "",
    wecom_corp_id: data.wecom_corp_id ?? "",
    wecom_agent_id: data.wecom_agent_id ?? "",
    wecom_agent_secret: data.wecom_agent_secret ?? "",
  };
}

export function encryptionKey(): string {
  return process.env.AOL_CONFIG_ENCRYPTION_KEY?.trim() ?? "";
}
