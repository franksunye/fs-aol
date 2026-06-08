import { db, ensureSchema, TABLE_LOGS, TABLE_TRACES, TABLE_OUTCOMES, TABLE_BLOCKERS } from "./db";
import type { BlockerType } from "./blockers";
import type { InboxBucket } from "./labels";
import { logsHasInboxColumns } from "./logs-schema";
import { migrateInboxColumns } from "./migrate-inbox-columns";

export type Decision = "approved" | "rejected" | "modified" | "followed_up";

/** Action Spec v0.2 — 键名对齐 contracts/suggestion.schema.json */
export interface SuggestionDoc {
  规格版本?: string;
  需要跟进?: boolean;
  优先级?: string;
  客户情绪?: string;
  原因摘要?: string;
  优先级依据?: string[];
  情况判断?: {
    商机阶段?: string;
    报价状态?: string;
    金额与方案?: string;
    渠道与部位?: string;
  };
  跟进方案?: {
    主行动?: string;
    沟通要点?: string[];
    避免事项?: string[];
  };
  引用查证?: string[];
}

export interface OutcomeRow {
  id: number;
  dedupeKey: string;
  workOrderId: string;
  decision: Decision;
  note: string;
  operator: string;
  modifiedSuggestion: SuggestionDoc | null;
  createdAt: string;
}

export interface BlockerRow {
  id: number;
  dedupeKey: string;
  workOrderId: string;
  blockerType: BlockerType;
  note: string;
  source: string;
  operator: string;
  createdAt: string;
}

export interface SuggestionRow {
  dedupeKey: string;
  workOrderId: string;
  eventType: string;
  orderNum: string;
  city: string;
  housekeeperId: string;
  status: string;
  processedAt: string;
  /** 工单进入当前状态时 updateTime（北京本地），展示时现算滞留天数 */
  stateAt: string | null;
  suggestion: SuggestionDoc;
  outcome: OutcomeRow | null;
  blocker: BlockerRow | null;
  inboxBucket: InboxBucket;
  archiveReason: string;
  reconciledAt: string | null;
  mongoStatus: string;
  liveVerdict: string;
  /** 上次 Agent 分析时的滞留天数快照 */
  analyzedStaleDays: number | null;
}

export interface TraceStep {
  step?: number;
  kind?: string;
  name?: string;
  latency_ms?: number;
  status?: string;
  output?: Record<string, unknown>;
}

export interface TraceRow {
  id: number;
  workOrderId: string;
  mode: string;
  model: string;
  status: string;
  error: string;
  latencyMs: number;
  totalTokens: number;
  promptSystem: string;
  promptUser: string;
  rawResponse: string;
  parsed: SuggestionDoc | null;
  steps: TraceStep[];
  enrich: Record<string, unknown> | null;
  createdAt: string;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function str(value: unknown): string {
  return value == null ? "" : String(value);
}

function mapOutcome(row: Record<string, unknown>): OutcomeRow {
  return {
    id: Number(row.id),
    dedupeKey: str(row.dedupe_key),
    workOrderId: str(row.work_order_id),
    decision: str(row.decision) as Decision,
    note: str(row.note),
    operator: str(row.operator),
    modifiedSuggestion: parseJson<SuggestionDoc | null>(row.modified_suggestion, null),
    createdAt: str(row.created_at),
  };
}

function mapBlocker(row: Record<string, unknown>): BlockerRow {
  return {
    id: Number(row.id),
    dedupeKey: str(row.dedupe_key),
    workOrderId: str(row.work_order_id),
    blockerType: str(row.blocker_type) as BlockerType,
    note: str(row.note),
    source: str(row.source),
    operator: str(row.operator),
    createdAt: str(row.created_at),
  };
}

async function latestOutcomesForKeys(
  dedupeKeys: string[]
): Promise<Map<string, OutcomeRow>> {
  const map = new Map<string, OutcomeRow>();
  if (dedupeKeys.length === 0) return map;
  const ph = dedupeKeys.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT o.* FROM ${TABLE_OUTCOMES} o
          INNER JOIN (
            SELECT dedupe_key, MAX(id) AS mid FROM ${TABLE_OUTCOMES}
            WHERE dedupe_key IN (${ph}) GROUP BY dedupe_key
          ) m ON o.id = m.mid`,
    args: dedupeKeys,
  });
  for (const row of res.rows as unknown as Record<string, unknown>[]) {
    const o = mapOutcome(row);
    map.set(o.dedupeKey, o);
  }
  return map;
}

async function latestBlockersForKeys(
  dedupeKeys: string[]
): Promise<Map<string, BlockerRow>> {
  const map = new Map<string, BlockerRow>();
  if (dedupeKeys.length === 0) return map;
  const ph = dedupeKeys.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT b.* FROM ${TABLE_BLOCKERS} b
          INNER JOIN (
            SELECT dedupe_key, MAX(id) AS mid FROM ${TABLE_BLOCKERS}
            WHERE dedupe_key IN (${ph}) GROUP BY dedupe_key
          ) m ON b.id = m.mid`,
    args: dedupeKeys,
  });
  for (const row of res.rows as unknown as Record<string, unknown>[]) {
    const b = mapBlocker(row);
    map.set(b.dedupeKey, b);
  }
  return map;
}

