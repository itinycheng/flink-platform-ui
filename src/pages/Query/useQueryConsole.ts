import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { message } from "antd";
import { format } from "sql-formatter";
import type { CodeEditorHandle } from "@/components/CodeEditor";
import { getDataSources } from "@/api/manage";
import { execQuery } from "@/api/query";
import { downloadCsv } from "@/utils/file";
import type { QueryResult } from "@/types/query";
import { useQueryHistory, type QueryHistoryEntry } from "./useQueryHistory";

export interface DsOption {
  label: string;
  value: string;
}

/** State + handlers backing the SQL query console page. */
export function useQueryConsole() {
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
      .then((res) => {
        const opts = res.data.map((d) => ({ label: `${d.name} (${d.type})`, value: d.id }));
        setOptions(opts);
        // Default to the first data source so the schema browser is populated on open.
        setDatasourceId((cur) => cur ?? opts[0]?.value);
      })
      .catch((err) => console.error("[Query] load datasources failed", err));
  }, []);

  const run = async () => {
    if (!datasourceId) {
      message.warning(t("query.selectDatasourceFirst"));
      return;
    }
    // Run the highlighted statement when there's a selection, else the whole editor.
    const toRun = editorRef.current?.getSelectedText().trim() || sql.trim();
    if (!toRun) {
      message.warning(t("query.sqlRequired"));
      return;
    }
    setRunning(true);
    try {
      const res = await execQuery({ datasourceId, sql: toRun });
      setResult(res);
      history.add(toRun, datasourceId, Date.now());
    } catch {
      message.error(t("query.queryFailed"));
    } finally {
      setRunning(false);
    }
  };

  const formatSql = () => {
    if (!sql.trim()) return;
    try {
      setSql(format(sql, { language: "sql" }));
    } catch {
      message.warning(t("query.formatFailed"));
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

  const insertToken = (text: string) => editorRef.current?.insertText(text);

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
    insertToken,
  };
}
