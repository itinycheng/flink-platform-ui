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
 * which SHELL doesn't support). `subject` is always reset too — its content
 * (SQL text, a shell script, ...) is inherently type-specific, so even a
 * switch between two subject-bearing types (e.g. FLINK_SQL -> MYSQL_SQL)
 * must not carry the old text over.
 *
 * NB: this must be applied via `form.setFields` (which replaces the value at
 * each `name` path wholesale), NOT `form.setFieldsValue` (which deep-merges
 * nested objects and would therefore keep any `config.*` keys not explicitly
 * listed here, defeating the reset).
 */
export function typeChangeFields(nextType: JobType, prevExecMode?: string, prevDeployMode?: string): TypeChangeField[] {
  const isFlink = nextType === "FLINK_SQL" || nextType === "FLINK_JAR";
  const deployMode = isFlink
    ? prevDeployMode && prevDeployMode !== "RUN_LOCAL"
      ? prevDeployMode
      : "FLINK_YARN_PER"
    : "RUN_LOCAL";
  return [
    {
      name: "config",
      value: {
        type: nextType,
        retryTimes: 0,
        retryInterval: "5s",
        ...(nextType === "SHELL" ? { timeout: "60s" } : {}),
      },
    },
    { name: "execMode", value: isFlink ? prevExecMode : "BATCH" },
    { name: "deployMode", value: deployMode },
    { name: "subject", value: undefined },
  ];
}
