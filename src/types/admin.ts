import type { DbType, WorkerStatus, CatalogType, TagType, Status, UserStatus, JobParamType } from "@/constants/enums";
import type { DatasourceParam, EnvironmentSpec, UserRoles } from "@/types/entities";

export type { CatalogType };

export interface ManagedUser {
  id: string;
  username: string;
  email?: string;
  password?: string;
  roles: UserRoles;
  status: UserStatus;
  createdAt: string;
}

// Aligned to backend JobParam (t_job_param).
export interface CustomParam {
  id: string;
  paramName: string;
  paramValue: string;
  type: JobParamType;
  /** Present only for JOB_FLOW-scoped params. */
  flowId?: string;
  description?: string;
  status?: Status;
}

// ---- Data Source ----

// Aligned to the backend DbType enum (com.flink.platform.common.enums.DbType).
export type DataSourceType = DbType;

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  /** Structured connection parameters (mirrors backend DatasourceParam). */
  params: DatasourceParam;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Catalog (Flink SQL Catalog) ----

export interface Catalog {
  id: string;
  name: string;
  type: CatalogType;
  /** DDL used to register the catalog. */
  createSql: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Worker Node ----

export interface Worker {
  id: string;
  name: string;
  ip: string;
  port: string;
  grpcPort?: number;
  /** Worker status (ACTIVE/INACTIVE/DELETED); backend JSON key is `role`. */
  role: WorkerStatus;
  desc?: string;
  environments?: EnvironmentSpec[];
  createdAt: string;
  updatedAt: string;
}

// ---- Tag ----


export interface Tag {
  id: string;
  code?: string;
  name: string;
  type: TagType;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

// ---- System Config (Hadoop/Flink/Hive) ----

export type SysConfigType = "HADOOP_CONFIG" | "FLINK_CONFIG" | "HIVE_CONFIG" | "SPARK_CONFIG";
export type SysConfigStatus = Status;

export interface SysConfig {
  id: string;
  name: string;
  type: SysConfigType;
  version: string;
  status: SysConfigStatus;
  /** Raw config content (properties / xml / yaml). */
  content: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Audit Log ----

export type AuditResult = "success" | "failed";

export interface AuditLog {
  id: string;
  operator: string; // who performed the action (username)
  action: string; // e.g. CREATE / UPDATE / DELETE / LOGIN / RUN (backend enum)
  module: string; // resource type / module (backend enum)
  target?: string; // affected entity name or id
  result: AuditResult;
  ip?: string;
  detail?: string; // change detail, typically before/after JSON string
  createdAt: string; // ISO timestamp
}
