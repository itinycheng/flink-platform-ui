import { create } from "zustand";
import type { JobTreeNode, WorkflowLifecycleStatus } from "@/types/job";
import type { JobInfo, JobFlow } from "@/types/entities";
import {
  findNodeById,
  updateNodeById,
  removeNodeById,
  insertChild,
  collectSubtreeIds,
} from "@/utils/tree";
import {
  getJobGroups,
  getJobsByGroup,
  searchJobs,
  updateJobTags,
  updateJobAlertRules,
  getJobInfo,
  createJobInfo,
  updateJobInfo,
} from "@/api/job";
import {
  getJobFlow,
  createJobFlow,
  updateJobFlow,
  copyJobFlow,
  startSchedule,
  stopSchedule,
  runFlowOnce,
  updateFlowGraph,
} from "@/api/jobFlow";
import type { FlowGraph } from "@/types/flow";

export interface OpenTab {
  key: string;
  node: JobTreeNode;
}

export interface WorkflowState {
  treeData: JobTreeNode[];
  selectedNode: JobTreeNode | null;
  treeLoading: boolean;
  operationLoading: boolean;
  loadingGroups: Set<string>;
  loadedGroups: Set<string>;
  searchExpandedKeys: string[] | null;
  openTabs: OpenTab[];
  activeTabKey: string | null;

  fetchTree: () => Promise<void>;
  fetchGroupChildren: (groupId: string) => Promise<void>;
  searchTree: (keyword: string, types: string[], statuses?: string[]) => Promise<void>;
  selectNode: (node: JobTreeNode | null) => Promise<void>;
  addNode: (node: JobTreeNode) => void;
  updateNodeName: (nodeId: string, newName: string) => void;
  patchNode: (nodeId: string, patch: Partial<JobTreeNode>) => void;
  removeNode: (nodeId: string) => void;
  runOnce: (nodeId: string) => Promise<string>;
  setLifecycleStatus: (nodeId: string, status: WorkflowLifecycleStatus) => Promise<void>;
  copyDefinition: (nodeId: string) => Promise<void>;
  setNodeTags: (nodeId: string, tags: string[]) => Promise<void>;
  setNodeAlertRules: (nodeId: string, alertRuleIds: string[]) => Promise<void>;
  openTab: (node: JobTreeNode) => void;
  closeTab: (key: string) => void;
  setActiveTab: (key: string) => void;
  loadJobInfo: (nodeId: string) => Promise<JobInfo | null>;
  saveJobInfo: (nodeId: string, info: JobInfo) => Promise<void>;
  loadJobFlow: (nodeId: string) => Promise<JobFlow | null>;
  saveJobFlow: (nodeId: string, flow: JobFlow) => Promise<void>;
  saveFlowGraph: (nodeId: string, flow: FlowGraph) => Promise<void>;
}

// Re-exported so existing imports (`@/stores/jobStore`) keep working; the tree
// helpers themselves now live in `@/utils/tree` and are depth-agnostic.
export { findNodeById } from "@/utils/tree";

