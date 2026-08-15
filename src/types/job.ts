export type JobStatus = "success" | "failed" | "running" | "scheduling" | "stopped" | "pending";

export type JobType = "SQL" | "SHELL" | "JDBC" | "FLINK" | "SPARK" | (string & {});

export interface JobTreeNode {
  id: string;
  name: string;
  type: JobType;
  group: string;
  children?: JobTreeNode[];
  /** Total number of direct children (for the group count badge); may exceed loaded `children` when paginated. */
  childCount?: number;
  /** Latest run status (for the run-status indicator). */
  status?: JobStatus;
  /** Lifecycle status of a definition node (Task or Workflow). Absent on group nodes. */
  lifecycleStatus?: WorkflowLifecycleStatus;
  /** Tags bound to this definition. */
  tags?: string[];
  /** Ids of bound notification alert rules. */
  alertRuleIds?: string[];
}

export interface WorkflowRunRecord {
  id: string;
  workflowId: string;
  startTime: string;
  endTime: string;
  status: "success" | "failed" | "running";
  duration: number;
  logUrl?: string;
}

/** Lifecycle status of a workflow definition (mirrors the legacy project). */
export type WorkflowLifecycleStatus = "OFFLINE" | "ONLINE" | "SCHEDULING" | "DELETE";
