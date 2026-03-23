import request from "./request";
import type { JobTreeNode, WorkflowFormData, WorkflowRunRecord } from "@/types/job";

/** 获取所有分组（不含子节点） */
export function getJobGroups(): Promise<JobTreeNode[]> {
  return request.get<JobTreeNode[]>("/jobs/groups").then((res) => res.data);
}

/** 获取指定分组下的 Job 列表 */
export function getJobsByGroup(groupId: string): Promise<JobTreeNode[]> {
  return request.get<JobTreeNode[]>(`/jobs/groups/${groupId}/children`).then((res) => res.data);
}

/** 搜索 Job（服务端，跨所有分组） */
export function searchJobs(params: { keyword?: string; types?: string[] }): Promise<JobTreeNode[]> {
  return request.get<JobTreeNode[]>("/jobs/search", { params }).then((res) => res.data);
}

export function getWorkflowTree(): Promise<JobTreeNode[]> {
  return request.get<JobTreeNode[]>("/workflows/tree").then((res) => res.data);
}

export function getWorkflowDetail(id: string): Promise<WorkflowFormData> {
  return request.get<WorkflowFormData>(`/workflows/${id}`).then((res) => res.data);
}

export function createWorkflow(data: WorkflowFormData): Promise<WorkflowFormData> {
  return request.post<WorkflowFormData>("/workflows", data).then((res) => res.data);
}

export function updateWorkflow(id: string, data: WorkflowFormData): Promise<WorkflowFormData> {
  return request.put<WorkflowFormData>(`/workflows/${id}`, data).then((res) => res.data);
}

export function deleteWorkflow(id: string): Promise<void> {
  return request.delete(`/workflows/${id}`).then(() => undefined);
}

export function getWorkflowRuns(id: string): Promise<WorkflowRunRecord[]> {
  return request.get<WorkflowRunRecord[]>(`/workflows/${id}/runs`).then((res) => res.data);
}
