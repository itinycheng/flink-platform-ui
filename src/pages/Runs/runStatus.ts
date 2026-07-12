import type { TFunction } from "i18next";
import type { RunStatus } from "@/types/run";
import { statusColor } from "@/utils/statusColor";

export const STATUS_CONFIG: Record<RunStatus, { color: string }> = {
  waiting: { color: statusColor("waiting") },
  running: { color: statusColor("running") },
  success: { color: statusColor("success") },
  failed: { color: statusColor("failed") },
  killed: { color: statusColor("killed") },
};

export const RUN_STATUS_LABEL_KEYS: Record<RunStatus, string> = {
  waiting: "runs.statusWaiting",
  running: "runs.statusRunning",
  success: "runs.statusSuccess",
  failed: "runs.statusFailed",
  killed: "runs.statusKilled",
};

export function getRunStatusOptions(t: TFunction) {
  return (Object.keys(STATUS_CONFIG) as RunStatus[]).map((value) => ({
    label: t(RUN_STATUS_LABEL_KEYS[value]),
    value,
  }));
}

/** Format a duration given in seconds as a human-readable string. */
export function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export const isRunning = (status: RunStatus): boolean => status === "running" || status === "waiting";
