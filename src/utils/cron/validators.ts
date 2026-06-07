import { type CronValidationResult, type FieldDef, FIVE_FIELD_DEFS, SIX_FIELD_DEFS } from "./types";
import { getNextRuns } from "./parser";

function validateValue(value: number, field: FieldDef): string | null {
  if (!Number.isInteger(value)) return `${field.name}字段值必须为整数`;
  if (value < field.min || value > field.max) return `${field.name}字段值 ${value} 超出范围 ${field.min}-${field.max}`;
  return null;
}

function validateList(token: string, field: FieldDef): string | null {
  for (const part of token.split(",")) {
    if (part === "") return `${field.name}字段包含空的列表项`;
    const err = validateField(part, field);
    if (err) return err;
  }
  return null;
}

function validateStep(token: string, field: FieldDef): string | null {
  const parts = token.split("/");
  if (parts.length !== 2) return `${field.name}字段步长格式无效: ${token}`;
  const [base, stepStr] = parts;
  if (stepStr === "" || !/^\d+$/.test(stepStr)) return `${field.name}字段步长值无效: ${token}`;
  const step = Number(stepStr);
  if (step === 0) return `${field.name}字段步长值不能为 0`;
  if (step < 1) return `${field.name}字段步长值必须为正整数`;
  return base === "*" ? null : validateField(base, field);
}

function validateRange(token: string, field: FieldDef): string | null {
  const parts = token.split("-");
  if (parts.length !== 2) return `${field.name}字段范围格式无效: ${token}`;
  const [startStr, endStr] = parts;
  if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) return `${field.name}字段范围值必须为数字: ${token}`;
  const start = Number(startStr);
  const end = Number(endStr);
  const startErr = validateValue(start, field);
  if (startErr) return startErr;
  const endErr = validateValue(end, field);
  if (endErr) return endErr;
  if (start > end) return `${field.name}字段范围起始值 ${start} 大于结束值 ${end}`;
  return null;
}

function validateNumber(token: string, field: FieldDef): string | null {
  if (!/^\d+$/.test(token)) return `${field.name}字段包含无效字符: ${token}`;
  return validateValue(Number(token), field);
}

/** Validate a single cron field (e.g., "*\/5", "1-10/2", "1,3,5", "*", "5"). */
export function validateField(token: string, field: FieldDef): string | null {
  if (token === "*") return null;
  if (token.includes(",")) return validateList(token, field);
  if (token.includes("/")) return validateStep(token, field);
  if (token.includes("-")) return validateRange(token, field);
  return validateNumber(token, field);
}

/**
 * Validate a cron expression string. Supports 5-field
 * (minute hour dom month dow) and 6-field (second minute hour dom month dow)
 * formats. On success, includes the next 5 run times.
 */
export function validateCron(expression: string): CronValidationResult {
  if (typeof expression !== "string") return { valid: false, error: "Cron 表达式必须为字符串" };

  const trimmed = expression.trim();
  if (trimmed === "") return { valid: false, error: "Cron 表达式不能为空" };

  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5 && fields.length !== 6) {
    return { valid: false, error: `Cron 表达式格式错误: 期望 5 或 6 个字段，实际为 ${fields.length} 个字段` };
  }

  const fieldDefs = fields.length === 5 ? FIVE_FIELD_DEFS : SIX_FIELD_DEFS;
  for (let i = 0; i < fields.length; i++) {
    const error = validateField(fields[i], fieldDefs[i]);
    if (error) return { valid: false, error };
  }

  try {
    return { valid: true, nextRuns: getNextRuns(expression, 5) };
  } catch {
    return { valid: true };
  }
}
