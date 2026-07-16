import { ConfigProvider, Dropdown } from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type ReactFlowInstance,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import type { MenuProps } from "antd";
import { compactMenuTheme } from "@/theme";
import { StatusEdge, TaskNode } from "./DAGEditor.nodes";
import { DAGToolbar } from "./DAGEditor.panels";
import React from "react";

const edgeTypes = { status: StatusEdge };
const nodeTypes = { taskNode: TaskNode };

function ToolbarPanel({ embedded, onSave, messageApi }: { embedded: boolean; onSave?: () => void; messageApi?: MessageInstance }) {
  if (!onSave || !messageApi) return null;
  return (
    <Panel position="top-right">
      <DAGToolbar embedded={embedded} onSave={onSave} messageApi={messageApi} />
    </Panel>
  );
}

function CanvasContextMenu({
  contextMenu,
  nodeMenuItems,
  edgeMenuItems,
  onMenuClick,
}: Pick<DAGCanvasProps, "contextMenu" | "nodeMenuItems" | "edgeMenuItems" | "onMenuClick">) {
  if (!contextMenu) return null;
  return (
    <ConfigProvider theme={compactMenuTheme}>
      <Dropdown
        open
        menu={{
          items: contextMenu.type === "node" ? nodeMenuItems : edgeMenuItems,
          onClick: ({ key }) => onMenuClick?.(key),
        }}
        styles={{ root: { position: "fixed" } }}
      >
        <div style={{ position: "absolute", left: contextMenu.x, top: contextMenu.y, width: 1, height: 1 }} />
      </Dropdown>
    </ConfigProvider>
  );
}

interface DAGCanvasProps {
  nodes: Node[];
  edges: Edge[];
  /** Read-only mode disables editing (drag/connect/context menu/toolbar) — used by the run graph. */
  readOnly?: boolean;
  onNodeClick?: NodeMouseHandler;
  embedded?: boolean;
  flowRef?: React.RefObject<HTMLDivElement | null>;
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: (params: Connection) => void;
  onNodeContextMenu?: NodeMouseHandler;
  onEdgeContextMenu?: EdgeMouseHandler;
  onPaneClick?: () => void;
  onNodeDoubleClick?: NodeMouseHandler;
  onInit?: (instance: ReactFlowInstance) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onSave?: () => void;
  messageApi?: MessageInstance;
  contextMenu?: { type: "node" | "edge"; id: string; x: number; y: number } | null;
  nodeMenuItems?: MenuProps["items"];
  edgeMenuItems?: MenuProps["items"];
  onMenuClick?: (key: string) => void;
}

export function DAGCanvas({
  nodes,
  edges,
  readOnly = false,
  onNodeClick,
  embedded = false,
  flowRef,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeContextMenu,
  onEdgeContextMenu,
  onPaneClick,
  onNodeDoubleClick,
  onInit,
  onDragOver,
  onDrop,
  onSave,
  messageApi,
  contextMenu,
  nodeMenuItems,
  edgeMenuItems,
  onMenuClick,
}: DAGCanvasProps) {
  // Editing-only handlers — omitted entirely in read-only mode (run graph).
  const editHandlers = readOnly
    ? {}
    : { onConnect, onNodeContextMenu, onEdgeContextMenu, onNodeDoubleClick, onDragOver, onDrop };

  return (
    <div style={{ flex: 1, position: "relative", minHeight: 0 }} ref={flowRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={onInit}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        nodesFocusable={!readOnly}
        {...editHandlers}
        fitView
        fitViewOptions={{ maxZoom: 1, minZoom: 0.5 }}
        style={{ background: "#fff" }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={!readOnly} />
        <MiniMap nodeStrokeWidth={3} />
        {!readOnly && <ToolbarPanel embedded={embedded} onSave={onSave} messageApi={messageApi} />}
      </ReactFlow>
      {!readOnly && (
        <CanvasContextMenu
          contextMenu={contextMenu}
          nodeMenuItems={nodeMenuItems}
          edgeMenuItems={edgeMenuItems}
          onMenuClick={onMenuClick}
        />
      )}
    </div>
  );
}
