import type { ManagedUser } from "@/types/manage";

export const ROLE_OPTIONS = [
  { label: "管理员", value: "admin" },
  { label: "开发者", value: "developer" },
  { label: "查看者", value: "viewer" },
];

export const STATUS_CONFIG: Record<ManagedUser["status"], { color: string; text: string }> = {
  active: { color: "green", text: "启用" },
  disabled: { color: "red", text: "禁用" },
};
