import { http } from "@/utils/request";
import type { AlertRule } from "@/types/alert";
import type { PaginatedResponse, PaginationParams } from "@/types/common";

export function getAlertRules(params?: PaginationParams): Promise<PaginatedResponse<AlertRule>> {
  return http.get<PaginatedResponse<AlertRule>>("/alert-rules", { params });
}

/** Full list (unpaginated) for binding selectors. */
export function getAllAlertRules(): Promise<AlertRule[]> {
  return http.get<AlertRule[]>("/alert-rules/all");
}

export function createAlertRule(
  data: Omit<AlertRule, "id" | "createdAt" | "updatedAt">,
): Promise<AlertRule> {
  return http.post<AlertRule>("/alert-rules", data);
}

export function updateAlertRule(
  id: string,
  data: Partial<Omit<AlertRule, "id" | "createdAt" | "updatedAt">>,
): Promise<AlertRule> {
  return http.put<AlertRule>(`/alert-rules/${id}`, data);
}

export function deleteAlertRule(id: string): Promise<void> {
  return http.delete(`/alert-rules/${id}`);
}
