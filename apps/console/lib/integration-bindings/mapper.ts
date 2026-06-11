import type {
  BindingField,
  IntegrationBinding,
  MappedWorkOrder,
} from "./types";

const LOOKUP_FALLBACKS: Record<string, (v: string) => string> = {
  status_to_task_type: (v) => `状态${v}`,
  status_to_group: () => "following",
  city_code: (v) => (v ? v : "未知"),
  status_to_event_type: (v) => `STATUS_${v}`,
};

export function getPath(doc: Record<string, unknown>, dotPath: string): unknown {
  if (!dotPath) return undefined;
  let cur: unknown = doc;
  for (const part of dotPath.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function coalescePaths(
  doc: Record<string, unknown>,
  paths: string[]
): unknown {
  for (const p of paths) {
    const val = p.includes(".") ? getPath(doc, p) : doc[p];
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return "";
}

function lookupValue(
  table: string,
  raw: unknown,
  codeTables: Record<string, Record<string, string>>
): string {
  const key = raw == null ? "" : String(raw);
  const entries = codeTables[table] ?? {};
  if (key in entries) return entries[key]!;
  const fallback = LOOKUP_FALLBACKS[table];
  return fallback ? fallback(key) : key;
}

function applyField(
  doc: Record<string, unknown>,
  field: BindingField,
  binding: IntegrationBinding,
  wid: string
): [string, unknown] {
  const to = field.to;
  const op = field.op;

  if (op === "direct") {
    const from = field.from ?? "";
    const val = from.includes(".") ? getPath(doc, from) : doc[from];
    return [to, val ?? ""];
  }
  if (op === "coalesce") {
    const val = coalescePaths(doc, field.paths ?? []);
    return [to, val == null ? "" : String(val)];
  }
  if (op === "lookup") {
    const from = field.from ?? "";
    const raw = from.includes(".") ? getPath(doc, from) : doc[from];
    return [to, lookupValue(field.table ?? "", raw, binding.code_tables)];
  }
  if (op === "const") {
    return [to, field.value];
  }
  if (op === "source_ref") {
    return [
      to,
      {
        system: binding.ingestion.system_name,
        collection: binding.ingestion.collection,
        id: wid,
      },
    ];
  }
  throw new Error(`unsupported op: ${op}`);
}

export function mapRecord(
  doc: Record<string, unknown>,
  binding: IntegrationBinding,
  objectId = "work-order"
): MappedWorkOrder {
  const obj = binding.objects.find((o) => o.id === objectId);
  if (!obj) throw new Error(`object not found: ${objectId}`);

  const idPaths = obj.identity?.external_paths ?? ["_id", "id"];
  const wid = String(coalescePaths(doc, idPaths) ?? "");

  const values: Record<string, unknown> = {};
  for (const field of obj.fields) {
    const [k, v] = applyField(doc, field, binding, wid);
    values[k] = v;
  }

  return {
    work_order_id: String(values.work_order_id ?? wid),
    order_num: String(values.order_num ?? ""),
    title: String(values.title ?? ""),
    task_type: String(values.task_type ?? ""),
    group: String(values.group ?? "following"),
    city: String(values.city ?? ""),
    customer_name: String(values.customer_name ?? ""),
    phone: String(values.phone ?? ""),
    assignee: String(values.assignee ?? ""),
    summary: String(values.summary ?? ""),
    completed_at: String(values.completed_at ?? ""),
    event_type: String(values.event_type ?? ""),
    housekeeper_id: String(values.housekeeper_id ?? ""),
    source_ref: (values.source_ref as Record<string, string>) ?? {},
  };
}
