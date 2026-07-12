export function getParamTypeOptions(t: (k: string) => string) {
  return [
    { label: t("param.typeString"), value: "string" },
    { label: t("param.typeNumber"), value: "number" },
    { label: t("param.typeBoolean"), value: "boolean" },
    { label: t("param.typeJson"), value: "json" },
  ];
}
