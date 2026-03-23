import request from "./request";

export interface DashboardStats {
  totalTasks: number;
  successTasks: number;
  failedTasks: number;
  runningTasks: number;
}

export interface TrendDataPoint {
  date: string;
  success: number;
  failed: number;
  running: number;
}

export function getStats(): Promise<DashboardStats> {
  return request.get<DashboardStats>("/dashboard/stats").then((res) => res.data);
}

export function getTrend(range: string): Promise<TrendDataPoint[]> {
  return request
    .get<TrendDataPoint[]>("/dashboard/trend", { params: { range } })
    .then((res) => res.data);
}
