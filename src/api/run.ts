import { http } from "@/utils/request";
import type { Run, RunDetail, RunListParams, RunLog } from "@/types/run";
import type { PaginatedResponse } from "@/types/common";

/** Unified list of top-level runs (flow + atomic). */
export function getRuns(params: RunListParams): Promise<PaginatedResponse<Run>> {
  return http.get<PaginatedResponse<Run>>("/runs", { params });
}

/** Full detail for one run, including the flow graph + node runs when type=flow. */
export function getRunDetail(id: string): Promise<RunDetail> {
  return http.get<RunDetail>(`/runs/${id}`);
}

export function killRun(id: string): Promise<Run> {
  return http.post<Run>(`/runs/${id}/kill`);
}

/** Log for a run, or a single flow node when `nodeId` is given. */
export function getRunLog(id: string, nodeId?: string): Promise<RunLog> {
  return http.get<RunLog>(`/runs/${id}/log`, { params: nodeId ? { node: nodeId } : undefined });
}