function resolveInboxBucket(raw: unknown): InboxBucket {
  const v = str(raw).trim();
  if (v === "closed" || v === "archived") return v;
  return "active";
}

function mapSuggestion(
  row: Record<string, unknown>,
  outcomes: Map<string, OutcomeRow>,
  blockers: Map<string, BlockerRow>
): SuggestionRow {
  const dedupeKey = str(row.dedupe_key);
  return {
    dedupeKey,
    workOrderId: str(row.work_order_id),
    eventType: str(row.event_type),
    orderNum: str(row.order_num),
    city: str(row.city),
    housekeeperId: str(row.housekeeper_id),
    status: str(row.status),
    processedAt: str(row.processed_at),
    stateAt: str(row.state_at).trim() || null,
    suggestion: parseJson<SuggestionDoc>(row.suggestion, {}),
    outcome: outcomes.get(dedupeKey) ?? null,
    blocker: blockers.get(dedupeKey) ?? null,
    inboxBucket: resolveInboxBucket(row.inbox_bucket),
    archiveReason: str(row.archive_reason),
    reconciledAt: str(row.reconciled_at).trim() || null,
    mongoStatus: str(row.mongo_status),
    liveVerdict: str(row.live_verdict),
    analyzedStaleDays:
      row.analyzed_stale_days != null && String(row.analyzed_stale_days).trim() !== ""
        ? Number(row.analyzed_stale_days)
        : null,
  };
}

async function ensureInboxColumnsReady(): Promise<boolean> {
  await ensureSchema();
  if (await logsHasInboxColumns()) return true;
  await migrateInboxColumns();
  return logsHasInboxColumns();
}

export type InboxBucketCounts = Record<InboxBucket, number>;

