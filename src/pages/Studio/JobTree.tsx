import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfigProvider, Dropdown, Flex, Modal, Spin, Tree, message } from "antd";
import { DownOutlined, EllipsisOutlined } from "@ant-design/icons";
import type { MenuProps, ThemeConfig, TreeDataNode } from "antd";
import { compactMenuTheme } from "@/theme";
import type { MessageInstance } from "antd/es/message/interface";
import { useTranslation } from "react-i18next";
import { useJobStore } from "@/stores/jobStore";
import { findNodeById } from "@/utils/tree";
import type { JobTreeNode } from "@/types/job";
import { TaskIcon } from "@/components/TaskIcon";
import { StatusDot } from "./StatusDot";
import { RunStatusIcon } from "./RunStatusIcon";
import { buildNodeMenuItems } from "./nodeMenu";
import { useDefinitionLifecycle } from "./useDefinitionLifecycle";
import { TagEditModal } from "./TagEditModal";
import { AlertBindModal } from "./AlertBindModal";
import { GroupEditModal } from "./GroupEditModal";

// ---------- constants & icons ----------

// Tree density knobs — tweak these three to taste.
const NODE_FONT_SIZE = 14; // row text size (group count uses this - 1)
const NODE_ROW_HEIGHT = 30; // row height == line spacing (virtual-scroll item height)
const ICON_SIZE = 18; // leaf type-icon size

/** Tree row density/typography, layered on top of the compact menu theme. */
const jobTreeTheme: ThemeConfig = {
  ...compactMenuTheme,
  components: {
    ...compactMenuTheme.components,
    Tree: { titleHeight: NODE_ROW_HEIGHT, fontSize: NODE_FONT_SIZE },
  },
};

const moreButtonStyle: React.CSSProperties = {
  fontSize: 14,
  padding: "0 4px",
  cursor: "pointer",
  color: "var(--ant-color-text-tertiary)",
  opacity: 0,
  transition: "opacity 0.15s",
};

/** Fixed-width slot so status indicators line up into columns across rows. */
const slotStyle = (width: number): React.CSSProperties => ({
  width,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

function getNodeIcon(node: { type: string }): React.ReactNode {
  return <TaskIcon type={node.type} size={ICON_SIZE} />;
}

// ---------- utils ----------

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- node title ----------

interface JobTreeNodeTitleProps {
  displayName: string;
  node: JobTreeNode;
  count?: number;
  menuItems: MenuProps["items"];
  onMenuAction: (key: string, node: JobTreeNode) => void;
}

function JobTreeNodeTitle({ displayName, node, count, menuItems, onMenuAction }: JobTreeNodeTitleProps) {
  return (
    <Flex align="center" justify="space-between" className="job-tree-title">
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: NODE_FONT_SIZE,
        }}
      >
        {displayName}
      </span>
      <Flex align="center" gap={6} style={{ flexShrink: 0 }}>
        {typeof count === "number" && count > 0 ? (
          <span style={{ fontSize: NODE_FONT_SIZE - 1, color: "var(--ant-color-text-tertiary)" }}>{count}</span>
        ) : (
          <>
            <span style={slotStyle(7)}>{node.lifecycleStatus && <StatusDot status={node.lifecycleStatus} />}</span>
            <span style={slotStyle(12)}>{node.type !== "group" && <RunStatusIcon status={node.status} />}</span>
          </>
        )}
        <Dropdown
          menu={{
            items: menuItems,
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              onMenuAction(key, node);
            },
          }}
          trigger={["click"]}
        >
          <EllipsisOutlined className="job-tree-more" style={moreButtonStyle} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      </Flex>
    </Flex>
  );
}

// ---------- hooks: data ----------

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: JobTreeNode | null;
}

const INITIAL_CTX: ContextMenuState = { visible: false, x: 0, y: 0, node: null };

