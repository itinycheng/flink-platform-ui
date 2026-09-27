import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/constants/storage";
import { useJobStore } from "./jobStore";
import { useWorkspaceStore } from "./workspaceStore";

describe("workspaceStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspaceStore.setState({ currentId: 1, workspaces: [], loading: false, loaded: false });
    useJobStore.setState({
      treeData: [{ id: "job:1", name: "job", kind: "task", pid: "legacy:definitions" }],
      selectedNode: { id: "job:1", name: "job", kind: "task", pid: "legacy:definitions" },
      openTabs: [{ key: "job:1", node: { id: "job:1", name: "job", kind: "task", pid: "" } }],
      activeTabKey: "job:1",
    });
  });

  it("switches tenant context without a full-page reload and clears Studio state", () => {
    useWorkspaceStore.getState().setCurrent(2);

    expect(useWorkspaceStore.getState().currentId).toBe(2);
    expect(localStorage.getItem(STORAGE_KEYS.workspaceId)).toBe("2");
    expect(useJobStore.getState().treeData).toEqual([]);
    expect(useJobStore.getState().openTabs).toEqual([]);
    expect(useJobStore.getState().activeTabKey).toBeNull();
  });
});
