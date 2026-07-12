export function getRoleOptions(t: (k: string) => string) {
  return [
    { label: t("user2.roleAdmin"), value: "admin" },
    { label: t("user2.roleDeveloper"), value: "developer" },
    { label: t("user2.roleViewer"), value: "viewer" },
  ];
}