function useTreeFetching(searchKeyword: string, typeFilter: string[], statusFilter: string[]) {
  const fetchTree = useJobStore((s) => s.fetchTree);
  const searchTree = useJobStore((s) => s.searchTree);
  const hasSearch = searchKeyword.trim() !== "" || typeFilter.length > 0 || statusFilter.length > 0;

  useEffect(() => {
    void fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    if (!hasSearch) return;
    const timer = setTimeout(() => void searchTree(searchKeyword.trim(), typeFilter, statusFilter), 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, typeFilter, statusFilter, searchTree, hasSearch]);

  const hadSearchRef = useRef(false);
  useEffect(() => {
    if (hasSearch) hadSearchRef.current = true;
    else if (hadSearchRef.current) {
      hadSearchRef.current = false;
      void fetchTree();
    }
  }, [hasSearch, fetchTree]);
}

function useTreeExpansion() {
  const loadedGroups = useJobStore((s) => s.loadedGroups);
  const fetchGroupChildren = useJobStore((s) => s.fetchGroupChildren);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    return useJobStore.subscribe((state, prev) => {
      if (state.searchExpandedKeys && state.searchExpandedKeys !== prev.searchExpandedKeys) {
        setExpandedKeys(state.searchExpandedKeys);
      }
    });
  }, []);

  const handleExpand = useCallback(
    (keys: React.Key[]) => {
      const newKeys = keys.filter((k) => !expandedKeys.includes(k));
      setExpandedKeys(keys);
      for (const key of newKeys) {
        const groupId = String(key);
        if (!loadedGroups.has(groupId)) void fetchGroupChildren(groupId);
      }
    },
    [expandedKeys, loadedGroups, fetchGroupChildren],
  );

  return { expandedKeys, setExpandedKeys, loadedGroups, fetchGroupChildren, handleExpand };
}

function useContextMenu(treeData: JobTreeNode[]) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(INITIAL_CTX);

  useEffect(() => {
    if (!contextMenu.visible) return;
    const handler = () => setContextMenu((prev) => ({ ...prev, visible: false }));
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu.visible]);

  const handleRightClick = useCallback(
    ({ event, node: treeNode }: { event: React.MouseEvent; node: TreeDataNode }) => {
      event.preventDefault();
      event.stopPropagation();
      const found = findNodeById(treeData, String(treeNode.key));
      if (found) setContextMenu({ visible: true, x: event.clientX, y: event.clientY, node: found });
    },
    [treeData],
  );

  return { contextMenu, setContextMenu, handleRightClick };
}

function useJobTreeData({
  searchKeyword,
  typeFilter,
  statusFilter,
}: {
  searchKeyword: string;
  typeFilter: string[];
  statusFilter: string[];
}) {
  const treeData = useJobStore((s) => s.treeData);
  const selectNode = useJobStore((s) => s.selectNode);

  useTreeFetching(searchKeyword, typeFilter, statusFilter);
  const { expandedKeys, setExpandedKeys, loadedGroups, fetchGroupChildren, handleExpand } = useTreeExpansion();
  const { contextMenu, setContextMenu, handleRightClick } = useContextMenu(treeData);

  const handleSelect = useCallback(
    (selectedKeys: React.Key[]) => {
      if (selectedKeys.length === 0) return;
      const nodeId = String(selectedKeys[0]);
      const node = findNodeById(treeData, nodeId);
      if (!node) return;
      if (node.type !== "group") {
        void selectNode(node);
        return;
      }
      const isExpanding = !expandedKeys.includes(nodeId);
      setExpandedKeys((prev) => (prev.includes(nodeId) ? prev.filter((k) => k !== nodeId) : [...prev, nodeId]));
      if (isExpanding && !loadedGroups.has(nodeId)) void fetchGroupChildren(nodeId);
    },
    [treeData, expandedKeys, setExpandedKeys, loadedGroups, fetchGroupChildren, selectNode],
  );

  return { expandedKeys, contextMenu, setContextMenu, handleSelect, handleRightClick, handleExpand };
}

// ---------- hooks: actions ----------

function buildDeleteContent(node: JobTreeNode, t: (k: string, opts?: Record<string, unknown>) => string): string {
  if (node.type === "group") {
    const count = node.children?.length ?? 0;
    return count > 0
      ? t("workflow.confirmDeleteGroup", { name: node.name, count })
      : t("workflow.confirmDeleteGroupEmpty", { name: node.name });
  }
  return node.type === "task"
    ? t("workflow.confirmDeleteTask", { name: node.name })
    : t("workflow.confirmDeleteWorkflow", { name: node.name });
}

