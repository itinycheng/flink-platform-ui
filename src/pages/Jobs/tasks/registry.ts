import type React from "react";
import type {
  JobType,
  TaskParams,
  SqlTaskParams,
  ShellTaskParams,
  SparkTaskParams,
  FlinkTaskParams,
} from "@/types/job";
import SqlForm from "./SqlForm";
import ShellForm from "./ShellForm";
import SparkForm from "./SparkForm";
import FlinkForm from "./FlinkForm";

export interface TaskTypeDefinition {
  type: JobType;
  label: string;
  icon?: React.ReactNode;
  formComponent: React.ComponentType<{
    value?: TaskParams;
    onChange?: (v: TaskParams) => void;
  }>;
  defaultParams: TaskParams;
}

const SQL_DEFAULT_PARAMS: SqlTaskParams = {
  datasource: "",
  sql: "",
};

const SHELL_DEFAULT_PARAMS: ShellTaskParams = {
  script: "",
};

const SPARK_DEFAULT_PARAMS: SparkTaskParams = {
  mainClass: "",
  jarPath: "",
};

const FLINK_DEFAULT_PARAMS: FlinkTaskParams = {
  jobName: "",
  jarPath: "",
};

export const TASK_TYPE_REGISTRY: Map<JobType, TaskTypeDefinition> = new Map([
  [
    "sql",
    {
      type: "sql",
      label: "SQL",
      formComponent: SqlForm,
      defaultParams: SQL_DEFAULT_PARAMS,
    },
  ],
  [
    "shell",
    {
      type: "shell",
      label: "Shell",
      formComponent: ShellForm,
      defaultParams: SHELL_DEFAULT_PARAMS,
    },
  ],
  [
    "spark",
    {
      type: "spark",
      label: "Spark",
      formComponent: SparkForm,
      defaultParams: SPARK_DEFAULT_PARAMS,
    },
  ],
  [
    "flink",
    {
      type: "flink",
      label: "Flink",
      formComponent: FlinkForm,
      defaultParams: FLINK_DEFAULT_PARAMS,
    },
  ],
]);

/**
 * Get all registered task types as an array of options for Select components.
 */
export function getTaskTypeOptions(): { label: string; value: JobType }[] {
  return Array.from(TASK_TYPE_REGISTRY.values()).map((def) => ({
    label: def.label,
    value: def.type,
  }));
}

/**
 * Get a task type definition by type key.
 */
export function getTaskTypeDefinition(type: JobType): TaskTypeDefinition | undefined {
  return TASK_TYPE_REGISTRY.get(type);
}
