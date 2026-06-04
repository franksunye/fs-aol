import { db, TABLE_LOGS } from "./db";

/** 解析 libsql PRAGMA table_info（兼容对象行与数组行）。 */
export function pragmaColumnNames(result: {
  rows: unknown[];
  columns?: string[];
}): Set<string> {
  const names = new Set<string>();
  const { rows, columns } = result;
  const nameIdx =
    columns && columns.length > 0 ? columns.indexOf("name") : -1;

  for (const row of rows) {
    if (Array.isArray(row)) {
      const idx = nameIdx >= 0 ? nameIdx : 1;
      const n = row[idx];
      if (n != null && String(n)) names.add(String(n));
    } else if (row && typeof row === "object") {
      const n = (row as Record<string, unknown>).name;
      if (n != null && String(n)) names.add(String(n));
    }
  }
  return names;
}

export async function logsTableColumnNames(): Promise<Set<string>> {
  const info = await db.execute(`PRAGMA table_info(${TABLE_LOGS})`);
  return pragmaColumnNames({
    rows: info.rows as unknown[],
    columns: info.columns as string[] | undefined,
  });
}

export async function logsHasInboxColumns(): Promise<boolean> {
  const cols = await logsTableColumnNames();
  return cols.has("inbox_bucket");
}
