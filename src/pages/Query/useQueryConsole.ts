import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { message } from "antd";
import { format } from "sql-formatter";
import type { CodeEditorHandle } from "@/components/CodeEditor";
import { getDataSources } from "@/api/admin";
import { execQuery } from "@/api/query";
import { downloadCsv } from "@/utils/file";
import type { QueryResult } from "@/types/query";
import { useQueryHistory, type QueryHistoryEntry } from "./useQueryHistory";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/app/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { DataSource } from "@/types/admin";

export interface DsOption {
  label: string;
  value: string;
}

function datasourceOption(datasource: DataSource): DsOption {
  return { label: `${datasource.name} (${datasource.type})`, value: datasource.id };
}

/** State + handlers backing the SQL query console page. */
export function useQueryConsole() {
  const { t } = useTranslation();
  const editorRef = useRef<CodeEditorHandle>(null);
  const [datasourceId, setDatasourceId] = useState<string>();
  const [sql, setSql] = useState("SELECT * FROM orders LIMIT 100;");
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  const history = useQueryHistory();
  const datasourceQuery = useQuery(
    {
      queryKey: queryKeys.adminList(workspaceId, "query-datasources", { page: 1, pageSize: 100 }),
      queryFn: () => getDataSources({ page: 1, pageSize: 100 }),
      enabled: workspaceId != null,
      staleTime: 60_000,
    },
    queryClient,
  );
  const options: DsOption[] = useMemo(
    () => (datasourceQuery.data?.data ?? []).map(datasourceOption),
    [datasourceQuery.data],
  );
  const selectedDatasourceId = datasourceId ?? options[0]?.value;
  const execution = useMutation({ mutationFn: execQuery }, queryClient);

  const run = async () => {
    if (!selectedDatasourceId) {
      message.warning(t("query.selectDatasourceFirst"));
      return;
    }
    // Run the highlighted statement when there's a selection, else the whole editor.
    const toRun = editorRef.current?.getSelectedText().trim() || sql.trim();
    if (!toRun) {
      message.warning(t("query.sqlRequired"));
      return;
    }
    try {
      await execution.mutateAsync({ datasourceId: selectedDatasourceId, sql: toRun });
      history.add(toRun, selectedDatasourceId, Date.now());
    } catch {
      // handled by the global interceptor toast
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
    execution.reset();
  };

  const pickHistory = (entry: QueryHistoryEntry) => {
    setSql(entry.sql);
    if (entry.datasourceId) setDatasourceId(entry.datasourceId);
  };

  const exportCsv = () => {
    if (!execution.data?.success || execution.data.rows.length === 0) return;
    downloadCsv(`query-${Date.now()}.csv`, execution.data.columns, execution.data.rows);
  };

  const insertToken = (text: string) => editorRef.current?.insertText(text);

  return {
    editorRef,
    options,
    datasourceId: selectedDatasourceId,
    setDatasourceId,
    sql,
    setSql,
    running: execution.isPending,
    result: (execution.data as QueryResult | undefined) ?? null,
    history,
    run: () => void run(),
    formatSql,
    clear,
    pickHistory,
    exportCsv,
    insertToken,
  };
}
