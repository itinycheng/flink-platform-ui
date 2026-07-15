import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dtail.reactive.history";
const MAX_ENTRIES = 20;

export interface QueryHistoryEntry {
  sql: string;
  datasourceId?: string;
  /** Epoch millis when the query was run. */
  ts: number;
}

function read(): QueryHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as QueryHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Persist recently-run queries in localStorage so the user can reopen past
 * statements. Newest first, deduped against the immediately previous entry,
 * capped at {@link MAX_ENTRIES}.
 */
export function useQueryHistory() {
  const [entries, setEntries] = useState<QueryHistoryEntry[]>(read);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore quota / privacy-mode failures — history is best-effort.
    }
  }, [entries]);

  const add = useCallback((sql: string, datasourceId: string | undefined, ts: number) => {
    const trimmed = sql.trim();
    if (!trimmed) return;
    setEntries((prev) => {
      if (prev[0]?.sql === trimmed && prev[0]?.datasourceId === datasourceId) return prev;
      return [{ sql: trimmed, datasourceId, ts }, ...prev].slice(0, MAX_ENTRIES);
    });
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, add, clear };
}
