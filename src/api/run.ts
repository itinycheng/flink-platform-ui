import { http } from "@/utils/request";
import type { RunLog, FlowRun, FlowRunDetail, FlowRunListParams } from "@/types/run";
import { ipageToPaginated, toPageParams, type IPage, type PaginatedResponse } from "@/types/common";

/** Unified list of top-level runs (single-task + composite flow) from `/jobFlowRun/page`. */
export function getFlowRuns(params: FlowRunListParams): Promise<PaginatedResponse<FlowRun>> {
  const { page, pageSize, ...rest } = params;
  return http
    .get<IPage<FlowRun>>("/jobFlowRun/page", { params: { ...toPageParams({ page, pageSize }), ...rest } })
    .then(ipageToPaginated);
}

/** Full detail for one flow run, including the graph + node runs. */
export function getFlowRunDetail(id: string): Promise<FlowRunDetail> {
  return http.get<FlowRunDetail>(`/jobFlowRun/get/${id}`);
}

export function killFlowRun(id: string): Promise<FlowRun> {
  return http.post<FlowRun>(`/jobFlowRun/kill/${id}`);
}

/** Log for a single node-level job run. */
export function getJobRunLog(jobRunId: string): Promise<RunLog> {
  return http.get<RunLog>(`/jobRun/log/${jobRunId}`);
}
