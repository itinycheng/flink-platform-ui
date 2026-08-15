import { describe, it, expect, vi, beforeEach } from "vitest";
import { useJobStore } from "./jobStore";
import * as api from "@/api/jobFlow";

vi.mock("@/api/jobFlow");

describe("jobStore JobFlow actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loadJobFlow delegates to getJobFlow", async () => {
    vi.mocked(api.getJobFlow).mockResolvedValue({ id: 3, name: "f", type: "JOB_FLOW" } as never);
    const f = await useJobStore.getState().loadJobFlow("3");
    expect(api.getJobFlow).toHaveBeenCalledWith("3");
    expect(f?.name).toBe("f");
  });

  it("loadJobFlow returns null on error", async () => {
    vi.mocked(api.getJobFlow).mockRejectedValue(new Error("boom"));
    expect(await useJobStore.getState().loadJobFlow("x")).toBeNull();
  });

  it("saveJobFlow creates without id, updates with id", async () => {
    vi.mocked(api.createJobFlow).mockResolvedValue(9 as never);
    vi.mocked(api.updateJobFlow).mockResolvedValue(9 as never);
    await useJobStore.getState().saveJobFlow("tmp", { name: "n", type: "JOB_FLOW" } as never);
    expect(api.createJobFlow).toHaveBeenCalled();
    await useJobStore.getState().saveJobFlow("9", { id: 9, name: "n", type: "JOB_FLOW" } as never);
    expect(api.updateJobFlow).toHaveBeenCalled();
  });

  it("runOnce triggers runFlowOnce and returns a string flowRunId", async () => {
    vi.mocked(api.runFlowOnce).mockResolvedValue(777 as never);
    const id = await useJobStore.getState().runOnce("5");
    expect(api.runFlowOnce).toHaveBeenCalledWith("5");
    expect(id).toBe("777");
  });

  it("setLifecycleStatus maps SCHEDULING->start, others->stop", async () => {
    vi.mocked(api.startSchedule).mockResolvedValue(1 as never);
    vi.mocked(api.stopSchedule).mockResolvedValue(1 as never);
    await useJobStore.getState().setLifecycleStatus("5", "SCHEDULING");
    expect(api.startSchedule).toHaveBeenCalledWith("5");
    await useJobStore.getState().setLifecycleStatus("5", "ONLINE");
    expect(api.stopSchedule).toHaveBeenCalledWith("5");
  });
});
