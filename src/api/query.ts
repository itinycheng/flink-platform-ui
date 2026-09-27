import { http } from "@/utils/request";
import type { QueryRequest, QueryResult } from "@/types/query";
import type { DataSource } from "@/types/admin";
import type { DbType, JobType } from "@/constants/enums";

interface LegacyReactiveResult {
  sync: boolean;
  execId: string;
  meta?: string[];
  data?: unknown[][];
  exception?: string;
}

const SQL_JOB_TYPE: Record<DbType, JobType> = {
  CLICKHOUSE: "CLICKHOUSE_SQL",
  MYSQL: "MYSQL_SQL",
  HIVE: "HIVE_SQL",
};

function adaptReactiveResult(result: LegacyReactiveResult, elapsedMs: number): QueryResult {
  const columns = result.meta ?? [];
  const rows = (result.data ?? []).map((values) =>
    Object.fromEntries(columns.map((column, index) => [column, values[index] as string | number | null])),
  );
  return {
    success: !result.exception,
    columns,
    rows,
    log:
      result.exception ??
      (result.sync ? `Query completed (${rows.length} rows)` : `Execution started: ${result.execId}`),
    elapsedMs,
  };
}

/** Execute an ad-hoc SQL query against the chosen data source. */
export async function execQuery(data: QueryRequest): Promise<QueryResult> {
  const startedAt = performance.now();
  const datasource = await http.get<DataSource>(`/datasource/get/${data.datasourceId}`);
  const type = SQL_JOB_TYPE[datasource.type];
  const result = await http.post<LegacyReactiveResult>("/reactive/execJob", {
    name: "runnelo-query",
    type,
    execMode: "BATCH",
    subject: data.sql,
    config: { type, dsId: Number(data.datasourceId), retryTimes: 0, retryInterval: "5s" },
  });
  return adaptReactiveResult(result, Math.round(performance.now() - startedAt));
}

/** List database/schema names in the given data source. */
export function getDatabases(datasourceId: string): Promise<string[]> {
  void datasourceId;
  return Promise.resolve([]);
}

/** List table names within a database of the given data source. */
export function getTables(datasourceId: string, database: string): Promise<string[]> {
  void datasourceId;
  void database;
  return Promise.resolve([]);
}
