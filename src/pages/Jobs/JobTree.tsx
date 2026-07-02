import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dropdown, Flex, Modal, Spin, Tree, message } from "antd";
import { DeleteOutlined, DownOutlined, EllipsisOutlined, PlusOutlined, PlayCircleOutlined } from "@ant-design/icons";
import type { MenuProps, TreeDataNode } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import { useTranslation } from "react-i18next";
import { useJobStore } from "@/stores/jobStore";
import type { JobTreeNode } from "@/types/job";
import { TaskIcon } from "./TaskIcon";

// ---------- constants & icons ----------

const ICON_SIZE = 18;

const moreButtonStyle: React.CSSProperties = {
  fontSize: 14,
  padding: "0 4px",
  cursor: "pointer",
  color: "var(--ant-color-text-tertiary)",
  opacity: 0,
  transition: "opacity 0.15s",
};

function getNodeIcon(node: { type: string }): React.ReactNode {
  return <TaskIcon type={node.type} size={ICON_SIZE} />;
}

// ---------- utils ----------

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Find a node by ID in the two-level tree structure (groups + their direct children). */
function findNode(treeData: JobTreeNode[], nodeId: string): JobTreeNode | null {
  for (const group of treeData) {
    if (group.id === nodeId) return group;
    const child = group.children?.find((c) => c.id === nodeId);
    if (child) return child;
  }
  return null;
}

// ---------- node title ----------

interface JobTreeNodeTitleProps {
  displayName: string;
  node: JobTreeNode;
  menuItems: MenuProps["items"];
  onMenuAction: (key: string, node: JobTreeNode) => void;
}

function JobTreeNodeTitle({ displayName, node, menuItems, onMenuAction }: JobTreeNodeTitleProps) {
  return (
    <Flex align="center" justify="space-between" className="job-tree-title">
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: node.type !== "group" ? 13 : undefined,
        }}
      >
        {displayName}
      </span>
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

function useTreeFetching(searchKeyword: string, typeFilter: string[]) {
  const fetchTree = useJobStore((s) => s.fetchTree);
  const searchTree = useJobStore((s) => s.searchTree);
  const hasSearch = searchKeyword.trim() !== "" || typeFilter.length > 0;

  useEffect(() => {
    void fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    if (!hasSearch) return;
    const timer = setTimeout(() => void searchTree(searchKeyword.trim(), typeFilter), 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, typeFilter, searchTree, hasSearch]);

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
      const found = findNode(treeData, String(treeNode.key));
      if (found) setContextMenu({ visible: true, x: event.clientX, y: event.clientY, node: found });
    },
    [treeData],
  );

  return { contextMenu, setContextMenu, handleRightClick };
}

function useJobTreeData({ searchKeyword, typeFilter }: { searchKeyword: string; typeFilter: string[] }) {
  const treeData = useJobStore((s) => s.treeData);
  const selectNode = useJobStore((s) => s.selectNode);

  useTreeFetching(searchKeyword, typeFilter);
  const { expandedKeys, setExpandedKeys, loadedGroups, fetchGroupChildren, handleExpand } = useTreeExpansion();
  const { contextMenu, setContextMenu, handleRightClick } = useContextMenu(treeData);

  const handleSelect = useCallback(
    (selectedKeys: React.Key[]) => {
      if (selectedKeys.length === 0) return;
      const nodeId = String(selectedKeys[0]);
      const node = findNode(treeData, nodeId);
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

  const getMenuItems = useCallback(
    (node: JobTreeNode): MenuProps["items"] => [
      ...(node.type === "group"
        ? [
            { key: "addWorkflow", icon: <PlusOutlined />, label: t("workflow.addWorkflow") },
            { key: "addTask", icon: <PlayCircleOutlined />, label: t("workflow.addTask") },
          ]
        : []),
      { key: "delete", icon: <DeleteOutlined />, label: t("common.delete"), danger: true },
    ],
    [t],
  );

  const handleMenuAction = useCallback(
    (key: string, node: JobTreeNode) => {
      if (key === "addWorkflow") handleAddWorkflow(node.id);
      else if (key === "addTask") handleAddTask(node.id);
      else if (key === "delete") handleDelete(node);
    },
    [handleAddWorkflow, handleAddTask, handleDelete],
  );

  return { getMenuItems, handleMenuAction };
}

// ---------- hooks: tree data mapping ----------

function useBuiltTreeData(
  getMenuItems: (node: JobTreeNode) => MenuProps["items"],
  handleMenuAction: (key: string, node: JobTreeNode) => void,
): TreeDataNode[] {
  const treeData = useJobStore((s) => s.treeData);
  const loadingGroups = useJobStore((s) => s.loadingGroups);
  const loadedGroups = useJobStore((s) => s.loadedGroups);

  return useMemo<TreeDataNode[]>(
    () =>
      (treeData ?? []).map((group) => {
        const isLoading = loadingGroups.has(group.id);
        const isLoaded = loadedGroups.has(group.id);
        const groupChildren =
          isLoaded || group.children?.length
            ? group.children?.map((child) => ({
                key: child.id,
                title: (
                  <JobTreeNodeTitle
                    displayName={child.name}
                    node={child}
                    menuItems={getMenuItems(child)}
                    onMenuAction={handleMenuAction}
                  />
                ),
                icon: getNodeIcon(child),
                isLeaf: true,
              }))
            : undefined;
        return {
          key: group.id,
          title: (
            <JobTreeNodeTitle
              displayName={isLoading ? `${group.name} ...` : group.name}
              node={group}
              menuItems={getMenuItems(group)}
              onMenuAction={handleMenuAction}
            />
          ),
          icon: undefined,
          isLeaf: false,
          children: groupChildren,
        };
      }),
    [treeData, loadingGroups, loadedGroups, getMenuItems, handleMenuAction],
  );
}

// ---------- component ----------

interface JobTreeProps {
  searchKeyword?: string;
  typeFilter?: string[];
}

const EMPTY_TYPE_FILTER: string[] = [];

export default function JobTree({ searchKeyword = "", typeFilter = EMPTY_TYPE_FILTER }: JobTreeProps) {
  const selectedNode = useJobStore((s) => s.selectedNode);
  const treeLoading = useJobStore((s) => s.treeLoading);

  const [messageApi, contextHolder] = message.useMessage();

  const { expandedKeys, contextMenu, setContextMenu, handleSelect, handleRightClick, handleExpand } = useJobTreeData({
    searchKeyword,
    typeFilter,
  });
  const { getMenuItems, handleMenuAction } = useJobTreeActions({ messageApi });
  const builtTreeData = useBuiltTreeData(getMenuItems, handleMenuAction);

  return (
    <>
      {contextHolder}
      <Spin spinning={treeLoading}>
        <Tree
          className="job-tree-wrapper"
          styles={{ root: { color: "var(--ant-color-text-secondary)" } }}
          showIcon
          showLine
          blockNode
          switcherIcon={<DownOutlined />}
          expandedKeys={expandedKeys}
          onExpand={handleExpand}
          selectedKeys={selectedNode ? [selectedNode.id] : []}
          onSelect={handleSelect}
          onRightClick={handleRightClick}
          treeData={builtTreeData}
        />
      </Spin>
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
    </>
  );
}
