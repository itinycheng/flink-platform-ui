import { http } from "@/utils/request";
import type { Workspace } from "@/types/workspace";
import type { PaginatedResponse, PaginationParams, IPage } from "@/types/common";
import { ipageToPaginated, toPageParams } from "@/types/common";
import { adaptLegacyTimestamps, type LegacyTimestampFields } from "@/api/legacy/contracts";

/** Full list (unpaginated) for the header switcher. */
export function getAllWorkspaces(): Promise<Workspace[]> {
  return http
    .get<Array<Workspace & LegacyTimestampFields>>("/workspace/list")
    .then((rows) => rows.map(adaptLegacyTimestamps));
}

export function getWorkspaces(params?: PaginationParams): Promise<PaginatedResponse<Workspace>> {
  return http
    .get<IPage<Workspace & LegacyTimestampFields>>("/workspace/page", { params: toPageParams(params) })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptLegacyTimestamps) }));
}

export function createWorkspace(data: Omit<Workspace, "id" | "createdAt">): Promise<number> {
  return http.post<number>("/workspace/create", data);
}

export function updateWorkspace(id: number, data: Partial<Omit<Workspace, "id" | "createdAt">>): Promise<number> {
  return http.post<number>("/workspace/update", { ...data, id });
}

export function deleteWorkspace(id: number): Promise<boolean> {
  return http.get<boolean>(`/workspace/delete/${id}`);
}