function useJobTreeActions({ messageApi }: { messageApi: MessageInstance }) {
  const { t } = useTranslation();
  const addNode = useJobStore((s) => s.addNode);
  const removeNode = useJobStore((s) => s.removeNode);

  const handleAddWorkflow = useCallback(
    (parentId: string) =>
      addNode({ id: generateId("wf"), name: t("workflow.newWorkflow"), type: "workflow", group: parentId }),
    [addNode, t],
  );
  const handleAddTask = useCallback(
    (parentId: string) =>
      addNode({ id: generateId("task"), name: t("workflow.newTask"), type: "task", group: parentId }),
    [addNode, t],
  );

  const handleDelete = useCallback(
    (node: JobTreeNode) => {
      Modal.confirm({
        title: t("workflow.confirmDelete"),
        content: buildDeleteContent(node, t),
        okText: t("common.delete"),
        okType: "danger",
        cancelText: t("common.cancel"),
        onOk: () => {
          removeNode(node.id);
          void messageApi.success(t("workflow.deleted"));
        },
      });
    },
    [removeNode, messageApi, t],
  );

  return { handleAddWorkflow, handleAddTask, handleDelete };
}

// ---------- hooks: tree data mapping ----------

function useBuiltTreeData(
  getMenuItems: (node: JobTreeNode) => MenuProps["items"],
  handleMenuAction: (key: string, node: JobTreeNode) => void,
): TreeDataNode[] {
  const treeData = useJobStore((s) => s.treeData);
  const loadingGroups = useJobStore((s) => s.loadingGroups);
  const loadedGroups = useJobStore((s) => s.loadedGroups);

  return useMemo<TreeDataNode[]>(() => {
    // Recurse to any depth: only `group` nodes are expandable (with lazy-loaded
    // children); everything else is a leaf. Groups and leaves may be siblings.
    const buildNode = (node: JobTreeNode): TreeDataNode => {
      const title = (
        <JobTreeNodeTitle
          displayName={loadingGroups.has(node.id) ? `${node.name} ...` : node.name}
          node={node}
          count={node.type === "group" ? (node.childCount ?? node.children?.length) : undefined}
          menuItems={getMenuItems(node)}
          onMenuAction={handleMenuAction}
        />
      );
      if (node.type !== "group") {
        return { key: node.id, title, icon: getNodeIcon(node), isLeaf: true };
      }
      // Show the expand arrow before children are fetched; map them once loaded.
      const loaded = loadedGroups.has(node.id) || Boolean(node.children?.length);
      return {
        key: node.id,
        title,
        icon: undefined,
        isLeaf: false,
        children: loaded ? node.children?.map(buildNode) : undefined,
      };
    };
    return (Array.isArray(treeData) ? treeData : []).map(buildNode);
  }, [treeData, loadingGroups, loadedGroups, getMenuItems, handleMenuAction]);
}

// ---------- hooks: virtual-scroll height ----------

/** Track a container's height so the Tree can virtualize (only visible rows render). */
function useContainerHeight() {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h) setHeight(h);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
}

// ---------- component ----------

interface JobTreeProps {
  searchKeyword?: string;
  typeFilter?: string[];
  statusFilter?: string[];
}

const EMPTY_FILTER: string[] = [];

