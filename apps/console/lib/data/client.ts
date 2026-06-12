import type { InArgs, ResultSet } from "@libsql/client";
import { db, ensureSchema } from "../db";

export type SqlStatement = {
  sql: string;
  args?: InArgs;
};

/** 追踪库读查询：统一 ensureSchema，便于后续加观测。 */
export async function query(
  sql: string,
  args: InArgs = []
): Promise<ResultSet> {
  await ensureSchema();
  return db.execute({ sql, args });
}

/** 原子写批次（outcome + inbox 等同库多语句）。 */
export async function writeBatch(statements: SqlStatement[]): Promise<void> {
  if (statements.length === 0) return;
  await ensureSchema();
  await db.batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    "write"
  );
}

export function firstRow<T extends Record<string, unknown>>(
  result: ResultSet
): T | undefined {
  return result.rows[0] as unknown as T | undefined;
}

export function scalarNumber(
  result: ResultSet,
  key = "c"
): number {
  const row = firstRow<Record<string, unknown>>(result);
  if (!row) return 0;
  const v = row[key] ?? row[0];
  return Number(v ?? 0);
}
