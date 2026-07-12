export function getWorkerRoleOptions(t: (k: string) => string) {
  return [
    { label: t("worker.roleMaster"), value: "master" },
    { label: t("worker.roleWorker"), value: "worker" },
    { label: t("worker.roleAll"), value: "all" },
  ];
}

export function getWorkerStatusOptions(t: (k: string) => string) {
  return [
    { label: t("worker.statusOnline"), value: "online" },
    { label: t("worker.statusOffline"), value: "offline" },
  ];
}
