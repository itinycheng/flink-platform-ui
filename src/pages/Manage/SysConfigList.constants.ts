import type { SysConfigStatus, SysConfigType } from "@/types/manage";

export function getSysConfigTypeOptions(
  t: (k: string) => string,
): { label: string; value: SysConfigType }[] {
  return [
    { label: t("sysConfig.typeHadoop"), value: "HADOOP_CONFIG" },
    { label: t("sysConfig.typeFlink"), value: "FLINK_CONFIG" },
    { label: t("sysConfig.typeHive"), value: "HIVE_CONFIG" },
    { label: t("sysConfig.typeSpark"), value: "SPARK_CONFIG" },
  ];
}

// Only online/offline are user-selectable; `deleted` is set by the backend soft-delete.
export function getSysConfigStatusOptions(
  t: (k: string) => string,
): { label: string; value: Exclude<SysConfigStatus, "deleted"> }[] {
  return [
    { label: t("sysConfig.statusOnline"), value: "online" },
    { label: t("sysConfig.statusOffline"), value: "offline" },
  ];
}

export const TYPE_LABEL_KEYS: Record<SysConfigType, string> = {
  HADOOP_CONFIG: "sysConfig.typeHadoop",
  FLINK_CONFIG: "sysConfig.typeFlink",
  HIVE_CONFIG: "sysConfig.typeHive",
  SPARK_CONFIG: "sysConfig.typeSpark",
};

export const STATUS_LABEL_KEYS: Record<SysConfigStatus, string> = {
  online: "sysConfig.statusOnline",
  offline: "sysConfig.statusOffline",
  deleted: "sysConfig.statusDeleted",
};
