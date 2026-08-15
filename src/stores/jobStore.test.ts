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

describe("jobStore group/leaf backend wiring", () => {
  beforeEach(() => vi.clearAllMocks());

  it("createGroup calls backend then adds a group node", async () => {
    vi.mocked(jobApi.createJobGroup).mockResolvedValue("g-new");
    useJobStore.setState({ treeData: [] });
    await useJobStore.getState().createGroup("G", "");
    expect(jobApi.createJobGroup).toHaveBeenCalledWith({ name: "G", pid: "" });
    expect(useJobStore.getState().treeData.some((n) => n.id === "g-new" && n.kind === "group")).toBe(true);
  });

  it("deleteNode routes groups to deleteJobGroup and leaves to deleteTreeNode", async () => {
    vi.mocked(jobApi.deleteJobGroup).mockResolvedValue(true);
    vi.mocked(jobApi.deleteTreeNode).mockResolvedValue(true);
    useJobStore.setState({
      treeData: [
        { id: "g1", name: "g", kind: "group", pid: "", children: [{ id: "l1", name: "l", kind: "task", pid: "g1" }] },
      ],
      openTabs: [],
      activeTabKey: null,
      selectedNode: null,
    });
    await useJobStore.getState().deleteNode({ id: "l1", name: "l", kind: "task", pid: "g1" });
    expect(jobApi.deleteTreeNode).toHaveBeenCalledWith("l1");
    await useJobStore.getState().deleteNode({ id: "g1", name: "g", kind: "group", pid: "" });
    expect(jobApi.deleteJobGroup).toHaveBeenCalledWith("g1");
  });

  it("renameNode routes group nodes to renameJobGroup and updates the tree", async () => {
    vi.mocked(jobApi.renameJobGroup).mockResolvedValue("g1");
    useJobStore.setState({
      treeData: [{ id: "g1", name: "g", kind: "group", pid: "", children: [] }],
      openTabs: [],
      activeTabKey: null,
      selectedNode: null,
    });
    await useJobStore.getState().renameNode({ id: "g1", name: "g", kind: "group", pid: "" }, "g-renamed");
    expect(jobApi.renameJobGroup).toHaveBeenCalledWith({ id: "g1", name: "g-renamed" });
    expect(jobApi.renameTreeNode).not.toHaveBeenCalled();
    expect(useJobStore.getState().treeData.find((n) => n.id === "g1")?.name).toBe("g-renamed");
  });

  it("renameNode routes leaf nodes to renameTreeNode and updates the tree", async () => {
    vi.mocked(jobApi.renameTreeNode).mockResolvedValue("l1");
    useJobStore.setState({
      treeData: [{ id: "l1", name: "l", kind: "task", pid: "" }],
      openTabs: [],
      activeTabKey: null,
      selectedNode: null,
    });
    await useJobStore.getState().renameNode({ id: "l1", name: "l", kind: "task", pid: "" }, "l-renamed");
    expect(jobApi.renameTreeNode).toHaveBeenCalledWith({ id: "l1", name: "l-renamed" });
    expect(jobApi.renameJobGroup).not.toHaveBeenCalled();
    expect(useJobStore.getState().treeData.find((n) => n.id === "l1")?.name).toBe("l-renamed");
  });

  it("createGroup leaves the tree unmutated when the backend call rejects", async () => {
    vi.mocked(jobApi.createJobGroup).mockRejectedValue(new Error("x"));
    useJobStore.setState({ treeData: [] });
    await expect(useJobStore.getState().createGroup("G", "")).rejects.toThrow();
    expect(useJobStore.getState().treeData).toEqual([]);
  });
});
