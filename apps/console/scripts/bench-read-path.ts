#!/usr/bin/env npx tsx
/**
 * Console 读路径性能基线（Turso/SQLite，与 apps/console/lib 同库）。
 *
 * 用法（仓库根）：
 *   pnpm --filter console exec tsx scripts/bench-read-path.ts
 *   pnpm --filter console exec tsx scripts/bench-read-path.ts --save=baseline
 *   pnpm --filter console exec tsx scripts/bench-read-path.ts --save=optimized --compare=baseline
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type Client } from "@libsql/client";
import {
  trackingBootstrapStatements,
  tableNames,
  tablePrefix,
} from "../lib/contracts";

const __dir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dir, "../../..");
const RESULTS_DIR = join(REPO_ROOT, "scripts/bench-results");

type Timed = { ms: number; bytes: number; rows?: number };

function loadEnv() {
  for (const p of [join(REPO_ROOT, ".env"), join(__dir, "../.env.local")]) {
    try {
      const text = readFileSync(p, "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (m && process.env[m[1]] === undefined) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* ignore */
    }
  }
}

function makeDb(): Client {
  const url = process.env.LIBSQL_URL ?? `file:${join(REPO_ROOT, "data/agent_loop_tracking.db")}`;
  const authToken = process.env.LIBSQL_AUTH_TOKEN;
  return createClient(authToken ? { url, authToken } : { url });
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const t0 = performance.now();
  const result = await fn();
  return { result, ms: performance.now() - t0 };
}

function rowBytes(rows: unknown[]): number {
  return Buffer.byteLength(JSON.stringify(rows), "utf8");
}

/** v0.3 优化前：单条详情仍扫全表 outcomes/blockers */
async function legacyDetailPath(
  db: Client,
  tables: ReturnType<typeof tableNames>,
  dedupeKey: string
): Promise<{ detail: Timed; trace: Timed }> {
  const detailTimed = await timed(async () => {
    const [logRes, outcomesRes, blockersRes] = await Promise.all([
      db.execute({
        sql: `SELECT * FROM ${tables.logs} WHERE dedupe_key = ? LIMIT 1`,
        args: [dedupeKey],
      }),
      db.execute(
        `SELECT o.* FROM ${tables.outcomes} o
         JOIN (SELECT dedupe_key, MAX(id) AS mid FROM ${tables.outcomes} GROUP BY dedupe_key) m
           ON o.id = m.mid`
      ),
      db.execute(
        `SELECT b.* FROM ${tables.blockers} b
         JOIN (SELECT dedupe_key, MAX(id) AS mid FROM ${tables.blockers} GROUP BY dedupe_key) m
           ON b.id = m.mid`
      ),
    ]);
    const bytes =
      rowBytes(logRes.rows as unknown[]) +
      rowBytes(outcomesRes.rows as unknown[]) +
      rowBytes(blockersRes.rows as unknown[]);
    return { bytes, rows: (outcomesRes.rows?.length ?? 0) + (blockersRes.rows?.length ?? 0) };
  });

  const traceTimed = await timed(async () => {
    const res = await db.execute({
      sql: `SELECT * FROM ${tables.traces} WHERE work_order_id = (
        SELECT work_order_id FROM ${tables.logs} WHERE dedupe_key = ? LIMIT 1
      ) ORDER BY id DESC LIMIT 1`,
      args: [dedupeKey],
    });
    return res.rows as unknown[];
  });

  return {
    detail: {
      ms: detailTimed.ms,
      bytes: detailTimed.result.bytes,
      rows: detailTimed.result.rows,
    },
    trace: { ms: traceTimed.ms, bytes: rowBytes(traceTimed.result) },
  };
}

/** 优化后：单条 JOIN 一次 RTT（与 lib/suggestions getSuggestion 一致） */
async function optimizedDetailPath(
  db: Client,
  tables: ReturnType<typeof tableNames>,
  dedupeKey: string
): Promise<{ detail: Timed; traceLite: Timed }> {
  const detailTimed = await timed(async () => {
    const res = await db.execute({
      sql: `SELECT l.*,
              o.id AS o_id, b.id AS b_id
            FROM ${tables.logs} l
            LEFT JOIN ${tables.outcomes} o ON o.id = (
              SELECT MAX(o2.id) FROM ${tables.outcomes} o2 WHERE o2.dedupe_key = l.dedupe_key
            )
            LEFT JOIN ${tables.blockers} b ON b.id = (
              SELECT MAX(b2.id) FROM ${tables.blockers} b2 WHERE b2.dedupe_key = l.dedupe_key
            )
            WHERE l.dedupe_key = ? LIMIT 1`,
      args: [dedupeKey],
    });
    return { bytes: rowBytes(res.rows as unknown[]) };
  });

  const traceTimed = await timed(async () => {
    const res = await db.execute({
      sql: `SELECT work_order_id, mode, model, status, error, latency_ms, total_tokens, steps_json, created_at
            FROM ${tables.traces} WHERE work_order_id = (
              SELECT work_order_id FROM ${tables.logs} WHERE dedupe_key = ? LIMIT 1
            ) ORDER BY id DESC LIMIT 1`,
      args: [dedupeKey],
    });
    return res.rows as unknown[];
  });

  return {
    detail: { ms: detailTimed.ms, bytes: detailTimed.result.bytes },
    traceLite: { ms: traceTimed.ms, bytes: rowBytes(traceTimed.result) },
  };
}

