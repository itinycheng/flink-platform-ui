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

export interface SqlTaskParams {
  datasource: string;
  sql: string;
  timeout?: number;
}

export interface ShellTaskParams {
  script: string;
  env?: Record<string, string>;
  workingDir?: string;
}

export interface SparkTaskParams {
  mainClass: string;
  jarPath: string;
  sparkConf?: Record<string, string>;
  args?: string[];
}

export interface CustomTaskParams {
  [key: string]: unknown;
}

export interface FlinkTaskParams {
  jobName: string;
  jarPath: string;
  entryClass?: string;
  parallelism?: number;
  flinkConf?: Record<string, string>;
}

/** Conditional branch node: routes downstream edges by evaluating an expression. */
export interface ConditionTaskParams {
  expression: string;
  trueBranch?: string;
  falseBranch?: string;
}

/** Dependency node: waits for another workflow to reach a given status. */
export interface DependentTaskParams {
  dependWorkflowId: string;
  dependStatus: "success" | "failed" | "any";
  relation: "and" | "or";
}

/** Sub-flow node: embeds another workflow, optionally passing parameters. */
export interface SubFlowTaskParams {
  subWorkflowId: string;
  params?: Record<string, string>;
}

export type TaskParams =
  | SqlTaskParams
  | ShellTaskParams
  | SparkTaskParams
  | FlinkTaskParams
  | ConditionTaskParams
  | DependentTaskParams
  | SubFlowTaskParams
  | CustomTaskParams;

export interface WorkflowFormData {
  id?: string;
  name: string;
  cronExpression: string;
  taskType: JobType;
  taskParams: TaskParams;
  description?: string;
  enabled: boolean;
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

export type WorkflowKind = "JOB_FLOW" | "JOB_LIST";

/** A row in the workflow definitions list. */
export interface WorkflowDefinition {
  id: string;
  name: string;
  kind: WorkflowKind;
  status: WorkflowLifecycleStatus;
  cronExpression?: string;
  tags: string[];
  /** Ids of bound notification alert rules. */
  alertRuleIds: string[];
  owner: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DefinitionListParams {
  page: number;
  pageSize: number;
  name?: string;
  status?: WorkflowLifecycleStatus;
  kind?: WorkflowKind;
  tag?: string;
}