export const useJobStore = create<WorkflowState>((set, get) => ({
  treeData: [],
  selectedNode: null,
  treeLoading: false,
  operationLoading: false,
  loadingGroups: new Set(),
  loadedGroups: new Set(),
  searchExpandedKeys: null,
  openTabs: [],
  activeTabKey: null,

  fetchTree: async () => {
    set({ treeLoading: true });
    try {
      const groups = await getJobGroups();
      set({ treeData: Array.isArray(groups) ? groups : [], loadedGroups: new Set(), searchExpandedKeys: null });
    } finally {
      set({ treeLoading: false });
    }
  },

  fetchGroupChildren: async (groupId) => {
    const { loadingGroups, loadedGroups } = get();
    if (loadedGroups.has(groupId) || loadingGroups.has(groupId)) return;

    const newLoading = new Set(loadingGroups);
    newLoading.add(groupId);
    set({ loadingGroups: newLoading });

    try {
      const children = await getJobsByGroup(groupId);
      const safeChildren = Array.isArray(children) ? children : [];
      const { treeData, loadingGroups: currentLoading, loadedGroups: currentLoaded } = get();
      const newTree = updateNodeById(treeData, groupId, (group) => ({ ...group, children: safeChildren }));
      const newLoadingSet = new Set(currentLoading);
      newLoadingSet.delete(groupId);
      const newLoadedSet = new Set(currentLoaded);
      newLoadedSet.add(groupId);
      set({ treeData: newTree, loadingGroups: newLoadingSet, loadedGroups: newLoadedSet });
    } catch {
      const { loadingGroups: currentLoading } = get();
      const newLoadingSet = new Set(currentLoading);
      newLoadingSet.delete(groupId);
      set({ loadingGroups: newLoadingSet });
    }
  },

  searchTree: async (keyword, types, statuses) => {
    set({ treeLoading: true });
    try {
      const results = await searchJobs({ keyword, types, statuses });
      const list = Array.isArray(results) ? results : [];
      set({
        treeData: list,
        loadedGroups: new Set(list.map((g) => g.id)),
        searchExpandedKeys: list.map((g) => g.id),
      });
    } finally {
      set({ treeLoading: false });
    }
  },

  selectNode: async (node) => {
    set({ selectedNode: node });
    if (!node || node.type === "group") return;
    get().openTab(node);
  },

  addNode: (node) => {
    const { treeData } = get();
    // A node with no parent (empty/null `group`) is a root node; otherwise it is
    // appended to its parent's children, at whatever depth the parent lives.
    if (!node.group) {
      set({ treeData: [...treeData, node] });
    } else {
      set({ treeData: insertChild(treeData, node.group, node) });
    }
  },

  updateNodeName: (nodeId, newName) => {
    set({ treeData: updateNodeById(get().treeData, nodeId, (node) => ({ ...node, name: newName })) });
  },

  patchNode: (nodeId, patch) => {
    set({ treeData: updateNodeById(get().treeData, nodeId, (node) => ({ ...node, ...patch })) });
  },

  runOnce: async (nodeId) => {
    const flowRunId = await runFlowOnce(nodeId);
    // Reflect the triggered run immediately in the node's last-run indicator.
    get().patchNode(nodeId, { status: "running" });
    return String(flowRunId);
  },

  setLifecycleStatus: async (nodeId, status) => {
    // The backend models flow lifecycle via start/stop scheduling; SCHEDULING
    // starts the Quartz trigger, any other target stops it (returns to ONLINE).
    if (status === "SCHEDULING") {
      await startSchedule(nodeId);
    } else {
      await stopSchedule(nodeId);
    }
    get().patchNode(nodeId, { lifecycleStatus: status });
  },

  copyDefinition: async (nodeId) => {
    // /jobFlow/copy returns only the new id; clone the source tree node under
    // the same parent so the copy appears immediately.
    const newId = await copyJobFlow(nodeId);
    const src = findNodeById(get().treeData, nodeId);
    if (src) {
      get().addNode({ ...src, id: String(newId), name: `${src.name}-copy`, children: undefined });
    }
  },

  setNodeTags: async (nodeId, tags) => {
    await updateJobTags(nodeId, tags);
    get().patchNode(nodeId, { tags });
  },

  setNodeAlertRules: async (nodeId, alertRuleIds) => {
    await updateJobAlertRules(nodeId, alertRuleIds);
    get().patchNode(nodeId, { alertRuleIds });
  },

  removeNode: (nodeId) => {
    const { treeData, selectedNode, openTabs, activeTabKey } = get();
    const target = findNodeById(treeData, nodeId);
    const newTree = removeNodeById(treeData, nodeId);
    // Removing a node drops its whole subtree, so tabs/selection for any
    // descendant must be cleaned up too.
    const removedIds = new Set<string>(target ? collectSubtreeIds(target) : [nodeId]);

    const newTabs = openTabs.filter((tab) => !removedIds.has(tab.key));
    const newActiveKey =
      activeTabKey && removedIds.has(activeTabKey) ? (newTabs[newTabs.length - 1]?.key ?? null) : activeTabKey;

    let newSelected = selectedNode;
    if (selectedNode && removedIds.has(selectedNode.id)) {
      newSelected = newActiveKey ? (newTabs.find((t) => t.key === newActiveKey)?.node ?? null) : null;
    }

    set({ treeData: newTree, selectedNode: newSelected, openTabs: newTabs, activeTabKey: newActiveKey });
  },

  openTab: (node) => {
    const { openTabs } = get();
    const exists = openTabs.some((tab) => tab.key === node.id);
    if (!exists) {
      set({ openTabs: [...openTabs, { key: node.id, node }], activeTabKey: node.id });
    } else {
      set({ activeTabKey: node.id });
    }
  },

  closeTab: (key) => {
    const { openTabs, activeTabKey } = get();
    const newTabs = openTabs.filter((tab) => tab.key !== key);
    let newActiveKey = activeTabKey;
    if (activeTabKey === key) {
      const closedIndex = openTabs.findIndex((tab) => tab.key === key);
      newActiveKey = newTabs[closedIndex]?.key ?? newTabs[closedIndex - 1]?.key ?? null;
    }
    set({
      openTabs: newTabs,
      activeTabKey: newActiveKey,
      selectedNode: newActiveKey ? (newTabs.find((t) => t.key === newActiveKey)?.node ?? null) : null,
    });
  },

  setActiveTab: (key) => {
    const { openTabs } = get();
    const tab = openTabs.find((t) => t.key === key);
    set({ activeTabKey: key, selectedNode: tab?.node ?? null });
  },

  loadJobInfo: async (nodeId) => {
    try {
      return await getJobInfo(nodeId);
    } catch {
      return null;
    }
  },

  saveJobInfo: async (nodeId, info) => {
    const saved = info.id ? await updateJobInfo(info) : await createJobInfo(info);
    get().patchNode(nodeId, { name: saved.name });
  },

  loadJobFlow: async (nodeId) => {
    try {
      return await getJobFlow(nodeId);
    } catch {
      return null;
    }
  },

  saveJobFlow: async (nodeId, flow) => {
    if (flow.id) {
      await updateJobFlow(flow);
    } else {
      await createJobFlow(flow);
    }
    get().patchNode(nodeId, { name: flow.name });
  },

  saveFlowGraph: async (nodeId, flow) => {
    await updateFlowGraph(nodeId, flow);
  },
}));
