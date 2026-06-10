"use client";

import { useCallback, useState } from "react";
import {
  DATA_LIST_DENSITY_STORAGE_KEY,
  type DataListDensity,
} from "./data-list-types";

function readDensity(): DataListDensity {
  if (typeof window === "undefined") return "comfortable";
  try {
    const stored = localStorage.getItem(DATA_LIST_DENSITY_STORAGE_KEY);
    if (stored === "compact" || stored === "comfortable") return stored;
  } catch {
    /* ignore */
  }
  return "comfortable";
}

export function useDataListDensity() {
  const [density, setDensityState] = useState<DataListDensity>(readDensity);

  const setDensity = useCallback((next: DataListDensity) => {
    setDensityState(next);
    try {
      localStorage.setItem(DATA_LIST_DENSITY_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDensity = useCallback(() => {
    setDensity(density === "compact" ? "comfortable" : "compact");
  }, [density, setDensity]);

  return { density, setDensity, toggleDensity };
}
