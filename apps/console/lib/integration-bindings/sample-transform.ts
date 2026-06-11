import { defaultRuntimeConfig } from "@/lib/runtime-config/defaults";
import {
  getRuntimeConfig,
  getRuntimeSecrets,
} from "@/lib/runtime-config/store";
import type { RuntimeConfigJson, RuntimeSecrets } from "@/lib/runtime-config/types";
import { loadBinding } from "./load";
import { mapRecord } from "./mapper";
import type { MappedWorkOrder } from "./types";

export type SampleTransformResult = {
  source: "mongo" | "builtin";
  external: Record<string, unknown>;
  canonical: MappedWorkOrder;
};

function builtinSample(): Record<string, unknown> {
  const binding = loadBinding("xlink-fsm");
  const samples = binding.ingestion.sample_documents ?? [];
  if (samples.length > 0) return samples[0] as Record<string, unknown>;
  return {
    _id: "SA-SAMPLE",
    orderNum: "GD-SAMPLE",
    status: "206",
    state: 1,
    city: "110100",
    title: "样例工单",
    describe: "内置样例",
    name: "样例客户",
    phone: "138****0000",
    updateTime: new Date().toISOString(),
    exts: { supervisorId: "0" },
  };
}

export async function runSampleTransform(): Promise<SampleTransformResult> {
  const binding = loadBinding("xlink-fsm");
  const stored = await getRuntimeConfig();
  const config: RuntimeConfigJson = stored?.config ?? defaultRuntimeConfig();
  const secrets: RuntimeSecrets = (await getRuntimeSecrets()) ?? {
    fsm_mongo_url: "",
    hunyuan_api_key: "",
    llm_api_key: "",
    wecom_webhook: "",
    wecom_corp_id: "",
    wecom_agent_id: "",
    wecom_agent_secret: "",
  };

  const url = secrets.fsm_mongo_url?.trim();
  const dbName = config.fsm_mongo_db?.trim();
  const collName = binding.ingestion.collection;
  const statuses = (config.fsm_event_statuses || "206")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (url && dbName) {
    try {
      const { MongoClient } = await import("mongodb");
      const client = new MongoClient(url, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      try {
        await client.connect();
        const doc = await client
          .db(dbName)
          .collection(collName)
          .findOne(
            { status: { $in: statuses }, state: binding.ingestion.state_active },
            { projection: binding.ingestion.projection }
          );
        if (doc) {
          const external = doc as Record<string, unknown>;
          return {
            source: "mongo",
            external,
            canonical: mapRecord(external, binding),
          };
        }
      } finally {
        await client.close();
      }
    } catch {
      /* fall through to builtin */
    }
  }

  const external = builtinSample();
  return {
    source: "builtin",
    external,
    canonical: mapRecord(external, binding),
  };
}
