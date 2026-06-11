import type { RuntimeConfigJson, RuntimeSecrets } from "./types";

export async function testLlmConnection(
  config: RuntimeConfigJson,
  secrets: RuntimeSecrets
): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  const provider = config.llm_provider;
  if (provider === "heuristic") {
    return { ok: true, message: "heuristic 模式无需 API" };
  }

  const started = Date.now();
  if (provider === "hunyuan") {
    const key = secrets.hunyuan_api_key || secrets.llm_api_key;
    if (!key) return { ok: false, message: "缺少混元 API Key" };
    const base =
      config.llm_base_url || "https://api.hunyuan.cloud.tencent.com/v1";
    const model = config.llm_model?.includes("hunyuan")
      ? config.llm_model
      : "hunyuan-lite";
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `HTTP ${res.status}: ${text.slice(0, 200)}`, latencyMs };
    }
    return { ok: true, message: `混元 ${model} 连接正常`, latencyMs };
  }

  if (provider === "deepseek") {
    const key = secrets.llm_api_key;
    if (!key) return { ok: false, message: "缺少 DeepSeek API Key" };
    const base = config.llm_base_url || "https://api.deepseek.com/v1";
    const model = config.llm_model || "deepseek-chat";
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `HTTP ${res.status}: ${text.slice(0, 200)}`, latencyMs };
    }
    return { ok: true, message: `DeepSeek ${model} 连接正常`, latencyMs };
  }

  return { ok: false, message: `未知 provider: ${provider}` };
}

export async function testMongoConnection(
  config: RuntimeConfigJson,
  secrets: RuntimeSecrets
): Promise<{ ok: boolean; message: string }> {
  const url = secrets.fsm_mongo_url?.trim();
  if (!url) return { ok: false, message: "未配置 Mongo URL" };
  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(url, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    await client.connect();
    const db = client.db(config.fsm_mongo_db || "xlinkdemo");
    await db.command({ ping: 1 });
    await client.close();
    return { ok: true, message: `Mongo ping OK (${config.fsm_mongo_db})` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function testWecomConnection(
  config: RuntimeConfigJson,
  secrets: RuntimeSecrets
): Promise<{ ok: boolean; message: string }> {
  const webhook = secrets.wecom_webhook?.trim();
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "text",
        text: { content: "[AOL Console] 连接测试（可忽略）" },
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      return { ok: false, message: `Webhook HTTP ${res.status}: ${body.slice(0, 120)}` };
    }
    if (body.includes("errcode") && !body.includes('"errcode":0')) {
      return { ok: false, message: body.slice(0, 200) };
    }
    return {
      ok: true,
      message: config.dry_run
        ? "Webhook 可达（当前 DRY_RUN 预览模式）"
        : "Webhook 发送成功",
    };
  }
  const corp = secrets.wecom_corp_id?.trim();
  const agent = secrets.wecom_agent_id?.trim();
  const secret = secrets.wecom_agent_secret?.trim();
  if (corp && agent && secret) {
    return {
      ok: true,
      message: "企业应用凭证已配置（未发送测试消息）",
    };
  }
  return { ok: false, message: "未配置企微 webhook 或应用凭证" };
}