async function legacyListPath(
  db: Client,
  tables: ReturnType<typeof tableNames>,
  housekeeperId?: string
): Promise<Timed> {
  const { result, ms } = await timed(async () => {
    const sql = housekeeperId
      ? `SELECT * FROM ${tables.logs} WHERE housekeeper_id = ? ORDER BY processed_at DESC LIMIT 500`
      : `SELECT * FROM ${tables.logs} ORDER BY processed_at DESC LIMIT 500`;
    const args = housekeeperId ? [housekeeperId] : [];
    const [logRes, outcomesRes, blockersRes] = await Promise.all([
      db.execute({ sql, args }),
      db.execute(
        `SELECT o.* FROM ${tables.outcomes} o
         JOIN (SELECT dedupe_key, MAX(id) AS mid FROM ${tables.outcomes} GROUP BY dedupe_key) m
           ON o.id = m.mid`
      ),
      db.execute(
        `SELECT b.* FROM ${tables.blockers} b
         JOIN (SELECT dedupe_key, MAX(id) AS mid FROM ${tables.blockers} GROUP BY dedupe_key) m
           ON b.id = m.mid`
      ),
    ]);
    return {
      bytes:
        rowBytes(logRes.rows as unknown[]) +
        rowBytes(outcomesRes.rows as unknown[]) +
        rowBytes(blockersRes.rows as unknown[]),
      rows: logRes.rows?.length ?? 0,
    };
  });
  return { ms, bytes: result.bytes, rows: result.rows };
}

async function optimizedListPath(
  db: Client,
  tables: ReturnType<typeof tableNames>,
  housekeeperId?: string,
  limit = 30
): Promise<Timed> {
  const { result, ms } = await timed(async () => {
    const sql = housekeeperId
      ? `SELECT * FROM ${tables.logs} WHERE housekeeper_id = ? ORDER BY processed_at DESC LIMIT ?`
      : `SELECT * FROM ${tables.logs} ORDER BY processed_at DESC LIMIT ?`;
    const args = housekeeperId ? [housekeeperId, limit] : [limit];
    const logRes = await db.execute({ sql, args });
    const keys = (logRes.rows as { dedupe_key?: string }[])
      .map((r) => r.dedupe_key)
      .filter(Boolean) as string[];
    if (keys.length === 0) {
      return { bytes: rowBytes(logRes.rows as unknown[]), rows: 0 };
    }
    const ph = keys.map(() => "?").join(",");
    const [outcomesRes, blockersRes] = await Promise.all([
      db.execute({
        sql: `SELECT o.* FROM ${tables.outcomes} o
              INNER JOIN (
                SELECT dedupe_key, MAX(id) AS mid FROM ${tables.outcomes}
                WHERE dedupe_key IN (${ph}) GROUP BY dedupe_key
              ) m ON o.id = m.mid`,
        args: keys,
      }),
      db.execute({
        sql: `SELECT b.* FROM ${tables.blockers} b
              INNER JOIN (
                SELECT dedupe_key, MAX(id) AS mid FROM ${tables.blockers}
                WHERE dedupe_key IN (${ph}) GROUP BY dedupe_key
              ) m ON b.id = m.mid`,
        args: keys,
      }),
    ]);
    return {
      bytes:
        rowBytes(logRes.rows as unknown[]) +
        rowBytes(outcomesRes.rows as unknown[]) +
        rowBytes(blockersRes.rows as unknown[]),
      rows: logRes.rows?.length ?? 0,
    };
  });
  return { ms, bytes: result.bytes, rows: result.rows };
}

async function pickSampleKey(db: Client, logsTable: string): Promise<string | null> {
  const res = await db.execute(
    `SELECT dedupe_key FROM ${logsTable} ORDER BY processed_at DESC LIMIT 1`
  );
  const row = res.rows[0] as { dedupe_key?: string } | undefined;
  return row?.dedupe_key ?? null;
}

