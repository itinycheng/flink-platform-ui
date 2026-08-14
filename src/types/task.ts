// Polymorphic job `config` (mirrors com.flink.platform ...dao.entity.task.*)
import type {
  JobType,
  DependentRelation,
  DependentStrategy,
  ExecutionCondition,
  ExecutionStatus,
  ParamTransferMode,
} from "@/constants/enums";

/** Fields common to every job config (BaseJob). */
export interface BaseJob {
  type: JobType;
  retryTimes: number;
  retryInterval: string; // duration, e.g. "5s"
  timeout?: string; // duration
}

export interface FlinkJob extends BaseJob {
  type: "FLINK_SQL" | "FLINK_JAR";
  optionArgs?: string;
  configs?: Record<string, string>;
  catalogs?: number[];
  extJars?: number[];
  mainArgs?: string;
  mainClass?: string;
}

export interface JavaJob extends BaseJob {
  type: "COMMON_JAR";
}

export interface SqlJob extends BaseJob {
  type: "CLICKHOUSE_SQL" | "MYSQL_SQL" | "HIVE_SQL";
  dsId?: number;
}

export interface ShellJob extends BaseJob {
  type: "SHELL";
  timeout: string; // required for shell
}

export interface ConditionJob extends BaseJob {
  type: "CONDITION";
  condition: ExecutionCondition;
}

export interface DependentItem {
  flowId: number;
  jobId: number;
  statuses: ExecutionStatus[];
  strategy: DependentStrategy;
  duration: string;
}

export interface DependentJob extends BaseJob {
  type: "DEPENDENT";
  relation: DependentRelation;
  dependentItems: DependentItem[];
}

export interface FlowJob extends BaseJob {
  type: "SUB_FLOW";
  flowId: number;
  paramTransferMode: ParamTransferMode;
  paramNames?: string[];
}

export type JobConfig =
  | FlinkJob
  | JavaJob
  | SqlJob
  | ShellJob
  | ConditionJob
  | DependentJob
  | FlowJob;
