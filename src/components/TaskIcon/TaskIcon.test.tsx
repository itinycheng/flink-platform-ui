import { describe, it, expect } from "vitest";
import { getTaskIcon, TASK_ICON_REGISTRY } from "./index";

describe("TaskIcon registry (backend JobType keys)", () => {
  it("has an icon for every backend JobType plus workflow/group", () => {
    for (const key of [
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
      "workflow",
      "group",
    ]) {
      expect(TASK_ICON_REGISTRY[key]).toBeDefined();
    }
  });
  it("resolves a backend key to a defined icon and falls back otherwise", () => {
    expect(getTaskIcon("MYSQL_SQL").src).toBeTruthy();
    expect(getTaskIcon("nope").src).toBeTruthy(); // fallback, not a crash
  });
});
