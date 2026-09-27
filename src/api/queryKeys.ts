import type { FlowRunListParams } from "@/types/run";

export const queryKeys = {
  workspaces: ["session", "workspaces"] as const,
  options: (workspaceId: number | null, resource: string, deps: readonly unknown[]) =>
    ["workspace", workspaceId, "options", resource, ...deps] as const,
  dashboard: (workspaceId: number | null) => ["workspace", workspaceId, "dashboard"] as const,
  runs: {
    list: (workspaceId: number | null, params: FlowRunListParams) =>
      ["workspace", workspaceId, "runs", "list", params] as const,
    detail: (workspaceId: number | null, runId: string | null) =>
      ["workspace", workspaceId, "runs", "detail", runId] as const,
    log: (workspaceId: number | null, jobRunId: string) => ["workspace", workspaceId, "runs", "log", jobRunId] as const,
  },
};
