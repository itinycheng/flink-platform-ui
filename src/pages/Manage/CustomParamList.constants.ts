import type { CustomParam } from "@/types/manage";

export const PARAM_TYPE_OPTIONS = [
  { label: "字符串", value: "string" },
  { label: "数字", value: "number" },
  { label: "布尔值", value: "boolean" },
  { label: "JSON", value: "json" },
];

export const TYPE_TAG_COLORS: Record<CustomParam["type"], string> = {
  string: "blue",
  number: "green",
  boolean: "orange",
  json: "purple",
};
