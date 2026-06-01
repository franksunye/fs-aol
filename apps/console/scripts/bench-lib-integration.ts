#!/usr/bin/env npx tsx
/**
 * 对真实 lib/suggestions 实现跑基线（与生产代码一致）。
 * LIBSQL_URL=file:... 或 Turso。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dir, "../../..");
const RESULTS_DIR = join(REPO_ROOT, "scripts/bench-results");

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

async function timed<T>(fn: () => Promise<T>) {
  const t0 = performance.now();
  const result = await fn();
  return { result, ms: performance.now() - t0 };
}

async function main() {
  loadEnv();
  const save = process.argv.find((a) => a.startsWith("--save="))?.split("=")[1] ?? "lib-integration";
  const iterations = Number(
    process.argv.find((a) => a.startsWith("--iterations="))?.split("=")[1] || 8
  );

  const { listSuggestions, getSuggestion, getTrace, getTraceLite } = await import(
    "../lib/suggestions"
  );

  const rows = await listSuggestions({ limit: 1 });
  const key = rows[0]?.dedupeKey;
  if (!key) {
    console.error("No suggestions in DB");
    process.exit(1);
  }
  const workOrderId = rows[0].workOrderId;

  const mobileMs: number[] = [];
  const legacySsrMs: number[] = [];
  const traceLiteMs: number[] = [];
  const traceFullBytes: number[] = [];
  const traceLiteBytes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const m = await timed(() => getSuggestion(key));
    mobileMs.push(m.ms);

    const leg = await timed(async () => {
      const row = await getSuggestion(key);
      const trace = row ? await getTrace(row.workOrderId) : null;
      return { row, trace };
    });
    legacySsrMs.push(leg.ms);

    const tl = await timed(() => getTraceLite(workOrderId));
    traceLiteMs.push(tl.ms);
    traceLiteBytes.push(
      Buffer.byteLength(JSON.stringify(tl.result ?? {}), "utf8")
    );

    const tf = await timed(() => getTrace(workOrderId));
    traceFullBytes.push(
      Buffer.byteLength(JSON.stringify(tf.result ?? {}), "utf8")
    );
  }

  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

  const report = {
    at: new Date().toISOString(),
    libsql: process.env.LIBSQL_URL?.replace(/\/\/.*@/, "//***@"),
    sampleDedupeKey: key,
    iterations,
    msAvg: {
      mobileGetSuggestion: Math.round(avg(mobileMs)),
      legacyDetailPlusTrace: Math.round(avg(legacySsrMs)),
      traceLiteLazy: Math.round(avg(traceLiteMs)),
    },
    bytesAvg: {
      traceFull: Math.round(avg(traceFullBytes)),
      traceLite: Math.round(avg(traceLiteBytes)),
    },
    improvement: {
      mobileVsLegacySsr: `${(
        ((avg(legacySsrMs) - avg(mobileMs)) / avg(legacySsrMs)) *
        100
      ).toFixed(1)}%`,
      tracePayloadReduction: `${(
        ((avg(traceFullBytes) - avg(traceLiteBytes)) / avg(traceFullBytes)) *
        100
      ).toFixed(1)}%`,
    },
  };

  console.log(JSON.stringify(report, null, 2));
  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, `${save}.json`), JSON.stringify(report, null, 2));
  console.error(`Wrote ${join(RESULTS_DIR, save + ".json")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
