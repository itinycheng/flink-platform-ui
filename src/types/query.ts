export interface QueryRequest {
  datasourceId: string;
  sql: string;
}

export interface QueryResult {
  success: boolean;
  /** Column names, in order. */
  columns: string[];
  /** Result rows keyed by column name. */
  rows: Array<Record<string, string | number | null>>;
  /** Execution log / error output. */
  log: string;
  elapsedMs: number;
}
