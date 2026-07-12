export type RunStatus = "waiting" | "running" | "success" | "failed" | "killed";

/** A single execution instance of a workflow (JobFlowRun in the legacy project). */
export interface FlowRun {
  id: string;
  /** Workflow definition id this run belongs to. */
  flowId: string;
  name: string;
  status: RunStatus;
  tags: string[];
  startTime: string;
  endTime?: string;
  /** Duration in seconds. */
  duration: number;
  owner: string;
}

/** A single execution record of a task/job within a flow run (JobRun in the legacy project). */
export interface JobRun {
  id: string;
  jobId: string;
  /** Parent flow run id. */
  flowRunId: string;
  name: string;
  type: string;
  status: RunStatus;
  startTime: string;
  endTime?: string;
  /** Duration in seconds. */
  duration: number;
  /** External Flink/Spark console URL, when available. */
  trackingUrl?: string;
  /** Runtime parameters serialized as a JSON string. */
  params: string;
  owner: string;
}

/** Filters accepted by the run list endpoints (all optional). */
export interface RunListParams {
  page: number;
  pageSize: number;
  name?: string;
  status?: RunStatus;
  flowRunId?: string;
  jobId?: string;
  startFrom?: string;
  startTo?: string;
}

export interface RunLog {
  id: string;
  content: string;
}
