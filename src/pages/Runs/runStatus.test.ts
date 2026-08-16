import { describe, it, expect } from "vitest";
import { EXECUTION_STATUSES } from "@/constants/enums";
import { execStatusSemantic, getExecStatusColor, execIsRunning } from "./runStatus";

describe("execStatus mapping", () => {
  it("maps every ExecutionStatus to a semantic + color", () => {
    for (const s of EXECUTION_STATUSES) {
      expect(["success", "failed", "running", "killed", "waiting"]).toContain(execStatusSemantic(s));
      expect(typeof getExecStatusColor(s)).toBe("string");
    }
  });
  it("execIsRunning true only for in-flight states", () => {
    expect(execIsRunning("RUNNING")).toBe(true);
    expect(execIsRunning("SUBMITTED")).toBe(true);
    expect(execIsRunning("SUCCESS")).toBe(false);
    expect(execIsRunning("KILLED")).toBe(false);
  });
});
