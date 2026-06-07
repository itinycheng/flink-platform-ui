export type JobStatus = "success" | "failed" | "running" | "scheduling" | "stopped" | "pending";

export type JobType = "SQL" | "SHELL" | "JDBC" | "FLINK" | "SPARK" | (string & {});

export interface JobTreeNode {
  id: string;
  name: string;
  type: JobType;
  group: string;
  children?: JobTreeNode[];
  status?: JobStatus;
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

export type TaskParams = SqlTaskParams | ShellTaskParams | SparkTaskParams | FlinkTaskParams | CustomTaskParams;

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