function pct(before: number, after: number): string {
  if (before <= 0) return "—";
  const delta = ((before - after) / before) * 100;
  return `${delta >= 0 ? "-" : "+"}${Math.abs(delta).toFixed(1)}%`;
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const save = args.find((a) => a.startsWith("--save="))?.split("=")[1];
  const compare = args.find((a) => a.startsWith("--compare="))?.split("=")[1];
  const iterations = Number(args.find((a) => a.startsWith("--iterations="))?.split("=")[1] || 5);

  const prefix = tablePrefix();
  const tables = tableNames(prefix);
  const db = makeDb();
  for (const stmt of trackingBootstrapStatements(prefix)) {
    await db.execute(stmt);
  }

  const sampleKey = await pickSampleKey(db, tables.logs);
  if (!sampleKey) {
    console.error("No rows in follow_up_logs — seed data first (make seed-local).");
    process.exit(1);
  }

  const hk =
    process.env.FSM_PILOT_HOUSEKEEPER_IDS?.split(",")[0]?.trim() ||
    (
      await db.execute(
        `SELECT housekeeper_id FROM ${tables.logs} WHERE housekeeper_id != '' LIMIT 1`
      )
    ).rows[0] as { housekeeper_id?: string } | undefined;

  const hkId = hk && typeof hk === "object" && "housekeeper_id" in hk ? hk.housekeeper_id : String(hk ?? "");

  const report: Record<string, unknown> = {
    at: new Date().toISOString(),
    libsql: process.env.LIBSQL_URL?.replace(/\/\/.*@/, "//***@") ?? "file:local",
    sampleDedupeKey: sampleKey,
    housekeeperId: hkId || null,
    iterations,
    paths: {} as Record<string, unknown>,
  };

  const avg = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;

  for (const label of ["legacy", "optimized"] as const) {
    const detailMs: number[] = [];
    const traceMs: number[] = [];
    const detailBytes: number[] = [];
    const traceBytes: number[] = [];
    const listMs: number[] = [];
    const listBytes: number[] = [];
    const mobileMs: number[] = [];

    for (let i = 0; i < iterations; i++) {
      if (label === "legacy") {
        const d = await legacyDetailPath(db, tables, sampleKey);
        detailMs.push(d.detail.ms);
        traceMs.push(d.trace.ms);
        detailBytes.push(d.detail.bytes);
        traceBytes.push(d.trace.bytes);
        mobileMs.push(d.detail.ms + d.trace.ms);
        const l = await legacyListPath(db, tables, hkId || undefined);
        listMs.push(l.ms);
        listBytes.push(l.bytes);
      } else {
        const d = await optimizedDetailPath(db, tables, sampleKey);
        detailMs.push(d.detail.ms);
        traceMs.push(d.traceLite.ms);
        detailBytes.push(d.detail.bytes);
        traceBytes.push(d.traceLite.bytes);
        mobileMs.push(d.detail.ms);
        const l = await optimizedListPath(db, tables, hkId || undefined, 30);
        listMs.push(l.ms);
        listBytes.push(l.bytes);
      }
    }

    (report.paths as Record<string, unknown>)[label] = {
      detailFirstPaint: {
        msAvg: Math.round(avg(detailMs)),
        bytesAvg: Math.round(avg(detailBytes)),
        note: "getSuggestion 等价 DB（不含 trace）",
      },
      trace: {
        msAvg: Math.round(avg(traceMs)),
        bytesAvg: Math.round(avg(traceBytes)),
        note:
          label === "legacy"
            ? "getTrace SELECT *（首屏阻塞）"
            : "getTraceLite 列投影（可懒加载）",
      },
      mobileFirstPaint: {
        msAvg: Math.round(avg(mobileMs)),
        bytesAvg: Math.round(avg(detailBytes)),
        note:
          label === "legacy"
            ? "旧路径：getSuggestion 全表扫 + getTrace 首屏（串行）"
            : "/m/s/[key]：getSuggestion 单查询 RTT，trace 懒加载",
      },
      listInbox: {
        msAvg: Math.round(avg(listMs)),
        bytesAvg: Math.round(avg(listBytes)),
        note:
          label === "legacy"
            ? "LIMIT 500 + 全表 outcomes/blockers"
            : "LIMIT 30 + IN dedupe_keys",
      },
    };
  }

  const leg = (report.paths as Record<string, Record<string, { msAvg: number; bytesAvg: number }>>).legacy;
  const opt = (report.paths as Record<string, Record<string, { msAvg: number; bytesAvg: number }>>).optimized;

  (report as Record<string, unknown>).comparison = {
    detailFirstPaintMs: pct(leg.detailFirstPaint.msAvg, opt.detailFirstPaint.msAvg),
    detailFirstPaintBytes: pct(leg.detailFirstPaint.bytesAvg, opt.detailFirstPaint.bytesAvg),
    traceBytes: pct(leg.trace.bytesAvg, opt.trace.bytesAvg),
    mobileFirstPaintMs: pct(leg.mobileFirstPaint.msAvg, opt.mobileFirstPaint.msAvg),
    listInboxMs: pct(leg.listInbox.msAvg, opt.listInbox.msAvg),
    listInboxBytes: pct(leg.listInbox.bytesAvg, opt.listInbox.bytesAvg),
  };

  console.log(JSON.stringify(report, null, 2));

  if (save) {
    mkdirSync(RESULTS_DIR, { recursive: true });
    const out = join(RESULTS_DIR, `${save}.json`);
    writeFileSync(out, JSON.stringify(report, null, 2));
    console.error(`\nWrote ${out}`);
  }

  if (compare) {
    const path = join(RESULTS_DIR, `${compare}.json`);
    if (!existsSync(path)) {
      console.error(`Missing ${path} — run with --save=${compare} first on baseline commit.`);
    } else {
      const prev = JSON.parse(readFileSync(path, "utf8")) as typeof report;
      console.error("\n--- compare to", compare, "---");
      console.error(JSON.stringify({ previous: prev.comparison, current: report.comparison }, null, 2));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
