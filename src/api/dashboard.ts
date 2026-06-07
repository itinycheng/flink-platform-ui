import { http } from "@/utils/request";

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
  return http.get<DashboardStats>("/dashboard/stats");
}

export function getTrend(range: string): Promise<TrendDataPoint[]> {
  return http.get<TrendDataPoint[]>("/dashboard/trend", { params: { range } });
}
