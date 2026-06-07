import { Dropdown } from "antd";
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
import { StatusEdge, TaskNode } from "./DAGEditor.nodes";
import { DAGToolbar } from "./DAGEditor.panels";
import React from "react";

const edgeTypes = { status: StatusEdge };
const nodeTypes = { taskNode: TaskNode };

interface DAGCanvasProps {
  embedded: boolean;
  flowRef: React.RefObject<HTMLDivElement | null>;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Connection) => void;
  onNodeContextMenu: NodeMouseHandler;
  onEdgeContextMenu: EdgeMouseHandler;
  onPaneClick: () => void;
  onNodeDoubleClick: NodeMouseHandler;
  onInit: (instance: ReactFlowInstance) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onSave: () => void;
  messageApi: MessageInstance;
  contextMenu: { type: "node" | "edge"; id: string; x: number; y: number } | null;
  nodeMenuItems: MenuProps["items"];
  edgeMenuItems: MenuProps["items"];
  onMenuClick: (key: string) => void;
}

export function DAGCanvas({
  embedded,
  flowRef,
  nodes,
  edges,
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
  return (
    <div style={{ flex: 1, position: "relative", minHeight: 0 }} ref={flowRef}>
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
        onPaneClick={onPaneClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onInit={onInit}
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
          <DAGToolbar embedded={embedded} onSave={onSave} messageApi={messageApi} />
        </Panel>
      </ReactFlow>
      {contextMenu && (
        <Dropdown
          open
          menu={{
            items: contextMenu.type === "node" ? nodeMenuItems : edgeMenuItems,
            onClick: ({ key }) => onMenuClick(key),
          }}
          styles={{ root: { position: "fixed" } }}
        >
          <div style={{ position: "absolute", left: contextMenu.x, top: contextMenu.y, width: 1, height: 1 }} />
        </Dropdown>
      )}
    </div>
  );
}
