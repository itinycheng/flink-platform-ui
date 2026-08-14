import { describe, it, expect, vi, beforeEach } from "vitest";
import { useJobStore } from "./jobStore";
import * as jobApi from "@/api/job";

vi.mock("@/api/job");

describe("jobStore jobInfo actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loadJobInfo delegates to getJobInfo", async () => {
    vi.mocked(jobApi.getJobInfo).mockResolvedValue({
      id: 5,
      name: "x",
      type: "SHELL",
      execMode: "BATCH",
      routeUrl: [1],
      config: { type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" },
    } as never);
    const info = await useJobStore.getState().loadJobInfo("5");
    expect(jobApi.getJobInfo).toHaveBeenCalledWith("5");
    expect(info?.name).toBe("x");
  });

  it("saveJobInfo creates when no id, updates when id present", async () => {
    vi.mocked(jobApi.createJobInfo).mockResolvedValue({ id: 9 } as never);
    vi.mocked(jobApi.updateJobInfo).mockResolvedValue({ id: 9 } as never);
    await useJobStore.getState().saveJobInfo("tmp", {
      name: "n",
      type: "SHELL",
      execMode: "BATCH",
      routeUrl: [1],
      config: { type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" },
    } as never);
    expect(jobApi.createJobInfo).toHaveBeenCalled();
    await useJobStore.getState().saveJobInfo("9", {
      id: 9,
      name: "n",
      type: "SHELL",
      execMode: "BATCH",
      routeUrl: [1],
      config: { type: "SHELL", retryTimes: 0, retryInterval: "5s", timeout: "60s" },
    } as never);
    expect(jobApi.updateJobInfo).toHaveBeenCalled();
  });
});
