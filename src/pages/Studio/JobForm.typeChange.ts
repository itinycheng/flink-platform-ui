import { getTaskTypeDef } from "@/pages/Studio/tasks/registry";
import type { JobType } from "@/constants/enums";

export interface TypeChangeField {
  name: string | string[];
  value: unknown;
}

/**
 * Pure computation of the fields reset when the user switches `type`.
 * Ant's `Form` defaults to `preserve: true`, so previous type's `config.*`
 * (e.g. a stale `dsId`), `subject`, and `execMode` would otherwise silently
 * survive the switch and leak into the saved payload (e.g. MYSQL_SQL -> SHELL
 * keeping `config.dsId`, or FLINK_SQL -> SHELL keeping `execMode: "STREAMING"`,
 * which SHELL doesn't support).
 *
 * NB: this must be applied via `form.setFields` (which replaces the value at
 * each `name` path wholesale), NOT `form.setFieldsValue` (which deep-merges
 * nested objects and would therefore keep any `config.*` keys not explicitly
 * listed here, defeating the reset).
 */
export function typeChangeFields(nextType: JobType, prevExecMode?: string): TypeChangeField[] {
  const nextDef = getTaskTypeDef(nextType);
  const fields: TypeChangeField[] = [
    {
      name: "config",
      value: {
        type: nextType,
        retryTimes: 0,
        retryInterval: "5s",
        ...(nextType === "SHELL" ? { timeout: "60s" } : {}),
      },
    },
    { name: "execMode", value: nextType === "FLINK_SQL" || nextType === "FLINK_JAR" ? prevExecMode : "BATCH" },
  ];
  if (nextDef && !nextDef.needsSubject) {
    fields.push({ name: "subject", value: undefined });
  }
  return fields;
}