export async function countInboxBuckets(options?: {
  housekeeperId?: string;
}): Promise<InboxBucketCounts> {
  const hasInbox = await ensureInboxColumnsReady();
  const hk = options?.housekeeperId?.trim();
  const empty: InboxBucketCounts = { active: 0, closed: 0, archived: 0 };
  if (!hasInbox) {
    const sql = hk
      ? `SELECT COUNT(*) AS c FROM ${TABLE_LOGS} WHERE housekeeper_id = ?`
      : `SELECT COUNT(*) AS c FROM ${TABLE_LOGS}`;
    const res = await db.execute({ sql, args: hk ? [hk] : [] });
    const c = Number((res.rows as { c?: number }[])[0]?.c ?? 0);
    return { active: c, closed: 0, archived: 0 };
  }
  const clauses: string[] = [];
  const args: string[] = [];
  if (hk) {
    clauses.push("housekeeper_id = ?");
    args.push(hk);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const res = await db.execute({
    sql: `SELECT
            SUM(CASE WHEN inbox_bucket IS NULL OR inbox_bucket = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN inbox_bucket = 'closed' THEN 1 ELSE 0 END) AS closed,
            SUM(CASE WHEN inbox_bucket = 'archived' THEN 1 ELSE 0 END) AS archived
          FROM ${TABLE_LOGS} ${where}`,
    args,
  });
  const row = (res.rows as { active?: number; closed?: number; archived?: number }[])[0];
  return {
    active: Number(row?.active ?? 0),
    closed: Number(row?.closed ?? 0),
    archived: Number(row?.archived ?? 0),
  };
}

export async function listSuggestions(options?: {
  housekeeperId?: string;
  /** 默认 active（待处置）；归档/已处置用 closed | archived */
  inboxBucket?: InboxBucket;
  /** 默认 100；移动收件箱传 30 */
  limit?: number;
}): Promise<SuggestionRow[]> {
  const hasInbox = await ensureInboxColumnsReady();
  const hk = options?.housekeeperId?.trim();
  const bucket = options?.inboxBucket ?? "active";
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (hasInbox) {
    if (bucket === "active") {
      where.push("(inbox_bucket IS NULL OR inbox_bucket = 'active')");
    } else {
      where.push("inbox_bucket = ?");
      args.push(bucket);
    }
  }
  if (hk) {
    where.push("housekeeper_id = ?");
    args.push(hk);
  }
  args.push(limit);
  const sql =
    where.length > 0
      ? `SELECT * FROM ${TABLE_LOGS} WHERE ${where.join(
          " AND "
        )} ORDER BY processed_at DESC LIMIT ?`
      : `SELECT * FROM ${TABLE_LOGS} ORDER BY processed_at DESC LIMIT ?`;
  const res = await db.execute({ sql, args });
  const logRows = res.rows as unknown as Record<string, unknown>[];
  const keys = logRows.map((r) => str(r.dedupe_key)).filter(Boolean);
  const [outcomes, blockers] = await Promise.all([
    latestOutcomesForKeys(keys),
    latestBlockersForKeys(keys),
  ]);
  return logRows.map((r) => mapSuggestion(r, outcomes, blockers));
}

/** 单条建议：一次 Turso 往返（避免全表扫 outcomes/blockers 或 3 次 RTT） */
export async function getSuggestion(
  dedupeKey: string
): Promise<SuggestionRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT
            l.*,
            o.id AS o_id, o.dedupe_key AS o_dedupe_key, o.work_order_id AS o_work_order_id,
            o.decision AS o_decision, o.note AS o_note, o.operator AS o_operator,
            o.modified_suggestion AS o_modified_suggestion, o.created_at AS o_created_at,
            b.id AS b_id, b.dedupe_key AS b_dedupe_key, b.work_order_id AS b_work_order_id,
            b.blocker_type AS b_blocker_type, b.note AS b_note, b.source AS b_source,
            b.operator AS b_operator, b.created_at AS b_created_at
          FROM ${TABLE_LOGS} l
          LEFT JOIN ${TABLE_OUTCOMES} o ON o.id = (
            SELECT MAX(o2.id) FROM ${TABLE_OUTCOMES} o2 WHERE o2.dedupe_key = l.dedupe_key
          )
          LEFT JOIN ${TABLE_BLOCKERS} b ON b.id = (
            SELECT MAX(b2.id) FROM ${TABLE_BLOCKERS} b2 WHERE b2.dedupe_key = l.dedupe_key
          )
          WHERE l.dedupe_key = ? LIMIT 1`,
    args: [dedupeKey],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  if (!row) return null;
  const outcomes = new Map<string, OutcomeRow>();
  const blockers = new Map<string, BlockerRow>();
  if (row.o_id != null) {
    const o = mapOutcome({
      id: row.o_id,
      dedupe_key: row.o_dedupe_key,
      work_order_id: row.o_work_order_id,
      decision: row.o_decision,
      note: row.o_note,
      operator: row.o_operator,
      modified_suggestion: row.o_modified_suggestion,
      created_at: row.o_created_at,
    });
    outcomes.set(o.dedupeKey, o);
  }
  if (row.b_id != null) {
    const b = mapBlocker({
      id: row.b_id,
      dedupe_key: row.b_dedupe_key,
      work_order_id: row.b_work_order_id,
      blocker_type: row.b_blocker_type,
      note: row.b_note,
      source: row.b_source,
      operator: row.b_operator,
      created_at: row.b_created_at,
    });
    blockers.set(b.dedupeKey, b);
  }
  const logRow: Record<string, unknown> = { ...row };
  for (const k of Object.keys(logRow)) {
    if (k.startsWith("o_") || k.startsWith("b_")) delete logRow[k];
  }
  return mapSuggestion(logRow, outcomes, blockers);
}

export async function getLatestBlocker(
  dedupeKey: string
): Promise<BlockerRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_BLOCKERS} WHERE dedupe_key = ? ORDER BY id DESC LIMIT 1`,
    args: [dedupeKey],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return row ? mapBlocker(row) : null;
}

