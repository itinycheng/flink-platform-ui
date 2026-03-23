import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tree, Modal, Spin, message, Dropdown, Flex } from "antd";
import { useTranslation } from "react-i18next";
import { PlusOutlined, DeleteOutlined, PlayCircleOutlined, EllipsisOutlined, DownOutlined } from "@ant-design/icons";
import type { TreeDataNode, MenuProps } from "antd";
import { useJobStore } from "@/stores/jobStore";
import type { JobTreeNode } from "@/types/job";
import flinkIcon from "@/assets/flink.svg";
import sparkIcon from "@/assets/spark.svg";
import sqlIcon from "@/assets/sql.svg";
import hiveIcon from "@/assets/hive.svg";
import shellIcon from "@/assets/command.svg";
import flowIcon from "@/assets/flow.svg";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const ICON_SIZE = 18;

const JOB_TYPE_ICONS: Record<string, string> = {
  SQL: sqlIcon,
  HIVE: hiveIcon,
  SHELL: shellIcon,
  FLINK: flinkIcon,
  SPARK: sparkIcon,
  workflow: flowIcon,
};

// CSS filter values to colorize black SVG icons
const JOB_TYPE_FILTERS: Record<string, string> = {
  SQL: "invert(37%) sepia(98%) saturate(1000%) hue-rotate(200deg) brightness(100%)",
  HIVE: "invert(70%) sepia(80%) saturate(500%) hue-rotate(5deg) brightness(100%)",
  SHELL: "invert(55%) sepia(60%) saturate(600%) hue-rotate(90deg) brightness(95%)",
  FLINK: "invert(30%) sepia(90%) saturate(1200%) hue-rotate(310deg) brightness(90%)",
  SPARK: "invert(40%) sepia(90%) saturate(1000%) hue-rotate(0deg) brightness(100%)",
  workflow: "invert(30%) sepia(80%) saturate(800%) hue-rotate(240deg) brightness(90%)",
};

function getNodeIcon(node: { type: string }): React.ReactNode {
  const src = JOB_TYPE_ICONS[node.type] ?? flowIcon;
  const filter = JOB_TYPE_FILTERS[node.type];
  return (
    <img src={src} alt={node.type} width={ICON_SIZE} height={ICON_SIZE} style={{ verticalAlign: "middle", filter }} />
  );
}

/** Find a node by ID in the two-level tree structure */
function findNode(treeData: JobTreeNode[], nodeId: string): JobTreeNode | null {
  for (const group of treeData) {
    if (group.id === nodeId) return group;
    const child = group.children?.find((c) => c.id === nodeId);
    if (child) return child;
  }
  return null;
}

interface JobTreeProps {
  searchKeyword?: string;
  typeFilter?: string[];
}

const EMPTY_TYPE_FILTER: string[] = [];

const moreButtonStyle: React.CSSProperties = {
  fontSize: 14,
  padding: "0 4px",
  cursor: "pointer",
  color: "var(--ant-color-text-tertiary)",
  opacity: 0,
  transition: "opacity 0.15s",
};

