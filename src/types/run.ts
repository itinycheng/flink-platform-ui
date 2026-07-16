export type RunStatus = "waiting" | "running" | "success" | "failed" | "killed";

/** A run's task type. "flow" is a composite workflow; the rest are atomic tasks. */
export type RunType = "flow" | "spark" | "flink" | "shell" | "sql";

/** A single node's execution inside a flow run (one task within the workflow). */
export interface RunNode {
  id: string;
  name: string;
  type: RunType;
  status: RunStatus;
  /** Duration in seconds. */
  duration: number;
  /** Runtime parameters serialized as a JSON string. */
  params: string;
  trackingUrl?: string;
}

/** DAG geometry for a flow run — node positions/status + edges, rendered read-only. */
export interface RunGraphNode {
  id: string;
  label: string;
  type: RunType;
  x: number;
  y: number;
  status: RunStatus;
}

export interface RunGraphEdge {
  source: string;
  target: string;
}

export interface RunGraph {
  nodes: RunGraphNode[];
  edges: RunGraphEdge[];
}

/** A top-level execution — either an atomic task run or a flow (workflow) run. */
export interface Run {
  id: string;
  name: string;
  type: RunType;
  status: RunStatus;
  tags: string[];
  startTime: string;
  endTime?: string;
  /** Duration in seconds. */
  duration: number;
  owner: string;
  /** External Flink/Spark console URL (atomic runs). */
  trackingUrl?: string;
  /** Runtime parameters serialized as a JSON string (atomic runs). */
  params?: string;
}

/** Full run detail, including the flow graph + node runs (from /api/runs/:id). */
export interface RunDetail extends Run {
  graph?: RunGraph;
  nodes?: RunNode[];
}

/** Filters accepted by the run list endpoint (all optional). */
export interface RunListParams {
  page: number;
  pageSize: number;
  name?: string;
  type?: RunType;
  status?: RunStatus;
  startFrom?: string;
  startTo?: string;
}

export interface RunLog {
  id: string;
  content: string;
}
