// Backend entity shapes (mirror com.flink.platform ...dao.entity.*)
import type {
  AlertType,
  CatalogType,
  DbType,
  DeployMode,
  ExecutionCondition,
  ExecutionMode,
  ExecutionStatus,
  ExecutionStrategy,
  JobFlowStatus,
  JobFlowType,
  JobParamType,
  JobStatus,
  JobType,
  ResourceType,
  Role,
  Status,
  TagType,
  TimeoutStrategy,
  UserStatus,
  WorkerStatus,
} from "@/constants/enums";
import type { JobConfig } from "./task";
import type { FlowGraph } from "./flow";

// ---- Job definition ----
export interface JobInfo {
  id?: number;
  name: string;
  flowId?: number;
  description?: string;
  type: JobType;
  version?: string;
  deployMode?: DeployMode;
  execMode: ExecutionMode;
  config?: JobConfig;
  params?: Record<string, unknown>;
  subject?: string;
  routeUrl: number[]; // selected worker ids, required non-empty
  status?: JobStatus;
}

// ---- Workflow (JobFlow) ----
export interface JobVertex {
  id: number;
  jobId: number;
  precondition: ExecutionCondition;
}
export interface JobEdge {
  fromVId: number;
  toVId: number;
  expectStatus: ExecutionStatus;
}
export interface NodeLayout {
  id: string;
  type: string;
  x: number;
  y: number;
}
export interface JobFlowDag {
  vertices: JobVertex[];
  edges: JobEdge[];
  nodeLayouts?: Record<number, NodeLayout>;
  edgeLayouts?: Record<number, { id: string }>;
}
export interface ExecutionConfig {
  strategy?: ExecutionStrategy;
  startJobId?: number;
  scheduleTime?: string;
  parallelism: number;
}
export interface Timeout {
  enable: boolean;
  strategies?: TimeoutStrategy[];
  threshold?: string;
}
export interface AlertConfig {
  alertId: number;
  statuses: ExecutionStatus[];
}
export interface JobFlow {
  id?: number;
  code?: string;
  name: string;
  description?: string;
  type: JobFlowType;
  cronExpr?: string;
  /** Legacy vertex/jobId DAG, or the new-UI FlowGraph; backend accepts both. */
  flow?: JobFlowDag | FlowGraph;
  priority?: number;
  config?: ExecutionConfig;
  tags?: string[];
  alerts?: AlertConfig[];
  timeout?: Timeout;
  params?: Record<string, unknown>;
  status?: JobFlowStatus;
}

// ---- Datasource ----
export interface DatasourceParam {
  url: string;
  username?: string;
  password?: string;
  properties?: Record<string, string>;
}
export interface Datasource {
  id?: number;
  name: string;
  description?: string;
  type: DbType;
  params: DatasourceParam;
}

// ---- Catalog ----
export interface CatalogInfo {
  id?: number;
  name: string;
  description?: string;
  type: CatalogType;
  createSql: string;
}

// ---- Alert ----
export interface EmailAlert {
  type: "EMAIL";
}
export interface FeiShuAlert {
  type: "FEI_SHU";
  webhook: string;
  content?: Record<string, unknown>;
}
export interface DingDingAlert {
  type: "DING_DING";
}
export interface SmsAlert {
  type: "SMS";
}
export type AlertPayload = EmailAlert | FeiShuAlert | DingDingAlert | SmsAlert;
export interface AlertInfo {
  id?: number;
  name: string;
  description?: string;
  type: AlertType;
  config?: AlertPayload;
}

// ---- Resource ----
export interface Resource {
  id?: number;
  name: string;
  fullName?: string;
  description?: string;
  pid?: number;
  type: ResourceType;
}

// ---- Worker ----
export interface EnvironmentSpec {
  name: string;
  value: string;
}
export interface Worker {
  id?: number;
  name: string;
  desc?: string;
  ip: string;
  port: string;
  grpcPort?: number;
  /** Worker status. Backend serializes this under the JSON key `role`. */
  role: WorkerStatus;
  heartbeat?: number;
  environments?: EnvironmentSpec[];
}

// ---- User ----
export interface UserRoles {
  global?: Role;
  workspaces?: Record<number, Role>;
}
export interface User {
  id?: number;
  username: string;
  password?: string;
  email?: string;
  externalId?: string;
  roles?: UserRoles;
  status: UserStatus;
}

// ---- JobParam / Tag / Config / Workspace ----
export interface JobParam {
  id?: number;
  flowId?: string;
  description?: string;
  type: JobParamType;
  paramName: string;
  paramValue: string;
  status?: Status;
}
export interface Tag {
  id?: number;
  code?: string;
  name: string;
  type: TagType;
  status: Status;
}
export interface AppConfig {
  id?: number;
  name: string;
  description?: string;
  type: string;
  version: string;
  config: string;
  status: Status;
}
export interface Workspace {
  id?: number;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  status: Status;
}
