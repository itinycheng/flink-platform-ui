import type React from "react";
import type {
  JobType,
  TaskParams,
  SqlTaskParams,
  ShellTaskParams,
  SparkTaskParams,
  FlinkTaskParams,
  ConditionTaskParams,
  DependentTaskParams,
  SubFlowTaskParams,
} from "@/types/job";
import SqlForm from "./SqlForm";
import ShellForm from "./ShellForm";
import SparkForm from "./SparkForm";
import FlinkForm from "./FlinkForm";
import ConditionForm from "./ConditionForm";
import DependentForm from "./DependentForm";
import SubFlowForm from "./SubFlowForm";

export interface TaskTypeDefinition {
  type: JobType;
  /** i18n key (namespace `taskForm.*`). Pass through `t()` before display. */
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

const CONDITION_DEFAULT_PARAMS: ConditionTaskParams = {
  expression: "",
};

const DEPENDENT_DEFAULT_PARAMS: DependentTaskParams = {
  dependWorkflowId: "",
  dependStatus: "success",
  relation: "and",
};

const SUBFLOW_DEFAULT_PARAMS: SubFlowTaskParams = {
  subWorkflowId: "",
};

export const TASK_TYPE_REGISTRY: Map<JobType, TaskTypeDefinition> = new Map([
  [
    "sql",
    {
      type: "sql",
      label: "taskForm.labelSql",
      formComponent: SqlForm,
      defaultParams: SQL_DEFAULT_PARAMS,
    },
  ],
  [
    "shell",
    {
      type: "shell",
      label: "taskForm.labelShell",
      formComponent: ShellForm,
      defaultParams: SHELL_DEFAULT_PARAMS,
    },
  ],
  [
    "spark",
    {
      type: "spark",
      label: "taskForm.labelSpark",
      formComponent: SparkForm,
      defaultParams: SPARK_DEFAULT_PARAMS,
    },
  ],
  [
    "flink",
    {
      type: "flink",
      label: "taskForm.labelFlink",
      formComponent: FlinkForm,
      defaultParams: FLINK_DEFAULT_PARAMS,
    },
  ],
  [
    "condition",
    {
      type: "condition",
      label: "taskForm.labelCondition",
      formComponent: ConditionForm,
      defaultParams: CONDITION_DEFAULT_PARAMS,
    },
  ],
  [
    "depend",
    {
      type: "depend",
      label: "taskForm.labelDepend",
      formComponent: DependentForm,
      defaultParams: DEPENDENT_DEFAULT_PARAMS,
    },
  ],
  [
    "subflow",
    {
      type: "subflow",
      label: "taskForm.labelSubflow",
      formComponent: SubFlowForm,
      defaultParams: SUBFLOW_DEFAULT_PARAMS,
    },
  ],
]);

/**
 * Get all registered task types as an array of options for Select components.
 * `label` is an i18n key; run it through `t()` at render time.
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
