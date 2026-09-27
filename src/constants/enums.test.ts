import { describe, it, expect } from "vitest";
import {
  JOB_TYPES,
  DEPLOY_MODES,
  DB_TYPES,
  EXECUTION_STATUSES,
  JOB_TYPE_CLASSIFICATION,
  JOB_TYPE_DBTYPE,
  enumOptions,
} from "./enums";

describe("backend enum constants", () => {
  it("JOB_TYPES matches the backend JobType enum exactly", () => {
    expect([...JOB_TYPES]).toEqual([
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
    ]);
  });

  it("classifies FLINK_SQL as FLINK and maps SQL types to a DbType", () => {
    expect(JOB_TYPE_CLASSIFICATION.FLINK_SQL).toBe("FLINK");
    expect(JOB_TYPE_DBTYPE.MYSQL_SQL).toBe("MYSQL");
    expect(JOB_TYPE_DBTYPE.HIVE_SQL).toBe("HIVE");
    expect(JOB_TYPE_DBTYPE.CLICKHOUSE_SQL).toBe("CLICKHOUSE");
    expect(JOB_TYPE_DBTYPE.SHELL).toBeUndefined();
  });

  it("has the expected member counts", () => {
    expect(DEPLOY_MODES).toHaveLength(4);
    expect(DB_TYPES).toHaveLength(3);
    expect(EXECUTION_STATUSES).toHaveLength(12);
  });

  it("enumOptions maps values to i18n-labelled options", () => {
    const t = (key: string) => `L:${key}`;
    expect(enumOptions(DB_TYPES, "DbType", t)).toEqual([
      { value: "CLICKHOUSE", label: "L:enums.DbType.CLICKHOUSE" },
      { value: "MYSQL", label: "L:enums.DbType.MYSQL" },
      { value: "HIVE", label: "L:enums.DbType.HIVE" },
    ]);
  });
});
