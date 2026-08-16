import type { JobType } from "@/constants/enums";

export type JobStatus = "success" | "failed" | "running" | "scheduling" | "stopped" | "pending";

export type TreeNodeKind = "group" | "task" | "workflow";

export interface JobTreeNode {
  id: string;
  name: string;
  kind: TreeNodeKind;
  /** Backend JobType, leaf only — drives the icon for task nodes. */
  jobType?: JobType;
  /** jobInfo/jobFlow backend id (leaf). */
  refId?: number;
  /** Parent group id; "" = top level. */
  pid: string;
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

/** Lifecycle status of a workflow definition (mirrors the legacy project). */
export type WorkflowLifecycleStatus = "OFFLINE" | "ONLINE" | "SCHEDULING" | "DELETE";
