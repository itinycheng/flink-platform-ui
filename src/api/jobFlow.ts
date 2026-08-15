import { http } from "@/utils/request";
import type { JobFlow, ExecutionConfig } from "@/types/entities";

/** Fetch a workflow definition by id. */
export function getJobFlow(id: string | number): Promise<JobFlow> {
  return http.get<JobFlow>(`/jobFlow/get/${id}`);
}

/** Create a workflow; the backend returns the new id (not the entity). */
export function createJobFlow(data: JobFlow): Promise<number> {
  return http.post<number>("/jobFlow/create", data);
}

/** Update a workflow's settings; returns its id. */
export function updateJobFlow(data: JobFlow): Promise<number> {
  return http.post<number>("/jobFlow/update", data);
}

/** Duplicate a workflow; returns the new id. */
export function copyJobFlow(id: string | number): Promise<number> {
  return http.get<number>(`/jobFlow/copy/${id}`);
}

/** Start scheduling (ONLINE → SCHEDULING). */
export function startSchedule(id: string | number): Promise<number> {
  return http.get<number>(`/jobFlow/schedule/start/${id}`);
}

/** Stop scheduling (SCHEDULING → ONLINE). */
export function stopSchedule(id: string | number): Promise<number> {
  return http.get<number>(`/jobFlow/schedule/stop/${id}`);
}

/** Trigger one immediate flow run; returns the flow-run id. Optional config overrides (e.g. backfill scheduleTime). */
export function runFlowOnce(id: string | number, config?: ExecutionConfig): Promise<number> {
  return http.post<number>(`/jobFlow/schedule/runOnce/${id}`, config ?? {});
}
