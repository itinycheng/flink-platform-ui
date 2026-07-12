import type { WorkspaceStatus } from "@/types/workspace";

export function getWorkspaceStatusOptions(t: (k: string) => string) {
  return [
    { label: t("workspace.statusActive"), value: "active" },
    { label: t("workspace.statusDisabled"), value: "disabled" },
  ];
}

export function getWorkspaceStatusLabels(t: (k: string) => string): Record<WorkspaceStatus, string> {
  return {
    active: t("workspace.statusActive"),
    disabled: t("workspace.statusDisabled"),
  };
}
