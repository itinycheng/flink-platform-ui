import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { message } from "antd";
import { format } from "sql-formatter";
import type { CodeEditorHandle } from "@/components/CodeEditor";
import { getDataSources } from "@/api/manage";
import { execQuery } from "@/api/reactive";
import { downloadCsv } from "@/utils/file";
import type { QueryResult } from "@/types/reactive";
import { useQueryHistory, type QueryHistoryEntry } from "./useQueryHistory";

export interface DsOption {
  label: string;
  value: string;
}

/** State + handlers backing the reactive SQL console page. */
export function useReactiveQuery() {
  const { t } = useTranslation();
  const editorRef = useRef<CodeEditorHandle>(null);
  const [options, setOptions] = useState<DsOption[]>([]);
  const [datasourceId, setDatasourceId] = useState<string>();
  const [sql, setSql] = useState("SELECT * FROM orders LIMIT 100;");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const history = useQueryHistory();

  useEffect(() => {
    getDataSources({ page: 1, pageSize: 100 })
      .then((res) => setOptions(res.data.map((d) => ({ label: `${d.name} (${d.type})`, value: d.id }))))
      .catch((err) => console.error("[Reactive] load datasources failed", err));
  }, []);

  const run = async () => {
    if (!datasourceId) {
      message.warning(t("reactive.selectDatasourceFirst"));
      return;
    }
    // Run the highlighted statement when there's a selection, else the whole editor.
    const toRun = editorRef.current?.getSelectedText().trim() || sql.trim();
    if (!toRun) {
      message.warning(t("reactive.sqlRequired"));
      return;
    }
    setRunning(true);
    try {
      const res = await execQuery({ datasourceId, sql: toRun });
      setResult(res);
      history.add(toRun, datasourceId, Date.now());
    } catch {
      message.error(t("reactive.queryFailed"));
    } finally {
      setRunning(false);
    }
  };

  const formatSql = () => {
    if (!sql.trim()) return;
    try {
      setSql(format(sql, { language: "sql" }));
    } catch {
      message.warning(t("reactive.formatFailed"));
    }
  };

  const clear = () => {
    setSql("");
    setResult(null);
  };

  const pickHistory = (entry: QueryHistoryEntry) => {
    setSql(entry.sql);
    if (entry.datasourceId) setDatasourceId(entry.datasourceId);
  };

  const exportCsv = () => {
    if (!result?.success || result.rows.length === 0) return;
    downloadCsv(`query-${Date.now()}.csv`, result.columns, result.rows);
  };

  return {
    editorRef,
    options,
    datasourceId,
    setDatasourceId,
    sql,
    setSql,
    running,
    result,
    history,
    run: () => void run(),
    formatSql,
    clear,
    pickHistory,
    exportCsv,
  };
}
