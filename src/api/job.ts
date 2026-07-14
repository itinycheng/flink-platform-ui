import { http } from "@/utils/request";
import type { JobTreeNode, WorkflowFormData, WorkflowRunRecord, WorkflowLifecycleStatus } from "@/types/job";

/** 获取所有分组（不含子节点） */
export function getJobGroups(): Promise<JobTreeNode[]> {
  return http.get<JobTreeNode[]>("/jobs/groups");
}

/** 获取指定分组下的 Job 列表 */
export function getJobsByGroup(groupId: string): Promise<JobTreeNode[]> {
  return http.get<JobTreeNode[]>(`/jobs/groups/${groupId}/children`);
}

/** 搜索 Job（服务端，跨所有分组）。数组参数拼成逗号串，避免 axios 默认的 `key[]=` 序列化。 */
export function searchJobs(params: { keyword?: string; types?: string[]; statuses?: string[] }): Promise<JobTreeNode[]> {
  return http.get<JobTreeNode[]>("/jobs/search", {
    params: {
      keyword: params.keyword || undefined,
      types: params.types?.length ? params.types.join(",") : undefined,
      statuses: params.statuses?.length ? params.statuses.join(",") : undefined,
    },
  });
}

export function getWorkflowTree(): Promise<JobTreeNode[]> {
  return http.get<JobTreeNode[]>("/workflows/tree");
}

export function getWorkflowDetail(id: string): Promise<WorkflowFormData> {
  return http.get<WorkflowFormData>(`/workflows/${id}`);
}

export function createWorkflow(data: WorkflowFormData): Promise<WorkflowFormData> {
  return http.post<WorkflowFormData>("/workflows", data);
}

export function updateWorkflow(id: string, data: WorkflowFormData): Promise<WorkflowFormData> {
  return http.put<WorkflowFormData>(`/workflows/${id}`, data);
}

export function deleteWorkflow(id: string): Promise<void> {
  return http.delete(`/workflows/${id}`);
}

export function getWorkflowRuns(id: string): Promise<WorkflowRunRecord[]> {
  return http.get<WorkflowRunRecord[]>(`/workflows/${id}/runs`);
}

// ---- Definition lifecycle (Task & Workflow nodes) ----

/** Trigger a single immediate run of a definition. */
export function runJobOnce(id: string): Promise<{ flowRunId: string }> {
  return http.post<{ flowRunId: string }>(`/jobs/${id}/run-once`);
}

/** Transition lifecycle status (online/offline, start/stop scheduling). */
export function setJobStatus(id: string, status: WorkflowLifecycleStatus): Promise<JobTreeNode> {
  return http.put<JobTreeNode>(`/jobs/${id}/status`, { status });
}

/** Duplicate a definition into the same group. */
export function copyJob(id: string): Promise<JobTreeNode> {
  return http.post<JobTreeNode>(`/jobs/${id}/copy`);
}

export function updateJobTags(id: string, tags: string[]): Promise<JobTreeNode> {
  return http.put<JobTreeNode>(`/jobs/${id}/tags`, { tags });
}

export function updateJobAlertRules(id: string, alertRuleIds: string[]): Promise<JobTreeNode> {
  return http.put<JobTreeNode>(`/jobs/${id}/alert-rules`, { alertRuleIds });
}
