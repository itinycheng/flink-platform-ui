import { describe, it, expect } from "vitest";
import { TASK_TYPE_REGISTRY, getTaskTypeDef, taskTypeOptions } from "./registry";

describe("task type registry (backend JobType)", () => {
  it("has an entry for every backend JobType", () => {
    for (const t of [
      "FLINK_SQL",
      "FLINK_JAR",
      "COMMON_JAR",
      "CLICKHOUSE_SQL",
      "MYSQL_SQL",
      "HIVE_SQL",
      "SHELL",
      "CONDITION",
      "DEPENDENT",
      "SUB_FLOW",
    ] as const) {
      expect(getTaskTypeDef(t)).toBeDefined();
      expect(TASK_TYPE_REGISTRY[t].type).toBe(t);
    }
  });

  it("marks subject requirement correctly", () => {
    expect(getTaskTypeDef("MYSQL_SQL")!.needsSubject).toBe(true);
    expect(getTaskTypeDef("SHELL")!.needsSubject).toBe(true);
    expect(getTaskTypeDef("CONDITION")!.needsSubject).toBe(false);
    expect(getTaskTypeDef("DEPENDENT")!.needsSubject).toBe(false);
    expect(getTaskTypeDef("SUB_FLOW")!.needsSubject).toBe(false);
  });

  it("taskTypeOptions returns all 10 in enum order with i18n labels", () => {
    const opts = taskTypeOptions((k: string) => k);
    expect(opts).toHaveLength(10);
    expect(opts[0]).toEqual({ value: "FLINK_SQL", label: "enums.JobType.FLINK_SQL" });
  });
});
