import { http } from "@/utils/request";
import type { Workspace } from "@/types/workspace";
import type { PaginatedResponse, PaginationParams } from "@/types/common";

/** Full list (unpaginated) for the header switcher. */
export function getAllWorkspaces(): Promise<Workspace[]> {
  return http.get<Workspace[]>("/workspaces/all");
}

export function getWorkspaces(params?: PaginationParams): Promise<PaginatedResponse<Workspace>> {
  return http.get<PaginatedResponse<Workspace>>("/workspaces", { params });
}

export function createWorkspace(data: Omit<Workspace, "id" | "createdAt">): Promise<Workspace> {
  return http.post<Workspace>("/workspaces", data);
}

export function updateWorkspace(
  id: string,
  data: Partial<Omit<Workspace, "id" | "createdAt">>,
): Promise<Workspace> {
  return http.put<Workspace>(`/workspaces/${id}`, data);
}

export function deleteWorkspace(id: string): Promise<void> {
  return http.delete(`/workspaces/${id}`);
}