export async function recordBlocker(input: {
  dedupeKey: string;
  workOrderId: string;
  blockerType: BlockerType;
  note?: string;
  operator?: string;
  source?: string;
}): Promise<void> {
  await ensureSchema();
  await db.execute({
    sql: `INSERT INTO ${TABLE_BLOCKERS}
      (dedupe_key, work_order_id, blocker_type, note, source, operator, created_at)
      VALUES (?,?,?,?,?,?,?)`,
    args: [
      input.dedupeKey,
      input.workOrderId,
      input.blockerType,
      input.note ?? "",
      input.source ?? "housekeeper_selected",
      input.operator ?? "console",
      new Date().toISOString(),
    ],
  });
}

function mapTraceRow(
  row: Record<string, unknown>,
  opts: { includePrompts: boolean }
): TraceRow {
  const steps = parseJson<TraceStep[]>(row.steps_json, []);
  const enrichStep = steps.find((s) => s.name === "enrich_work_order_context");
  return {
    id: Number(row.id ?? 0),
    workOrderId: str(row.work_order_id),
    mode: str(row.mode),
    model: str(row.model),
    status: str(row.status),
    error: str(row.error),
    latencyMs: Number(row.latency_ms ?? 0),
    totalTokens: Number(row.total_tokens ?? 0),
    promptSystem: opts.includePrompts ? str(row.prompt_system) : "",
    promptUser: opts.includePrompts ? str(row.prompt_user) : "",
    rawResponse: opts.includePrompts ? str(row.raw_response) : "",
    parsed: parseJson<SuggestionDoc | null>(row.parsed, null),
    steps,
    enrich: (enrichStep?.output as Record<string, unknown>) ?? null,
    createdAt: str(row.created_at),
  };
}

/** 懒加载用：不拉 prompt / raw_response，减小 payload */
export async function getTraceLite(
  workOrderId: string
): Promise<TraceRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT work_order_id, mode, model, status, error, latency_ms, total_tokens,
                 steps_json, parsed, created_at
          FROM ${TABLE_TRACES} WHERE work_order_id = ? ORDER BY id DESC LIMIT 1`,
    args: [workOrderId],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return row ? mapTraceRow(row, { includePrompts: false }) : null;
}

export async function getTrace(workOrderId: string): Promise<TraceRow | null> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_TRACES} WHERE work_order_id = ? ORDER BY id DESC LIMIT 1`,
    args: [workOrderId],
  });
  const row = (res.rows as unknown as Record<string, unknown>[])[0];
  return row ? mapTraceRow(row, { includePrompts: true }) : null;
}

