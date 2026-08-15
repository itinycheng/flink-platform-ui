import { http } from "@/utils/request";
import type { JobTreeNode, WorkflowRunRecord } from "@/types/job";
import type { JobInfo } from "@/types/entities";

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

export function getWorkflowRuns(id: string): Promise<WorkflowRunRecord[]> {
  return http.get<WorkflowRunRecord[]>(`/workflows/${id}/runs`);
}

// ---- Definition lifecycle (Task & Workflow nodes) ----

export function updateJobTags(id: string, tags: string[]): Promise<JobTreeNode> {
  return http.put<JobTreeNode>(`/jobs/${id}/tags`, { tags });
}

export function updateJobAlertRules(id: string, alertRuleIds: string[]): Promise<JobTreeNode> {
  return http.put<JobTreeNode>(`/jobs/${id}/alert-rules`, { alertRuleIds });
}

// ---- JobInfo (backend-shaped task entity) ----

export function getJobInfo(id: string | number): Promise<JobInfo> {
  return http.get<JobInfo>(`/jobInfo/get/${id}`);
}

export function createJobInfo(data: JobInfo): Promise<JobInfo> {
  return http.post<JobInfo>("/jobInfo/create", data);
}

export function updateJobInfo(data: JobInfo): Promise<JobInfo> {
  return http.post<JobInfo>("/jobInfo/update", data);
}
