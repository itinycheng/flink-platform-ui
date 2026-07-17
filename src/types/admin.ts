export interface ResourceFile {
  id: string;
  name: string;
  size: number;
  /** MIME type for files; "DIR" for folders. */
  type: string;
  uploadTime: string;
  url: string;
  /** Parent folder id; null at the root. */
  parentId: string | null;
  isDir: boolean;
}

/** One ancestor step for the folder breadcrumb (root → … → current). */
export interface ResourcePathItem {
  id: string;
  name: string;
}

/** A folder node in the move-target picker tree. */
export interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
}

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  status: "active" | "disabled";
  createdAt: string;
}

export interface CustomParam {
  id: string;
  name: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  description?: string;
}

// ---- Data Source ----

export type DataSourceType = "MySQL" | "PostgreSQL" | "Oracle" | "Hive" | "Kafka" | "Flink";

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  /** Connection parameters serialized as a JSON string. */
  params: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

// ---- Catalog (Flink SQL Catalog) ----

export type CatalogType = "hive" | "jdbc" | "paimon" | "iceberg";

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

export type WorkerRole = "master" | "worker" | "all";
export type WorkerStatus = "online" | "offline";

export interface Worker {
  id: string;
  name: string;
  ip: string;
  port: number;
  role: WorkerRole;
  status: WorkerStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Tag ----

export type TagStatus = "active" | "disabled";

export interface Tag {
  id: string;
  name: string;
  type: string;
  status: TagStatus;
  createdAt: string;
  updatedAt: string;
}

// ---- System Config (Hadoop/Flink/Hive) ----

export type SysConfigType = "HADOOP_CONFIG" | "FLINK_CONFIG" | "HIVE_CONFIG" | "SPARK_CONFIG";
export type SysConfigStatus = "online" | "offline" | "deleted";

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
