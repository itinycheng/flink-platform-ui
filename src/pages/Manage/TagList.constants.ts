import type { TagStatus } from "@/types/manage";

export function getTagTypeOptions(t: (k: string) => string) {
  return [
    { label: t("tag.typeBusiness"), value: "business" },
    { label: t("tag.typeSystem"), value: "system" },
    { label: t("tag.typeCustom"), value: "custom" },
  ];
}

export function getTagStatusOptions(t: (k: string) => string) {
  return [
    { label: t("tag.statusActive"), value: "active" },
    { label: t("tag.statusDisabled"), value: "disabled" },
  ];
}

export const TYPE_LABEL_KEYS: Record<string, string> = {
  business: "tag.typeBusiness",
  system: "tag.typeSystem",
  custom: "tag.typeCustom",
};

export const STATUS_LABEL_KEYS: Record<TagStatus, string> = {
  active: "tag.statusActive",
  disabled: "tag.statusDisabled",
};
