import { http } from "@/utils/request";
import type { QueryRequest, QueryResult } from "@/types/query";

/** Execute an ad-hoc SQL query against the chosen data source. */
export function execQuery(data: QueryRequest): Promise<QueryResult> {
  return http.post<QueryResult>("/query/execute", data);
}

/** List database/schema names in the given data source. */
export function getDatabases(datasourceId: string): Promise<string[]> {
  return http.get<string[]>("/query/databases", { params: { datasourceId } });
}

/** List table names within a database of the given data source. */
export function getTables(datasourceId: string, database: string): Promise<string[]> {
  return http.get<string[]>("/query/tables", { params: { datasourceId, database } });
}
