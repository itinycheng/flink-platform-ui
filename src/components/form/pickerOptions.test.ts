import { describe, it, expect } from "vitest";
import { workerOptions, datasourceOptions, catalogOptions, resourceOptions } from "./pickerOptions";

describe("picker option mappers", () => {
  it("workerOptions labels name (ip) · role and uses id as value", () => {
    expect(
      workerOptions([{ id: 3, name: "w1", ip: "10.0.0.1", port: "80", status: "ACTIVE" }]),
    ).toEqual([{ value: 3, label: "w1 (10.0.0.1) · ACTIVE" }]);
  });
  it("datasourceOptions labels name · type", () => {
    expect(datasourceOptions([{ id: 1, name: "ds", type: "MYSQL", params: { url: "" } }])).toEqual([
      { value: 1, label: "ds · MYSQL" },
    ]);
  });
  it("catalogOptions labels name · type", () => {
    expect(catalogOptions([{ id: 2, name: "c", type: "HIVE", createSql: "" }])).toEqual([
      { value: 2, label: "c · HIVE" },
    ]);
  });
  it("resourceOptions labels by name", () => {
    expect(resourceOptions([{ id: 9, name: "a.jar", type: "FILE" }])).toEqual([{ value: 9, label: "a.jar" }]);
  });
});
