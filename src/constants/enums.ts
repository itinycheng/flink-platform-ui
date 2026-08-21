// Backend-aligned enum constants. Values mirror com.flink.platform.common.enums.*
// Labels are resolved via i18n key `enums.<Group>.<VALUE>`.

export const JOB_TYPES = [
  "FLINK_SQL",
  "FLINK_JAR",
  "COMMON_JAR",
  "CLICKHOUSE_SQL",
  "MYSQL_SQL",
  "HIVE_SQL",
  "SHELL",
  "CONDITION",
  "DEPENDENT",
  "SUB_FLOW",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_CLASSIFICATIONS = ["FLINK", "JAVA", "SQL", "SHELL", "CONDITION", "DEPENDENT", "SUB_FLOW"] as const;
export type JobClassification = (typeof JOB_CLASSIFICATIONS)[number];

export const DEPLOY_MODES = [
  "RUN_LOCAL",
  "FLINK_YARN_PER",
  "FLINK_YARN_SESSION",
  "FLINK_YARN_RUN_APPLICATION",
] as const;
export type DeployMode = (typeof DEPLOY_MODES)[number];

export const EXECUTION_MODES = ["STREAMING", "BATCH"] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const DB_TYPES = ["CLICKHOUSE", "MYSQL", "HIVE"] as const;
export type DbType = (typeof DB_TYPES)[number];

export const CATALOG_TYPES = ["MEMORY", "HIVE", "TIDB", "JDBC", "POSTGRES", "CLICKHOUSE", "ICEBERG"] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];

export const ALERT_TYPES = ["EMAIL", "FEI_SHU", "DING_DING", "SMS"] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const RESOURCE_TYPES = ["FILE", "DIR"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const EXECUTION_CONDITIONS = ["ALL_MATCHED", "ANY_MATCHED", "ALL_DONE", "ANY_DONE"] as const;
export type ExecutionCondition = (typeof EXECUTION_CONDITIONS)[number];

export const DEPENDENT_STRATEGIES = ["LAST_EXECUTION_AFTER_TIME", "LAST_EXECUTION_AS_EXPECTED"] as const;
export type DependentStrategy = (typeof DEPENDENT_STRATEGIES)[number];

export const DEPENDENT_RELATIONS = ["AND", "OR"] as const;
export type DependentRelation = (typeof DEPENDENT_RELATIONS)[number];

export const PARAM_TRANSFER_MODES = ["ALLOW", "DENY", "CUSTOM"] as const;
export type ParamTransferMode = (typeof PARAM_TRANSFER_MODES)[number];

export const JOB_STATUSES = ["ONLINE", "OFFLINE", "DELETE"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_FLOW_TYPES = ["JOB_FLOW", "JOB_LIST"] as const;
export type JobFlowType = (typeof JOB_FLOW_TYPES)[number];

export const JOB_FLOW_STATUSES = ["DELETE", "OFFLINE", "ONLINE", "SCHEDULING"] as const;
export type JobFlowStatus = (typeof JOB_FLOW_STATUSES)[number];

export const EXECUTION_STATUSES = [
  "SUBMITTED",
  "RUNNING",
  "SUCCESS",
  "FAILURE",
  "KILLED",
  "ABNORMAL",
  "ERROR",
  "NOT_EXIST",
  "CREATED",
  "KILLABLE",
  "EXPECTED_FAILURE",
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const EXECUTION_STRATEGIES = ["ONLY_CUR_JOB", "ALL_POST_JOBS", "ALL_PRE_JOBS"] as const;
export type ExecutionStrategy = (typeof EXECUTION_STRATEGIES)[number];

export const TIMEOUT_STRATEGIES = ["ALARM", "FAILURE"] as const;
export type TimeoutStrategy = (typeof TIMEOUT_STRATEGIES)[number];

export const JOB_PARAM_TYPES = ["GLOBAL", "JOB_FLOW"] as const;
export type JobParamType = (typeof JOB_PARAM_TYPES)[number];

export const TAG_TYPES = ["JOB_FLOW"] as const;
export type TagType = (typeof TAG_TYPES)[number];

export const STATUSES = ["ENABLE", "DISABLE", "DELETED"] as const;
export type Status = (typeof STATUSES)[number];

export const ROLES = ["SUPER_ADMIN", "ADMIN", "DEVELOPER", "OPERATOR", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["NORMAL", "LOCKED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PERMISSIONS = [
  "SYSTEM_MANAGE",
  "WORKSPACE_MANAGE",
  "WORKSPACE_VIEW",
  "TASK_EDIT",
  "TASK_EXEC",
  "TASK_VIEW",
  "TASK_PURGE",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Mirrors com.flink.platform.common.enums.Role's EnumSet<Permission> mapping (Role.java). */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "SYSTEM_MANAGE",
    "WORKSPACE_MANAGE",
    "WORKSPACE_VIEW",
    "TASK_EDIT",
    "TASK_EXEC",
    "TASK_VIEW",
    "TASK_PURGE",
  ],
  ADMIN: ["WORKSPACE_MANAGE", "WORKSPACE_VIEW", "TASK_EDIT", "TASK_EXEC", "TASK_VIEW", "TASK_PURGE"],
  DEVELOPER: ["WORKSPACE_VIEW", "TASK_EDIT", "TASK_EXEC", "TASK_VIEW"],
  OPERATOR: ["WORKSPACE_VIEW", "TASK_EXEC", "TASK_VIEW"],
  VIEWER: ["WORKSPACE_VIEW", "TASK_VIEW"],
};

export const WORKER_STATUSES = ["ACTIVE", "INACTIVE", "DELETED"] as const;
export type WorkerStatus = (typeof WORKER_STATUSES)[number];

export const JOB_TYPE_CLASSIFICATION: Record<JobType, JobClassification> = {
  FLINK_SQL: "FLINK",
  FLINK_JAR: "FLINK",
  COMMON_JAR: "JAVA",
  CLICKHOUSE_SQL: "SQL",
  MYSQL_SQL: "SQL",
  HIVE_SQL: "SQL",
  SHELL: "SHELL",
  CONDITION: "CONDITION",
  DEPENDENT: "DEPENDENT",
  SUB_FLOW: "SUB_FLOW",
};

export const JOB_TYPE_DBTYPE: Partial<Record<JobType, DbType>> = {
  CLICKHOUSE_SQL: "CLICKHOUSE",
  MYSQL_SQL: "MYSQL",
  HIVE_SQL: "HIVE",
};

/** Map an enum value tuple to Ant Design Select options with i18n labels. */
export function enumOptions<T extends string>(
  values: readonly T[],
  group: string,
  t: (key: string) => string,
): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: t(`enums.${group}.${value}`) }));
}
