import { http } from "@/utils/request";
import type { FlowRun, JobRun, RunListParams, RunLog } from "@/types/run";
import type { PaginatedResponse } from "@/types/common";

// ---- Workflow Instances (Flow Runs) ----

export function getFlowRuns(params: RunListParams): Promise<PaginatedResponse<FlowRun>> {
  return http.get<PaginatedResponse<FlowRun>>("/flow-runs", { params });
}

export function killFlowRun(id: string): Promise<FlowRun> {
  return http.post<FlowRun>(`/flow-runs/${id}/kill`);
}

export function getFlowRunLog(id: string): Promise<RunLog> {
  return http.get<RunLog>(`/flow-runs/${id}/log`);
}

// ---- Job Run Records ----

export function getJobRuns(params: RunListParams): Promise<PaginatedResponse<JobRun>> {
  return http.get<PaginatedResponse<JobRun>>("/job-runs", { params });
}

export function killJobRun(id: string): Promise<JobRun> {
  return http.post<JobRun>(`/job-runs/${id}/kill`);
}

export function getJobRunLog(id: string): Promise<RunLog> {
  return http.get<RunLog>(`/job-runs/${id}/log`);
}
