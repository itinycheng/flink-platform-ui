/**
 * New-UI DAG canvas serialization. The XYFlow-based Studio canvas has a
 * different, richer shape than the legacy `JobFlowDag` (vertices/jobId/edges).
 * The backend is being made to accept this `FlowGraph` alongside the legacy
 * format so the UI can migrate gradually — so we serialize the canvas
 * faithfully here rather than squeezing it into the old vertex model.
 */
export interface FlowNode {
  /** Canvas node id (stable across save/reload). */
  id: string;
  /** Backend JobType for task nodes (e.g. "MYSQL_SQL", "SHELL", "FLINK_SQL"). */
  taskType: string;
  label: string;
  description?: string;
  priority?: string;
  /** Canvas position. */
  x: number;
  y: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  /** Expected upstream status that enables this edge (e.g. "SUCCESS"/"FAILURE"/"default"). */
  status: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
