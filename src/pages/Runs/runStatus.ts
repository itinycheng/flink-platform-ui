import type { TFunction } from "i18next";
import { EXECUTION_STATUSES, type ExecutionStatus } from "@/constants/enums";
import { statusColor } from "@/utils/statusColor";

/** Format a duration given in seconds as a human-readable string. */
export function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export type RunSemantic = "success" | "failed" | "running" | "killed" | "waiting";

/** Map a backend `ExecutionStatus` to the app's semantic status bucket. */
export function execStatusSemantic(s: ExecutionStatus): RunSemantic {
  switch (s) {
    case "SUBMITTED":
    case "CREATED":
      return "waiting";
    case "RUNNING":
    case "KILLABLE":
      return "running";
    case "SUCCESS":
      return "success";
    case "KILLED":
      return "killed";
    case "FAILURE":
    case "ERROR":
    case "ABNORMAL":
    case "EXPECTED_FAILURE":
    case "NOT_EXIST":
      return "failed";
  }
}

export function getExecStatusColor(s: ExecutionStatus): string {
  return statusColor(execStatusSemantic(s));
}

export function getExecStatusOptions(t: TFunction) {
  return EXECUTION_STATUSES.map((value) => ({ value, label: t(`enums.ExecutionStatus.${value}`) }));
}

export const execIsRunning = (s: ExecutionStatus): boolean =>
  s === "SUBMITTED" || s === "RUNNING" || s === "KILLABLE" || s === "CREATED";
