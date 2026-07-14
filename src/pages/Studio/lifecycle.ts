import type { WorkflowLifecycleStatus } from "@/types/job";

/** Concrete dot colors for the lifecycle status indicator on definition nodes. */
export const LIFECYCLE_DOT_COLOR: Record<WorkflowLifecycleStatus, string> = {
  OFFLINE: "#bfbfbf",
  ONLINE: "#1677ff",
  SCHEDULING: "#52c41a",
  DELETE: "#ff4d4f",
};

/** i18n key for each lifecycle status label (reuses the definitions.* namespace). */
export const LIFECYCLE_LABEL_KEY: Record<WorkflowLifecycleStatus, string> = {
  OFFLINE: "definitions.statusOffline",
  ONLINE: "definitions.statusOnline",
  SCHEDULING: "definitions.statusScheduling",
  DELETE: "definitions.statusDelete",
};
