import { http } from "@/utils/request";
import type { QueryRequest, QueryResult } from "@/types/query";

/** Execute an ad-hoc SQL query against the chosen data source. */
export function execQuery(data: QueryRequest): Promise<QueryResult> {
  return http.post<QueryResult>("/query/execute", data);
}

/** List table names in the given data source, for the schema browser. */
export function getTables(datasourceId: string): Promise<string[]> {
  return http.get<string[]>("/query/tables", { params: { datasourceId } });
}
