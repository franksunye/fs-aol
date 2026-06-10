"use client";

import { useCallback, useMemo, useState } from "react";

export type DataListColumnPreference = {
  id: string;
  label: string;
  /** Visible in wide layout by default (narrow layout may still hide via preset). */
  defaultVisible: boolean;
};

const STORAGE_PREFIX = "aol_console_data_list_columns_";

function readHiddenIds(tableId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tableId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeHiddenIds(tableId: string, hidden: Set<string>) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${tableId}`,
      JSON.stringify([...hidden])
    );
  } catch {
    /* ignore */
  }
}

export function useDataListColumnPreferences(
  tableId: string,
  columns: DataListColumnPreference[]
) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() =>
    readHiddenIds(tableId)
  );

  const isColumnHidden = useCallback(
    (columnId: string) => hiddenIds.has(columnId),
    [hiddenIds]
  );

  const setColumnHidden = useCallback(
    (columnId: string, hidden: boolean) => {
      setHiddenIds((prev) => {
        const next = new Set(prev);
        if (hidden) next.add(columnId);
        else next.delete(columnId);
        writeHiddenIds(tableId, next);
        return next;
      });
    },
    [tableId]
  );

  const resetColumns = useCallback(() => {
    setHiddenIds(new Set());
    writeHiddenIds(tableId, new Set());
  }, [tableId]);

  const toggleableColumns = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        hidden: hiddenIds.has(col.id),
        visible: !hiddenIds.has(col.id) && col.defaultVisible,
      })),
    [columns, hiddenIds]
  );

  return {
    hiddenIds,
    isColumnHidden,
    setColumnHidden,
    resetColumns,
    toggleableColumns,
  };
}
