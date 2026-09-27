import type { ExecutionStatus, JobFlowType, JobType } from "@/constants/enums";
import type { UserRoles } from "@/types/entities";
import type { FlowRun, FlowRunDetail, FlowRunGraph, JobRun, RunLog } from "@/types/run";

/**
 * DTOs returned by the currently deployed (legacy) flink-platform-backend.
 *
 * Keep these shapes separate from the UI models. When the backend API is
 * modernised, only this boundary should need to change.
 */
export interface LegacyStatusCountDto {
  status: string;
  count: number | string;
}

export interface LegacyTimestampFields {
  createTime?: string;
  updateTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function adaptLegacyTimestamps<T extends LegacyTimestampFields>(row: T) {
  return {
    ...row,
    createdAt: row.createdAt ?? row.createTime ?? "",
    updatedAt: row.updatedAt ?? row.updateTime ?? row.createTime ?? "",
  };
}

export interface LegacyJobFlowDagDto {
  vertices?: Array<{ id: number; jobId: number; jobRunId?: number; jobRunStatus?: string }>;
  edges?: Array<{ fromVId: number; toVId: number; expectStatus?: string }>;
  nodeLayouts?: Record<string, { id?: string; type?: string; x?: number; y?: number }>;
}

export interface LegacyFlowRunDto {
  id: number | string;
  flowId: number | string;
  name: string;
  userId?: number | string;
  type: JobFlowType;
  status: string;
  startTime?: string;
  endTime?: string;
  duration?: string | number;
  tags?: string[];
  flow?: LegacyJobFlowDagDto;
}

export interface LegacyJobRunDto {
  id: number | string;
  jobId: number | string;
  flowRunId: number | string;
  name: string;
  type: JobType;
  status: string;
  submitTime?: string;
  endTime?: string;
  duration?: string | number;
  params?: Record<string, unknown> | string;
  backInfo?:
    | string
    | {
        trackingUrl?: string;
        errMsg?: string;
        message?: string;
        stdMsg?: string;
      };
}

const EXECUTION_STATUS_ALIASES: Record<string, ExecutionStatus> = {
  KILLABLE: "KILLING",
};

export function toExecutionStatus(value: string | undefined): ExecutionStatus {
  return EXECUTION_STATUS_ALIASES[value ?? ""] ?? (value as ExecutionStatus | undefined) ?? "CREATED";
}

/** Parse the backend's compact duration (for example `1h 3m 2s`) into seconds. */
export function durationSeconds(value: string | number | undefined, start?: string, end?: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    let seconds = 0;
    let matched = false;
    for (const match of value.matchAll(/(\d+)\s*(d|h|m|s)/gi)) {
      matched = true;
      const amount = Number(match[1]);
      const unit = match[2].toLowerCase();
      seconds += amount * ({ d: 86_400, h: 3_600, m: 60, s: 1 }[unit] ?? 0);
    }
    if (matched) return seconds;
  }
  if (start && end) {
    const elapsed = new Date(end).getTime() - new Date(start).getTime();
    if (Number.isFinite(elapsed) && elapsed > 0) return Math.round(elapsed / 1000);
  }
  return 0;
}

export function adaptFlowRun(dto: LegacyFlowRunDto): FlowRun {
  return {
    id: String(dto.id),
    flowId: String(dto.flowId),
    name: dto.name,
    type: dto.type,
    status: toExecutionStatus(dto.status),
    startTime: dto.startTime ?? "",
    endTime: dto.endTime,
    duration: durationSeconds(dto.duration, dto.startTime, dto.endTime),
    submitter: dto.userId == null ? "-" : String(dto.userId),
    tags: dto.tags,
  };
}

function parseBackInfo(value: LegacyJobRunDto["backInfo"]): Exclude<LegacyJobRunDto["backInfo"], string | undefined> {
  if (!value) return {};
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as Exclude<LegacyJobRunDto["backInfo"], string | undefined>;
  } catch {
    return { stdMsg: value };
  }
}

export function adaptJobRun(dto: LegacyJobRunDto): JobRun {
  const backInfo = parseBackInfo(dto.backInfo);
  return {
    id: String(dto.id),
    flowRunId: String(dto.flowRunId),
    jobId: String(dto.jobId),
    name: dto.name,
    type: dto.type,
    status: toExecutionStatus(dto.status),
    startTime: dto.submitTime ?? "",
    endTime: dto.endTime,
    duration: durationSeconds(dto.duration, dto.submitTime, dto.endTime),
    params: typeof dto.params === "string" ? dto.params : JSON.stringify(dto.params ?? {}, null, 2),
    trackingUrl: backInfo.trackingUrl,
  };
}

function adaptRunGraph(flow: LegacyJobFlowDagDto | undefined, jobs: JobRun[]): FlowRunGraph {
  const jobByJobId = new Map(jobs.map((job) => [job.jobId, job]));
  const vertexToNode = new Map<string, string>();
  const layouts = flow?.nodeLayouts ?? {};
  const toNode = (vertex: NonNullable<LegacyJobFlowDagDto["vertices"]>[number], index: number) => {
    const job = jobByJobId.get(String(vertex.jobId));
    const id = job ? job.id : `job-${vertex.jobId}`;
    vertexToNode.set(String(vertex.id), id);
    const layout = layouts[String(vertex.id)] ?? {};
    return {
      id,
      label: job ? job.name : `Job ${vertex.jobId}`,
      type: job ? job.type : ("SHELL" as const),
      x: typeof layout.x === "number" ? layout.x : 80 + (index % 4) * 180,
      y: typeof layout.y === "number" ? layout.y : 80 + Math.floor(index / 4) * 120,
      status: job ? job.status : toExecutionStatus(vertex.jobRunStatus),
    };
  };
  const nodes = (flow?.vertices ?? []).map(toNode);

  return {
    nodes,
    edges: (flow?.edges ?? []).flatMap((edge) => {
      const source = vertexToNode.get(String(edge.fromVId));
      const target = vertexToNode.get(String(edge.toVId));
      return source && target ? [{ source, target }] : [];
    }),
  };
}

export function adaptFlowRunDetail(dto: LegacyFlowRunDto, jobDtos: LegacyJobRunDto[]): FlowRunDetail {
  const nodes = jobDtos.map(adaptJobRun);
  return { ...adaptFlowRun(dto), graph: adaptRunGraph(dto.flow, nodes), nodes };
}

export function adaptRunLog(dto: LegacyJobRunDto): RunLog {
  const backInfo = parseBackInfo(dto.backInfo);
  const content = [backInfo.errMsg, backInfo.message, backInfo.stdMsg].filter(Boolean).join("\n");
  return { id: String(dto.id), content };
}

/** `/user/info` in the legacy backend still returns Vue-era role labels. */
export function adaptUserRoles(roles: UserRoles | string[] | undefined): UserRoles {
  if (!Array.isArray(roles)) return roles ?? {};
  // The legacy endpoint returns the same coarse labels for every account, so
  // never infer SYSTEM_MANAGE/SUPER_ADMIN privileges from them. The backend
  // remains authoritative for every operation.
  return roles.includes("admin") ? { global: "ADMIN", workspaces: {} } : { global: "VIEWER", workspaces: {} };
}
