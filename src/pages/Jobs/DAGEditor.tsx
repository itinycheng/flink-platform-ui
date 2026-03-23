import { useCallback, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, message, Dropdown, Modal, Form, Input, Select, Tooltip, Flex, Typography } from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SyncOutlined,
  ApiOutlined,
  CloudOutlined,
  ScheduleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import flinkIcon from "@/assets/flink.svg";
import sparkIcon from "@/assets/spark.svg";
import sqlIcon from "@/assets/sql.svg";
import shellIcon from "@/assets/command.svg";
import flowIcon from "@/assets/flow.svg";
import dependIcon from "@/assets/depend.svg";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Connection,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeProps,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type ReactFlowInstance,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useJobStore } from "@/stores/jobStore";

/* Selection styles injected as a <style> tag via CSS-in-JS isn't ideal,
   so we use a plain CSS string appended once. */
const SELECTION_CSS_ID = "dag-selection-styles";
if (typeof document !== "undefined" && !document.getElementById(SELECTION_CSS_ID)) {
  const style = document.createElement("style");
  style.id = SELECTION_CSS_ID;
  style.textContent = `
    /* Selected node: blue glow + thicker border */
    .react-flow__node.selected,
    .react-flow__node:focus {
      box-shadow: 0 0 0 2.5px var(--ant-color-primary), 0 2px 8px rgba(22,119,255,0.25);
      border-color: var(--ant-color-primary) !important;
    }
    /* Selected edge: thicker + blue stroke */
    .react-flow__edge.selected .react-flow__edge-path,
    .react-flow__edge:focus .react-flow__edge-path {
      stroke: var(--ant-color-primary) !important;
      stroke-width: 3 !important;
      filter: drop-shadow(0 0 3px rgba(22,119,255,0.4));
    }
    /* Interaction path (invisible wider hit area) also gets highlight */
    .react-flow__edge.selected .react-flow__edge-interaction,
    .react-flow__edge:focus .react-flow__edge-interaction {
      stroke: var(--ant-color-primary);
      stroke-opacity: 0.1;
    }
    /* Hover hint for nodes */
    .react-flow__node:hover:not(.selected) {
      box-shadow: 0 0 0 1.5px var(--ant-color-primary-hover, #69b1ff), 0 1px 4px rgba(22,119,255,0.15);
      transition: box-shadow 0.2s ease;
    }
    /* Hover hint for edges */
    .react-flow__edge:hover .react-flow__edge-path {
      stroke-width: 2.5 !important;
      filter: drop-shadow(0 0 2px rgba(22,119,255,0.3));
      transition: stroke-width 0.2s ease, filter 0.2s ease;
    }
    /* Show handles on node hover */
    .react-flow__node:hover .react-flow__handle {
      opacity: 1 !important;
    }
    .react-flow__node.selected .react-flow__handle {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

interface DAGEditorProps {
  embedded?: boolean;
}

type EdgeStatus = "default" | "success" | "failure";

const EDGE_STATUS_COLORS: Record<EdgeStatus, string> = {
  default: "var(--ant-color-text-quaternary, #999)",
  success: "#52c41a",
  failure: "#ff4d4f",
};

const EDGE_STATUS_LABELS: Record<EdgeStatus, { text: string; bg: string } | null> = {
  default: null,
  success: { text: "Success", bg: "#f6ffed" },
  failure: { text: "Failure", bg: "#fff2f0" },
};

/** Custom edge that renders a status label badge at the midpoint */
function StatusEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const status = (data?.status as EdgeStatus) || "default";
  const labelInfo = EDGE_STATUS_LABELS[status];

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
      {labelInfo && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              color: EDGE_STATUS_COLORS[status],
              background: labelInfo.bg,
              border: `1px solid ${EDGE_STATUS_COLORS[status]}`,
              padding: "1px 6px",
              lineHeight: "18px",
            }}
            className="nodrag nopan"
          >
            {labelInfo.text}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { status: StatusEdge };

/** Shared handle style — invisible by default, visible on node hover */
const handleStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  background: "var(--ant-color-primary)",
  border: "2px solid var(--ant-color-bg-container, #fff)",
  opacity: 0,
  transition: "opacity 0.2s ease",
};

const TASK_TYPE_ICON_MAP: Record<string, string> = {
  sql: sqlIcon,
  shell: shellIcon,
  spark: sparkIcon,
  flink: flinkIcon,
};

/** Task node with handles on all 4 sides */
function TaskNode({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const desc = data.description as string | undefined;
  const priority = data.priority as string | undefined;
  const taskType = data.taskType as string | undefined;
  const iconSrc = TASK_TYPE_ICON_MAP[taskType ?? ""] ?? flowIcon;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "4px 6px",
        border: selected ? "2px solid var(--ant-color-primary)" : "1px solid var(--ant-color-border, #ddd)",
        background: "var(--ant-color-bg-container, #fff)",
        minWidth: 60,
        textAlign: "center",
        fontSize: 11,
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left-in" style={handleStyle} />
      <img src={iconSrc} alt={taskType ?? "task"} width={20} height={20} style={{ flexShrink: 0 }} />
      {data.label as string}
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right-out" style={handleStyle} />
      {hovered && (desc || priority || taskType) && (
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            transform: "translateX(-50%)",
            marginTop: 6,
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "4px 8px",
            fontSize: 10,
            lineHeight: "14px",
            whiteSpace: "nowrap",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {taskType && <div>Type: {taskType}</div>}
          {priority && <div>Priority: {priority}</div>}
          {desc && <div>{desc}</div>}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { taskNode: TaskNode };

function getInitialNodes(workflowId: string, t: (key: string) => string): Node[] {
  return [
    {
      id: `${workflowId}-task1`,
      type: "taskNode",
      data: {
        label: t("dag.dataExtract"),
        nodeType: "task",
        taskType: "sql",
        description: t("dag.extractDesc"),
        priority: "medium",
      },
      position: { x: 100, y: 40 },
    },
    {
      id: `${workflowId}-task2`,
      type: "taskNode",
      data: {
        label: t("dag.dataClean"),
        nodeType: "task",
        taskType: "shell",
        description: t("dag.cleanDesc"),
        priority: "medium",
      },
      position: { x: 400, y: 40 },
    },
    {
      id: `${workflowId}-task3`,
      type: "taskNode",
      data: {
        label: t("dag.dataAggregate"),
        nodeType: "task",
        taskType: "spark",
        description: t("dag.aggregateDesc"),
        priority: "high",
      },
      position: { x: 250, y: 160 },
    },
  ];
}

function getInitialEdges(workflowId: string): Edge[] {
  const markerEnd = {
    type: MarkerType.ArrowClosed,
    color: "var(--ant-color-text-quaternary, #999)",
  };
  return [
    {
      id: "e-t1-t3",
      type: "status",
      source: `${workflowId}-task1`,
      target: `${workflowId}-task3`,
      markerEnd,
      data: { status: "default" },
    },
    {
      id: "e-t2-t3",
      type: "status",
      source: `${workflowId}-task2`,
      target: `${workflowId}-task3`,
      markerEnd,
      data: { status: "default" },
    },
  ];
}

function getEdgeStyle(status: EdgeStatus) {
  return {
    stroke: EDGE_STATUS_COLORS[status],
    strokeWidth: status === "default" ? 1 : 2,
  };
}

/** Draggable task types for the sidebar */
const SIDEBAR_ICON_SIZE = 24;

const SIDEBAR_TASK_TYPES = [
  {
    type: "sql",
    label: "SQL",
    icon: <img src={sqlIcon} alt="SQL" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
  {
    type: "shell",
    label: "Shell",
    icon: <img src={shellIcon} alt="Shell" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
  {
    type: "spark",
    label: "Spark",
    icon: <img src={sparkIcon} alt="Spark" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
  {
    type: "flink",
    label: "Flink",
    icon: <img src={flinkIcon} alt="Flink" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
  { type: "sync", label: "Sync", icon: <SyncOutlined style={{ fontSize: SIDEBAR_ICON_SIZE }} />, color: "#faad14" },
  { type: "http", label: "HTTP", icon: <ApiOutlined style={{ fontSize: SIDEBAR_ICON_SIZE }} />, color: "#13c2c2" },
  {
    type: "python",
    label: "Python",
    icon: <CloudOutlined style={{ fontSize: SIDEBAR_ICON_SIZE }} />,
    color: "#2f54eb",
  },
  {
    type: "schedule",
    label: "Timer",
    icon: <ScheduleOutlined style={{ fontSize: SIDEBAR_ICON_SIZE }} />,
    color: "#fa8c16",
  },
  {
    type: "depend",
    label: "Depend",
    icon: <img src={dependIcon} alt="Depend" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
];

export default function DAGEditor({ embedded = false }: DAGEditorProps) {
  const { id: routeId } = useParams<{ id: string }>();
  const selectedNode = useJobStore((s) => s.selectedNode);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [nodeCount, setNodeCount] = useState(4);
  const { t } = useTranslation();

  const workflowId = embedded ? (selectedNode?.id ?? "wf") : (routeId ?? "wf");

  const initialNodes = useMemo(() => getInitialNodes(workflowId, t), [workflowId, t]);
  const initialEdges = useMemo(() => getInitialEdges(workflowId), [workflowId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Drag-and-drop from sidebar
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const taskType = event.dataTransfer.getData("application/reactflow-type");
      const taskLabel = event.dataTransfer.getData("application/reactflow-label");
      if (!taskType || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newId = `${workflowId}-task${nodeCount + 1}`;
      const newNode: Node = {
        id: newId,
        type: "taskNode",
        data: {
          label: `${taskLabel} ${nodeCount + 1}`,
          nodeType: "task",
          taskType,
          description: "",
          priority: "medium",
        },
        position,
      };
      setNodes((nds) => [...nds, newNode]);
      setNodeCount((c) => c + 1);
    },
    [reactFlowInstance, workflowId, nodeCount, setNodes],
  );

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    type: "node" | "edge";
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  // Node edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editForm] = Form.useForm();

  // Close context menu
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "status",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "var(--ant-color-text-quaternary, #999)",
            },
            data: { status: "default" },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // Right-click on node
  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    const bounds = flowRef.current?.getBoundingClientRect();
    setContextMenu({
      type: "node",
      id: node.id,
      x: event.clientX - (bounds?.left ?? 0),
      y: event.clientY - (bounds?.top ?? 0),
    });
  }, []);

  // Right-click on edge
  const onEdgeContextMenu: EdgeMouseHandler = useCallback((event, edge) => {
    event.preventDefault();
    const bounds = flowRef.current?.getBoundingClientRect();
    setContextMenu({
      type: "edge",
      id: edge.id,
      x: event.clientX - (bounds?.left ?? 0),
      y: event.clientY - (bounds?.top ?? 0),
    });
  }, []);

  // Edge context menu actions
  const setEdgeStatus = useCallback(
    (edgeId: string, status: EdgeStatus) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId
            ? {
                ...e,
                style: getEdgeStyle(status),
                animated: status === "default",
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: EDGE_STATUS_COLORS[status],
                },
                data: { ...e.data, status },
              }
            : e,
        ),
      );
      closeContextMenu();
    },
    [setEdges, closeContextMenu],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      closeContextMenu();
      void messageApi.success(t("dag.edgeDeleted"));
    },
    [setEdges, closeContextMenu, messageApi, t],
  );

  // Node context menu actions
  const openEditModal = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setEditingNode(node);
      editForm.setFieldsValue({
        label: node.data.label,
        description: node.data.description || "",
        priority: node.data.priority || "medium",
      });
      setEditModalOpen(true);
      closeContextMenu();
    },
    [nodes, editForm, closeContextMenu],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      closeContextMenu();
      void messageApi.success(t("dag.nodeDeleted"));
    },
    [setNodes, setEdges, closeContextMenu, messageApi, t],
  );

  // Save node edit
  const handleEditSave = useCallback(() => {
    if (!editingNode) return;
    const values = editForm.getFieldsValue();
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                label: values.label,
                description: values.description,
                priority: values.priority,
              },
            }
          : n,
      ),
    );
    setEditModalOpen(false);
    setEditingNode(null);
    void messageApi.success(t("dag.nodeUpdated"));
  }, [editingNode, editForm, setNodes, messageApi, t]);

  const handleSave = useCallback(() => {
    void messageApi.success(t("dag.flowSaved"));
  }, [messageApi, t]);

  // Build context menu items
  const nodeMenuItems: MenuProps["items"] =
    contextMenu?.type === "node"
      ? [
          { key: "edit", label: t("dag.editNode") },
          { type: "divider" },
          { key: "delete", label: t("dag.deleteNode"), danger: true },
        ]
      : [];

  const edgeMenuItems: MenuProps["items"] =
    contextMenu?.type === "edge"
      ? [
          { key: "success", label: t("dag.setSuccess") },
          { key: "failure", label: t("dag.setFailure") },
          { key: "reset", label: t("dag.resetStatus") },
          { type: "divider" },
          { key: "delete", label: t("dag.deleteEdge"), danger: true },
        ]
      : [];

  const handleMenuClick = useCallback(
    (key: string) => {
      if (!contextMenu) return;
      if (contextMenu.type === "node") {
        if (key === "edit") openEditModal(contextMenu.id);
        else if (key === "delete") deleteNode(contextMenu.id);
      } else {
        if (key === "success") setEdgeStatus(contextMenu.id, "success");
        else if (key === "failure") setEdgeStatus(contextMenu.id, "failure");
        else if (key === "reset") setEdgeStatus(contextMenu.id, "default");
        else if (key === "delete") deleteEdge(contextMenu.id);
      }
    },
    [contextMenu, openEditModal, deleteNode, setEdgeStatus, deleteEdge],
  );

  return (
    <Flex vertical style={{ height: "100%" }} onClick={closeContextMenu}>
      {contextHolder}

      <Flex style={{ flex: 1, position: "relative" }}>
        {/* Task type sidebar */}
        <Flex
          vertical
          align="center"
          style={{
            width: 48,
            flexShrink: 0,
            background: "#fff",
            marginTop: -1,
            borderTop: "1px solid var(--ant-color-border-secondary)",
            borderRight: "1px solid var(--ant-color-border-secondary)",
            overflowY: "auto",
            padding: "5px 0",
            gap: 4,
          }}
        >
          {SIDEBAR_TASK_TYPES.map((item) => (
            <Tooltip key={item.type} title={item.label} placement="right">
              <Flex
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/reactflow-type", item.type);
                  e.dataTransfer.setData("application/reactflow-label", item.label);
                  e.dataTransfer.effectAllowed = "move";
                }}
                align="center"
                justify="center"
                style={{
                  width: 36,
                  height: 36,
                  cursor: "grab",
                  fontSize: 18,
                  color: item.color,
                  background: "var(--ant-color-bg-container)",
                  border: "1px solid var(--ant-color-border-secondary)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (item.color) {
                    e.currentTarget.style.borderColor = item.color;
                    e.currentTarget.style.boxShadow = `0 0 0 1px ${item.color}33`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--ant-color-border-secondary)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {item.icon}
              </Flex>
            </Tooltip>
          ))}
        </Flex>

        {/* Canvas */}
        <div style={{ flex: 1, position: "relative" }} ref={flowRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={closeContextMenu}
            onInit={setReactFlowInstance}
            onDragOver={onDragOver}
            onDrop={onDrop}
            fitView
            fitViewOptions={{ maxZoom: 1, minZoom: 1 }}
            style={{ background: "#fff" }}
          >
            <Background gap={16} size={1} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} />
            <Panel position="top-right">
              <Flex
                style={{
                  background: "var(--ant-color-bg-container, #fff)",
                  padding: "4px 6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {!embedded && (
                  <Tooltip title={t("common.back")}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/workflow")} />
                  </Tooltip>
                )}
                <Tooltip title={t("dag.saveFlow")}>
                  <Button
                    type="text"
                    icon={<SaveOutlined style={{ color: "var(--ant-color-primary)" }} />}
                    onClick={handleSave}
                  />
                </Tooltip>
                <Tooltip title={t("dag.settings")}>
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={() => void messageApi.info(t("dag.settingsHint"))}
                  />
                </Tooltip>
                <Tooltip title={t("dag.taskList")}>
                  <Button
                    type="text"
                    icon={<UnorderedListOutlined />}
                    onClick={() => void messageApi.info(t("dag.taskListHint"))}
                  />
                </Tooltip>
              </Flex>
            </Panel>
            <Panel position="bottom-center">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t("dag.hint")}
              </Typography.Text>
            </Panel>
          </ReactFlow>

          {/* Context Menu */}
          {contextMenu && (
            <Dropdown
              open
              menu={{
                items: contextMenu.type === "node" ? nodeMenuItems : edgeMenuItems,
                onClick: ({ key }) => handleMenuClick(key),
              }}
              styles={{ root: { position: "fixed" } }}
            >
              <div
                style={{
                  position: "absolute",
                  left: contextMenu.x,
                  top: contextMenu.y,
                  width: 1,
                  height: 1,
                }}
              />
            </Dropdown>
          )}
        </div>
      </Flex>

      {/* Node Edit Modal */}
      <Modal
        title={t("dag.editTaskNode")}
        open={editModalOpen}
        onOk={handleEditSave}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingNode(null);
        }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label={t("dag.taskName")}
            name="label"
            rules={[{ required: true, message: t("dag.taskNameRequired") }]}
          >
            <Input placeholder={t("dag.taskNamePlaceholder")} />
          </Form.Item>
          <Form.Item label={t("dag.taskDescription")} name="description">
            <Input.TextArea rows={3} placeholder={t("dag.taskDescPlaceholder")} />
          </Form.Item>
          <Form.Item label={t("dag.priority")} name="priority">
            <Select
              options={[
                { value: "low", label: t("dag.priorityLow") },
                { value: "medium", label: t("dag.priorityMedium") },
                { value: "high", label: t("dag.priorityHigh") },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}
