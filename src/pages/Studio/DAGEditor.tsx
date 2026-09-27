import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Flex, message } from "antd";
import { useNodesState, useEdgesState, type Connection, type Node, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTranslation } from "react-i18next";
import { useJobStore } from "@/stores/jobStore";
import { FlowCanvas } from "@/components/FlowCanvas";
import { appendStatusEdge } from "@/components/FlowCanvas/constants";
import { type DAGEditorProps, getInitialEdges, getInitialNodes } from "./DAGEditor.constants";
import {
  useBottomPanel,
  useContextMenu,
  useDragAndDrop,
  useFlowPersistence,
  useNodeEditModal,
} from "./DAGEditor.hooks";
import { BottomPanel, DAGToolbar } from "./DAGEditor.panels";
import { NodeEditModal } from "./DAGEditor.modal";
import { TaskSidebar } from "./DAGEditor.sidebar";

function usedJobIdsOf(nodes: Node[]): Set<number> {
  return new Set(nodes.map((node) => node.data.jobId).filter((id): id is number => typeof id === "number"));
}

// The editor coordinates several small hooks; splitting the JSX orchestration
// would obscure their shared canvas state without reducing component complexity.
// eslint-disable-next-line max-lines-per-function
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
  const [taskListOpen, setTaskListOpen] = useState(true);
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
  const dnd = useDragAndDrop({ reactFlowInstance, setNodes });
  const usedJobIds = useMemo(() => usedJobIdsOf(nodes), [nodes]);

  // Loads a persisted FlowGraph onto the canvas on mount + serializes/saves on demand.
  const { handleSave } = useFlowPersistence({ workflowId, nodes, edges, setNodes, setEdges, messageApi, t });

  const onConnect = useCallback((params: Connection) => setEdges((eds) => appendStatusEdge(params, eds)), [setEdges]);

  return (
    <Flex vertical style={{ height: "100%" }} onClick={ctx.closeContextMenu}>
      {contextHolder}
      {bottom.isResizing && <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "row-resize" }} />}
      <Flex style={{ flex: 1, minHeight: 0 }}>
        {taskListOpen && <TaskSidebar workflowId={workflowId} usedJobIds={usedJobIds} />}
        <Flex vertical style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <FlowCanvas
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
            toolbar={
              <DAGToolbar
                embedded={embedded}
                onSave={() => void handleSave()}
                taskListOpen={taskListOpen}
                onToggleTaskList={() => setTaskListOpen((open) => !open)}
              />
            }
            contextMenu={ctx.contextMenu}
            nodeMenuItems={ctx.nodeMenuItems}
            edgeMenuItems={ctx.edgeMenuItems}
            onMenuClick={ctx.handleMenuClick}
          />
          {bottom.bottomPanelNode && (
            <BottomPanel
              node={bottom.bottomPanelNode}
              panelHeight={bottom.bottomPanelHeight}
              onResizeMouseDown={bottom.onResizeMouseDown}
              onClose={bottom.closeBottomPanel}
              onSaveNode={(nodeId, patch) =>
                setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)))
              }
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