/** 按时间正序返回全部推理 trace（多次再分析） */
export async function listTraces(
  workOrderId: string,
  opts?: { includePrompts?: boolean }
): Promise<TraceRow[]> {
  await ensureSchema();
  const includePrompts = opts?.includePrompts ?? true;
  const res = await db.execute({
    sql: `SELECT * FROM ${TABLE_TRACES} WHERE work_order_id = ? ORDER BY id ASC`,
    args: [workOrderId],
  });
  const rows = res.rows as unknown as Record<string, unknown>[];
  return rows.map((row) => mapTraceRow(row, { includePrompts }));
}

export async function listTracesLite(workOrderId: string): Promise<TraceRow[]> {
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT id, work_order_id, mode, model, status, error, latency_ms, total_tokens,
                 steps_json, parsed, created_at
          FROM ${TABLE_TRACES} WHERE work_order_id = ? ORDER BY id ASC`,
    args: [workOrderId],
  });
  const rows = res.rows as unknown as Record<string, unknown>[];
  return rows.map((row) => mapTraceRow(row, { includePrompts: false }));
}

export async function recordOutcome(input: {
  dedupeKey: string;
  workOrderId: string;
  decision: Decision;
  note?: string;
  operator?: string;
  modifiedSuggestion?: SuggestionDoc | null;
}): Promise<void> {
  await ensureInboxColumnsReady();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO ${TABLE_OUTCOMES}
      (dedupe_key, work_order_id, decision, note, operator, modified_suggestion, created_at)
      VALUES (?,?,?,?,?,?,?)`,
    args: [
      input.dedupeKey,
      input.workOrderId,
      input.decision,
      input.note ?? "",
      input.operator ?? "console",
      input.modifiedSuggestion
        ? JSON.stringify(input.modifiedSuggestion)
        : null,
      now,
    ],
  });
  await db.execute({
    sql: `UPDATE ${TABLE_LOGS}
      SET inbox_bucket = 'closed', archive_reason = 'has_outcome', reconciled_at = ?
      WHERE dedupe_key = ?`,
    args: [now, input.dedupeKey],
  });
}

export interface DashboardStats {
  total: number;
  needFollow: number;
  pending: number;
  approved: number;
  rejected: number;
  modified: number;
  followedUp: number;
  handledRate: number;
  adoptionRate: number;
  exposureCount: number;
  blockerCaptureRate: number;
  unknownBlockerRate: number;
  byPriority: Record<string, number>;
}

const ADOPTED: Decision[] = ["approved", "modified", "followed_up"];

export function computeStats(rows: SuggestionRow[]): DashboardStats {
  const needFollowRows = rows.filter((r) => r.suggestion.需要跟进 !== false);
  let approved = 0;
  let rejected = 0;
  let modified = 0;
  let followedUp = 0;
  let adopted = 0;
  let capturedBlockers = 0;
  let exposureCount = 0;
  const byPriority: Record<string, number> = {};
  for (const r of needFollowRows) {
    const p = r.suggestion.优先级 || "未定";
    byPriority[p] = (byPriority[p] ?? 0) + 1;
    if (r.status === "sent") exposureCount += 1;
    const d = r.outcome?.decision;
    if (d === "approved") approved += 1;
    else if (d === "rejected") rejected += 1;
    else if (d === "modified") modified += 1;
    else if (d === "followed_up") followedUp += 1;
    if (d && ADOPTED.includes(d)) adopted += 1;
    const bt = r.blocker?.blockerType;
    if (bt && bt !== "UNKNOWN") capturedBlockers += 1;
  }
  const handled = approved + rejected + modified + followedUp;
  const total = needFollowRows.length;
  const blockerCaptureRate = total
    ? Math.round((capturedBlockers / total) * 100)
    : 0;
  return {
    total: rows.length,
    needFollow: total,
    pending: total - handled,
    approved,
    rejected,
    modified,
    followedUp,
    handledRate: total ? Math.round((handled / total) * 100) : 0,
    adoptionRate: total ? Math.round((adopted / total) * 100) : 0,
    exposureCount: exposureCount || total,
    blockerCaptureRate,
    unknownBlockerRate: total ? 100 - blockerCaptureRate : 0,
    byPriority,
  };
}
