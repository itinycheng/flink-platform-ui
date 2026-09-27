import { http } from "@/utils/request";
import type { AlertRule } from "@/types/alert";
import type { PaginatedResponse, PaginationParams, IPage } from "@/types/common";
import { ipageToPaginated, toPageParams } from "@/types/common";
import { adaptLegacyTimestamps, type LegacyTimestampFields } from "@/api/legacy/contracts";

export function getAlertRules(params?: PaginationParams): Promise<PaginatedResponse<AlertRule>> {
  return http
    .get<IPage<AlertRule & LegacyTimestampFields>>("/alert/page", { params: toPageParams(params) })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptLegacyTimestamps) }));
}

/** Full list (unpaginated) for binding selectors. */
export function getAllAlertRules(): Promise<AlertRule[]> {
  return http.get<AlertRule[]>("/alert/list");
}

export function createAlertRule(data: Omit<AlertRule, "id" | "createdAt" | "updatedAt">): Promise<number> {
  return http.post<number>("/alert/create", data);
}

export function updateAlertRule(
  id: number,
  data: Partial<Omit<AlertRule, "id" | "createdAt" | "updatedAt">>,
): Promise<number> {
  return http.post<number>("/alert/update", { ...data, id });
}

export function deleteAlertRule(id: number): Promise<boolean> {
  return http.get<boolean>(`/alert/delete/${id}`);
}
