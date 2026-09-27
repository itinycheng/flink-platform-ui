import type { FlowRunListParams } from "@/types/run";

export const queryKeys = {
  workspaces: ["session", "workspaces"] as const,
  options: (workspaceId: number | null, resource: string, deps: readonly unknown[]) =>
    ["workspace", workspaceId, "options", resource, ...deps] as const,
  adminList: (workspaceId: number | null, resource: string, params: object) =>
    ["workspace", workspaceId, "admin", resource, params] as const,
  resourcePath: (workspaceId: number | null, folderId?: number) =>
    ["workspace", workspaceId, "resources", "path", folderId ?? "root"] as const,
  definitions: {
    all: (workspaceId: number | null) => ["workspace", workspaceId, "definitions"] as const,
    root: (workspaceId: number | null) => ["workspace", workspaceId, "definitions", "root"] as const,
    children: (workspaceId: number | null, groupId: string) =>
      ["workspace", workspaceId, "definitions", "children", groupId] as const,
    search: (workspaceId: number | null, keyword: string, types: string[], statuses: string[]) =>
      ["workspace", workspaceId, "definitions", "search", keyword, types, statuses] as const,
    job: (workspaceId: number | null, id: string) => ["workspace", workspaceId, "definitions", "job", id] as const,
    flow: (workspaceId: number | null, id: string) => ["workspace", workspaceId, "definitions", "flow", id] as const,
    flowJobs: (workspaceId: number | null, flowId: string) =>
      ["workspace", workspaceId, "definitions", "flow", flowId, "jobs"] as const,
    cronPreview: (workspaceId: number | null, expression: string) =>
      ["workspace", workspaceId, "definitions", "cron-preview", expression] as const,
  },
  dashboard: (workspaceId: number | null) => ["workspace", workspaceId, "dashboard"] as const,
  runs: {
    list: (workspaceId: number | null, params: FlowRunListParams) =>
      ["workspace", workspaceId, "runs", "list", params] as const,
    detail: (workspaceId: number | null, runId: string | null) =>
      ["workspace", workspaceId, "runs", "detail", runId] as const,
    log: (workspaceId: number | null, jobRunId: string) => ["workspace", workspaceId, "runs", "log", jobRunId] as const,
  },
};