export default function JobTree({ searchKeyword = "", typeFilter = EMPTY_TYPE_FILTER }: JobTreeProps) {
  const {
    treeData,
    selectedNode,
    treeLoading,
    loadingGroups,
    loadedGroups,
    fetchTree,
    fetchGroupChildren,
    searchTree,
    selectNode,
    addNode,
    removeNode,
  } = useJobStore();
  const { t } = useTranslation();

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  // Subscribe to searchExpandedKeys changes outside render cycle
  useEffect(() => {
    const unsub = useJobStore.subscribe((state, prev) => {
      if (state.searchExpandedKeys && state.searchExpandedKeys !== prev.searchExpandedKeys) {
        setExpandedKeys(state.searchExpandedKeys);
      }
    });
    return unsub;
  }, []);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: JobTreeNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });

  useEffect(() => {
    const handler = () => setContextMenu((prev) => ({ ...prev, visible: false }));
    if (contextMenu.visible) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [contextMenu.visible]);

  useEffect(() => {
    void fetchTree();
  }, [fetchTree]);

  // Server-side search with debounce
  const hasSearch = searchKeyword.trim() !== "" || typeFilter.length > 0;
  useEffect(() => {
    if (!hasSearch) return;

    const timer = setTimeout(() => {
      void searchTree(searchKeyword.trim(), typeFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, typeFilter, searchTree, hasSearch]);

  // Reset to groups view when search is cleared (only if previously searching)
  const hadSearchRef = useRef(false);
  useEffect(() => {
    if (hasSearch) {
      hadSearchRef.current = true;
    } else if (hadSearchRef.current) {
      hadSearchRef.current = false;
      void fetchTree();
    }
  }, [hasSearch, fetchTree]);

  // Auto-expand all groups when search results come back
  const handleAddWorkflow = useCallback(
    (parentId: string) => {
      addNode({ id: generateId("wf"), name: t("workflow.newWorkflow"), type: "workflow", group: parentId });
    },
    [addNode, t],
  );

  const handleAddTask = useCallback(
    (parentId: string) => {
      addNode({ id: generateId("task"), name: t("workflow.newTask"), type: "task", group: parentId });
    },
    [addNode, t],
  );

  const handleDelete = useCallback(
    (node: JobTreeNode) => {
      const isGroup = node.type === "group";
      const childCount = node.children?.length ?? 0;
      const content = isGroup
        ? childCount > 0
          ? t("workflow.confirmDeleteGroup", { name: node.name, count: childCount })
          : t("workflow.confirmDeleteGroupEmpty", { name: node.name })
        : node.type === "task"
          ? t("workflow.confirmDeleteTask", { name: node.name })
          : t("workflow.confirmDeleteWorkflow", { name: node.name });

      Modal.confirm({
        title: t("workflow.confirmDelete"),
        content,
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

  const handleSelect = useCallback(
    (selectedKeys: React.Key[]) => {
      if (selectedKeys.length === 0) {
        selectNode(null);
        return;
      }
      const nodeId = String(selectedKeys[0]);
      const node = findNode(treeData, nodeId);
      if (!node) return;

      if (node.type === "group") {
        const isExpanding = !expandedKeys.includes(nodeId);
        setExpandedKeys((prev) => (prev.includes(nodeId) ? prev.filter((k) => k !== nodeId) : [...prev, nodeId]));
        if (isExpanding && !loadedGroups.has(nodeId)) {
          void fetchGroupChildren(nodeId);
        }
      } else {
        selectNode(node);
      }
    },
    [treeData, selectNode, expandedKeys, loadedGroups, fetchGroupChildren],
  );

  const handleRightClick = useCallback(
    ({ event, node: treeNode }: { event: React.MouseEvent; node: TreeDataNode }) => {
      event.preventDefault();
      event.stopPropagation();
      const nodeId = String(treeNode.key);
      handleSelect([nodeId]);
      const found = findNode(treeData, nodeId);
      if (found) {
        setContextMenu({ visible: true, x: event.clientX, y: event.clientY, node: found });
      }
    },
    [treeData, handleSelect],
  );

  const getMenuItems = useCallback(
    (node: JobTreeNode): MenuProps["items"] => {
      return [
        ...(node.type === "group"
          ? [
              { key: "addWorkflow", icon: <PlusOutlined />, label: t("workflow.addWorkflow") },
              { key: "addTask", icon: <PlayCircleOutlined />, label: t("workflow.addTask") },
            ]
          : []),
        { key: "delete", icon: <DeleteOutlined />, label: t("common.delete"), danger: true },
      ];
    },
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

  const renderTitle = useCallback(
    (name: string, nodeId: string) => {
      const node = findNode(treeData, nodeId);
      if (!node) return name;
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
            {name}
          </span>
          <Dropdown
            menu={{
              items: getMenuItems(node),
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                handleMenuAction(key, node);
              },
            }}
            trigger={["click"]}
          >
            <EllipsisOutlined className="job-tree-more" style={moreButtonStyle} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        </Flex>
      );
    },
    [treeData, getMenuItems, handleMenuAction],
  );

  const buildTreeData = useMemo(() => {
    return (treeData ?? [])
      .map((group) => {
        const isLoading = loadingGroups.has(group.id);
        const isLoaded = loadedGroups.has(group.id);

        return {
          key: group.id,
          title: renderTitle(isLoading ? `${group.name} ...` : group.name, group.id),
          icon: undefined,
          isLeaf: false,
          children:
            isLoaded || group.children?.length
              ? group.children?.map((child) => ({
                  key: child.id,
                  title: renderTitle(child.name, child.id),
                  icon: getNodeIcon(child),
                  isLeaf: true,
                }))
              : undefined,
        };
      })
      .filter(Boolean) as TreeDataNode[];
  }, [treeData, loadingGroups, loadedGroups, renderTitle]);

  const handleExpand = useCallback(
    (keys: React.Key[]) => {
      const newKeys = keys.filter((k) => !expandedKeys.includes(k));
      setExpandedKeys(keys);
      for (const key of newKeys) {
        const groupId = String(key);
        if (!loadedGroups.has(groupId)) {
          void fetchGroupChildren(groupId);
        }
      }
    },
    [expandedKeys, loadedGroups, fetchGroupChildren],
  );

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
          treeData={buildTreeData}
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
