import { http } from "@/utils/request";
import type { AlertPolicy, SystemMetric } from "@/types/monitor";
import type { PaginatedResponse, PaginationParams } from "@/types/common";

// ---- Alert Policies ----

export function getAlerts(params?: PaginationParams): Promise<PaginatedResponse<AlertPolicy>> {
  return http.get<PaginatedResponse<AlertPolicy>>("/alerts", { params });
}

export function createAlert(data: Omit<AlertPolicy, "id">): Promise<AlertPolicy> {
  return http.post<AlertPolicy>("/alerts", data);
}

export function updateAlert(id: string, data: Partial<Omit<AlertPolicy, "id">>): Promise<AlertPolicy> {
  return http.put<AlertPolicy>(`/alerts/${id}`, data);
}

// ---- System Metrics ----

export function getMetrics(): Promise<SystemMetric[]> {
  return http.get<SystemMetric[]>("/metrics");
}
