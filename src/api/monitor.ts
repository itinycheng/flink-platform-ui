import request from "./request";
import type { AlertPolicy, SystemMetric } from "@/types/monitor";
import type { PaginatedResponse, PaginationParams } from "@/types/common";

// ---- Alert Policies ----

export function getAlerts(
  params?: PaginationParams,
): Promise<PaginatedResponse<AlertPolicy>> {
  return request
    .get<PaginatedResponse<AlertPolicy>>("/alerts", { params })
    .then((res) => res.data);
}

export function createAlert(
  data: Omit<AlertPolicy, "id">,
): Promise<AlertPolicy> {
  return request.post<AlertPolicy>("/alerts", data).then((res) => res.data);
}

export function updateAlert(
  id: string,
  data: Partial<Omit<AlertPolicy, "id">>,
): Promise<AlertPolicy> {
  return request
    .put<AlertPolicy>(`/alerts/${id}`, data)
    .then((res) => res.data);
}

// ---- System Metrics ----

export function getMetrics(): Promise<SystemMetric[]> {
  return request.get<SystemMetric[]>("/metrics").then((res) => res.data);
}
