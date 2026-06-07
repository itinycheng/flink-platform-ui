import { http } from "@/utils/request";
import type { JobTreeNode, WorkflowFormData, WorkflowRunRecord } from "@/types/job";

/** 获取所有分组（不含子节点） */
export function getJobGroups(): Promise<JobTreeNode[]> {
  return http.get<JobTreeNode[]>("/jobs/groups");
}

/** 获取指定分组下的 Job 列表 */
export function getJobsByGroup(groupId: string): Promise<JobTreeNode[]> {
  return http.get<JobTreeNode[]>(`/jobs/groups/${groupId}/children`);
}

/** 搜索 Job（服务端，跨所有分组） */
export function searchJobs(params: { keyword?: string; types?: string[] }): Promise<JobTreeNode[]> {
  return http.get<JobTreeNode[]>("/jobs/search", { params });
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