export default function JobTree({
  searchKeyword = "",
  typeFilter = EMPTY_FILTER,
  statusFilter = EMPTY_FILTER,
}: JobTreeProps) {
  const selectedNode = useJobStore((s) => s.selectedNode);
  const treeLoading = useJobStore((s) => s.treeLoading);
  const { t } = useTranslation();

  const [messageApi, contextHolder] = message.useMessage();

  const { expandedKeys, contextMenu, setContextMenu, handleSelect, handleRightClick, handleExpand } = useJobTreeData({
    searchKeyword,
    typeFilter,
    statusFilter,
  });
  const { handleAddWorkflow, handleAddTask, handleDelete } = useJobTreeActions({ messageApi });
  const lifecycle = useDefinitionLifecycle(messageApi);
  const [renameNode, setRenameNode] = useState<JobTreeNode | null>(null);

  const getMenuItems = useCallback((node: JobTreeNode): MenuProps["items"] => buildNodeMenuItems(node, t), [t]);

  const handleMenuAction = useCallback(
    (key: string, node: JobTreeNode) => {
      if (key === "addWorkflow") handleAddWorkflow(node.id);
      else if (key === "addTask") handleAddTask(node.id);
      else if (key === "rename") setRenameNode(node);
      else if (key === "delete") handleDelete(node);
      else void lifecycle.handleLifecycle(key, node);
    },
    [handleAddWorkflow, handleAddTask, handleDelete, lifecycle],
  );

  const builtTreeData = useBuiltTreeData(getMenuItems, handleMenuAction);
  const { ref: containerRef, height } = useContainerHeight();

  return (
    <ConfigProvider theme={jobTreeTheme}>
      {contextHolder}
      <div ref={containerRef} style={{ height: "100%" }}>
        <Spin spinning={treeLoading}>
          <Tree
            className="job-tree-wrapper"
            styles={{ root: { color: "var(--ant-color-text-secondary)" } }}
            showIcon
            showLine
            blockNode
            virtual
            height={height}
            switcherIcon={<DownOutlined />}
            expandedKeys={expandedKeys}
            onExpand={handleExpand}
            selectedKeys={selectedNode ? [selectedNode.id] : []}
            onSelect={handleSelect}
            onRightClick={handleRightClick}
            treeData={builtTreeData}
          />
        </Spin>
      </div>
      {contextMenu.visible && contextMenu.node && (
        <Dropdown
          open
          menu={{
            items: getMenuItems(contextMenu.node),
            onClick: ({ key }) => {
              handleMenuAction(key, contextMenu.node!);
              setContextMenu((prev) => ({ ...prev, visible: false }));
            },
          }}
        >
          <div style={{ position: "fixed", left: contextMenu.x, top: contextMenu.y, width: 1, height: 1 }} />
        </Dropdown>
      )}
      <LifecycleModals lifecycle={lifecycle} />
      <GroupRenameModal node={renameNode} onClose={() => setRenameNode(null)} />
    </ConfigProvider>
  );
}

/** Names of a node's same-level groups (excluding itself), for duplicate checks. */
function groupSiblingNames(treeData: JobTreeNode[], node: JobTreeNode): string[] {
  const siblings = node.group ? (findNodeById(treeData, node.group)?.children ?? []) : treeData;
  return siblings.filter((n) => n.type === "group" && n.id !== node.id).map((n) => n.name);
}

/** Rename modal for a group node; reads the store so JobTree only holds the target. */
function GroupRenameModal({ node, onClose }: { node: JobTreeNode | null; onClose: () => void }) {
  const treeData = useJobStore((s) => s.treeData);
  const updateNodeName = useJobStore((s) => s.updateNodeName);
  return (
    <GroupEditModal
      open={!!node}
      mode="rename"
      initialName={node?.name}
      siblingNames={node ? groupSiblingNames(treeData, node) : undefined}
      onOk={(name) => {
        if (node) updateNodeName(node.id, name);
        onClose();
      }}
      onCancel={onClose}
    />
  );
}

function LifecycleModals({ lifecycle }: { lifecycle: ReturnType<typeof useDefinitionLifecycle> }) {
  return (
    <>
      <TagEditModal
        open={!!lifecycle.tagNode}
        value={lifecycle.tagNode?.tags ?? []}
        confirmLoading={lifecycle.saving}
        onOk={lifecycle.saveTags}
        onCancel={lifecycle.closeTag}
      />
      <AlertBindModal
        open={!!lifecycle.alertNode}
        value={lifecycle.alertNode?.alertRuleIds ?? []}
        confirmLoading={lifecycle.saving}
        onOk={lifecycle.saveAlerts}
        onCancel={lifecycle.closeAlert}
      />
    </>
  );
}
