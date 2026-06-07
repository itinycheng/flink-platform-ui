export interface CronValidationResult {
  valid: boolean;
  error?: string;
  nextRuns?: string[];
}

/** Field definitions with name, min, and max values. */
export interface FieldDef {
  name: string;
  min: number;
  max: number;
}

export const FIVE_FIELD_DEFS: FieldDef[] = [
  { name: "分钟", min: 0, max: 59 },
  { name: "小时", min: 0, max: 23 },
  { name: "日", min: 1, max: 31 },
  { name: "月", min: 1, max: 12 },
  { name: "星期", min: 0, max: 7 },
];

export const SIX_FIELD_DEFS: FieldDef[] = [{ name: "秒", min: 0, max: 59 }, ...FIVE_FIELD_DEFS];
