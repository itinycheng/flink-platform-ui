import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Flex, message } from "antd";
import {
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type ReactFlowInstance,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTranslation } from "react-i18next";
import { useJobStore } from "@/stores/jobStore";
import { type DAGEditorProps, getInitialEdges, getInitialNodes } from "./DAGEditor.constants";
import { useBottomPanel, useContextMenu, useDragAndDrop, useNodeEditModal } from "./DAGEditor.hooks";
import { TaskSidebar } from "./DAGEditor.sidebar";
import { BottomPanel } from "./DAGEditor.panels";
import { NodeEditModal } from "./DAGEditor.modal";
import { DAGCanvas } from "./DAGEditor.canvas";

export default function DAGEditor({ embedded = false }: DAGEditorProps) {
  const { id: routeId } = useParams<{ id: string }>();
  const selectedNode = useJobStore((s) => s.selectedNode);
  const [messageApi, contextHolder] = message.useMessage();
  const { t } = useTranslation();

  const workflowId = embedded ? (selectedNode?.id ?? "wf") : (routeId ?? "wf");
  const initialNodes = useMemo(() => getInitialNodes(workflowId, t), [workflowId, t]);
  const initialEdges = useMemo(() => getInitialEdges(workflowId), [workflowId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const editModal = useNodeEditModal({ nodes, setNodes, messageApi });
  const ctx = useContextMenu({
    flowRef,
    setNodes,
    setEdges,
    messageApi,
    t,
    onOpenNodeEdit: editModal.openEditModal,
  });
  const bottom = useBottomPanel({ flowRef });
  const dnd = useDragAndDrop({ reactFlowInstance, workflowId, setNodes });

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "status",
            markerEnd: { type: MarkerType.ArrowClosed, color: "var(--ant-color-text-quaternary, #999)" },
            data: { status: "default" },
          },
          eds,
        ),
      ),
    [setEdges],
  );
  const handleSave = useCallback(() => void messageApi.success(t("dag.flowSaved")), [messageApi, t]);

  return (
    <Flex vertical style={{ height: "100%" }} onClick={ctx.closeContextMenu}>
      {contextHolder}
      {bottom.isResizing && <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "row-resize" }} />}
      <Flex style={{ flex: 1, minHeight: 0 }}>
        <TaskSidebar />
        <Flex vertical style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <DAGCanvas
            embedded={embedded}
            flowRef={flowRef}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={ctx.onNodeContextMenu}
            onEdgeContextMenu={ctx.onEdgeContextMenu}
            onPaneClick={ctx.closeContextMenu}
            onNodeDoubleClick={(_e, node) => bottom.setBottomPanelNode(node)}
            onInit={setReactFlowInstance}
            onDragOver={dnd.onDragOver}
            onDrop={dnd.onDrop}
            onSave={handleSave}
            messageApi={messageApi}
            contextMenu={ctx.contextMenu}
            nodeMenuItems={ctx.nodeMenuItems}
            edgeMenuItems={ctx.edgeMenuItems}
            onMenuClick={ctx.handleMenuClick}
          />
          {bottom.bottomPanelNode && (
            <BottomPanel
              node={bottom.bottomPanelNode}
              panelHeight={bottom.bottomPanelHeight}
              taskParamsMap={bottom.taskParamsMap}
              onResizeMouseDown={bottom.onResizeMouseDown}
              onClose={bottom.closeBottomPanel}
              onParamsChange={bottom.handleBottomTaskParamsChange}
              messageApi={messageApi}
            />
          )}
        </Flex>
      </Flex>
      <NodeEditModal
        open={editModal.open}
        form={editModal.form}
        onSave={editModal.handleSave}
        onCancel={editModal.handleCancel}
      />
    </Flex>
  );
}
