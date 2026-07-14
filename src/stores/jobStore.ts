import { create } from "zustand";
import type { JobTreeNode, WorkflowFormData, WorkflowLifecycleStatus } from "@/types/job";
import {
  getJobGroups,
  getJobsByGroup,
  searchJobs,
  getWorkflowDetail,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  runJobOnce,
  setJobStatus,
  copyJob,
  updateJobTags,
  updateJobAlertRules,
} from "@/api/job";

export interface OpenTab {
  key: string;
  node: JobTreeNode;
}

export interface WorkflowState {
  treeData: JobTreeNode[];
  selectedNode: JobTreeNode | null;
  formData: WorkflowFormData | null;
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
  setFormData: (data: WorkflowFormData | null) => void;
  addNode: (node: JobTreeNode) => void;
  updateNodeName: (nodeId: string, newName: string) => void;
  patchNode: (nodeId: string, patch: Partial<JobTreeNode>) => void;
  removeNode: (nodeId: string) => void;
  runOnce: (nodeId: string) => Promise<string>;
  setLifecycleStatus: (nodeId: string, status: WorkflowLifecycleStatus) => Promise<void>;
  copyDefinition: (nodeId: string) => Promise<void>;
  setNodeTags: (nodeId: string, tags: string[]) => Promise<void>;
  setNodeAlertRules: (nodeId: string, alertRuleIds: string[]) => Promise<void>;
  saveWorkflow: (data: WorkflowFormData) => Promise<void>;
  deleteWorkflow: (nodeId: string) => Promise<void>;
  openTab: (node: JobTreeNode) => void;
  closeTab: (key: string) => void;
  setActiveTab: (key: string) => void;
}

/**
 * Find a node by ID in the tree (searches both top-level and children).
 */
export function findNodeById(tree: JobTreeNode[], id: string): JobTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Count all nodes in the tree (including children).
 */
export function countNodes(tree: JobTreeNode[]): number {
  let count = 0;
  for (const node of tree) {
    count += 1;
    if (node.children) {
      count += countNodes(node.children);
    }
  }
  return count;
}

function removeNodeFromTree(treeData: JobTreeNode[], nodeId: string, isGroup: boolean): JobTreeNode[] {
  if (isGroup) return treeData.filter((g) => g.id !== nodeId);
  return treeData.map((group) =>
    group.children ? { ...group, children: group.children.filter((child) => child.id !== nodeId) } : group,
  );
}

function collectRemovedIds(treeData: JobTreeNode[], nodeId: string, isGroup: boolean): Set<string> {
  const removedIds = new Set<string>([nodeId]);
  if (!isGroup) return removedIds;
  treeData.find((g) => g.id === nodeId)?.children?.forEach((child) => removedIds.add(child.id));
  return removedIds;
}

export const useJobStore = create<WorkflowState>((set, get) => ({
  treeData: [],
  selectedNode: null,
  formData: null,
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
      const newTree = treeData.map((group) => (group.id === groupId ? { ...group, children: safeChildren } : group));
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
    set({ selectedNode: node, formData: null });
    if (!node || node.type === "group") return;
    get().openTab(node);
    try {
      const data = await getWorkflowDetail(node.id);
      if (get().selectedNode?.id === node.id) {
        set({ formData: data });
      }
    } catch (err) {
      console.error("[jobStore] getWorkflowDetail failed", err);
    }
  },

  setFormData: (data) => {
    set({ formData: data });
  },

  addNode: (node) => {
    const { treeData } = get();
    if (node.group === null) {
      // Top-level group node
      set({ treeData: [...treeData, node] });
    } else {
      // Child workflow node — add to parent's children
      const newTree = treeData.map((group) => {
        if (group.id === node.group) {
          return {
            ...group,
            children: [...(group.children ?? []), node],
          };
        }
        return group;
      });
      set({ treeData: newTree });
    }
  },

  updateNodeName: (nodeId, newName) => {
    const { treeData } = get();
    const newTree = treeData.map((group) => {
      if (group.id === nodeId) {
        return { ...group, name: newName };
      }
      if (group.children) {
        return {
          ...group,
          children: group.children.map((child) => (child.id === nodeId ? { ...child, name: newName } : child)),
        };
      }
      return group;
    });
    set({ treeData: newTree });
  },

  patchNode: (nodeId, patch) => {
    const { treeData } = get();
    set({
      treeData: treeData.map((group) =>
        group.id === nodeId
          ? { ...group, ...patch }
          : group.children
            ? {
                ...group,
                children: group.children.map((c) => (c.id === nodeId ? { ...c, ...patch } : c)),
              }
            : group,
      ),
    });
  },

  runOnce: async (nodeId) => {
    const { flowRunId } = await runJobOnce(nodeId);
    // Reflect the triggered run immediately in the node's last-run indicator.
    get().patchNode(nodeId, { status: "running" });
    return flowRunId;
  },

  setLifecycleStatus: async (nodeId, status) => {
    await setJobStatus(nodeId, status);
    get().patchNode(nodeId, { lifecycleStatus: status });
  },

  copyDefinition: async (nodeId) => {
    const copy = await copyJob(nodeId);
    get().addNode(copy);
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
    const isGroup = treeData.some((g) => g.id === nodeId);
    const newTree = removeNodeFromTree(treeData, nodeId, isGroup);
    const removedIds = collectRemovedIds(treeData, nodeId, isGroup);

    const newTabs = openTabs.filter((tab) => !removedIds.has(tab.key));
    const newActiveKey =
      activeTabKey && removedIds.has(activeTabKey) ? (newTabs[newTabs.length - 1]?.key ?? null) : activeTabKey;

    let newSelected = selectedNode;
    if (selectedNode && removedIds.has(selectedNode.id)) {
      newSelected = newActiveKey ? (newTabs.find((t) => t.key === newActiveKey)?.node ?? null) : null;
    }

    set({ treeData: newTree, selectedNode: newSelected, openTabs: newTabs, activeTabKey: newActiveKey });
  },

  saveWorkflow: async (data) => {
    set({ operationLoading: true });
    try {
      if (data.id) {
        await updateWorkflow(data.id, data);
      } else {
        await createWorkflow(data);
      }
    } finally {
      set({ operationLoading: false });
    }
  },

  deleteWorkflow: async (nodeId) => {
    set({ operationLoading: true });
    try {
      await deleteWorkflow(nodeId);
      get().removeNode(nodeId);
    } finally {
      set({ operationLoading: false });
    }
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
}));
