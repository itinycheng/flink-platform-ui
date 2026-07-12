import { http } from "@/utils/request";
import type { QueryRequest, QueryResult } from "@/types/reactive";

/** Execute an ad-hoc SQL query against the chosen data source. */
export function execQuery(data: QueryRequest): Promise<QueryResult> {
  return http.post<QueryResult>("/reactive/query", data);
}
