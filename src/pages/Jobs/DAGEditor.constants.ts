import type React from "react";
import { addEdge, type Connection, type Node, type Edge, MarkerType } from "@xyflow/react";

export interface DAGEditorProps {
  embedded?: boolean;
}

export type EdgeStatus = "default" | "success" | "failure";

export const EDGE_STATUS_COLORS: Record<EdgeStatus, string> = {
  default: "var(--ant-color-text-quaternary, #999)",
  success: "#52c41a",
  failure: "#ff4d4f",
};

export const EDGE_STATUS_LABELS: Record<EdgeStatus, { text: string; bg: string } | null> = {
  default: null,
  success: { text: "Success", bg: "#f6ffed" },
  failure: { text: "Failure", bg: "#fff2f0" },
};

export const handleStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  background: "var(--ant-color-primary)",
  border: "2px solid var(--ant-color-bg-container, #fff)",
  opacity: 0,
  transition: "opacity 0.2s ease",
};

export const SIDEBAR_ICON_SIZE = 24;

// DAG node/edge selection & hover styling lives in src/global.css
// (.react-flow__* rules) — it's static CSS, so it doesn't belong in JS.

export function getInitialNodes(workflowId: string, t: (key: string) => string): Node[] {
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

export function getInitialEdges(workflowId: string): Edge[] {
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

/** Append a new "status" edge for a user-drawn connection. */
export function appendStatusEdge(params: Connection, eds: Edge[]): Edge[] {
  return addEdge(
    {
      ...params,
      type: "status",
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--ant-color-text-quaternary, #999)" },
      data: { status: "default" },
    },
    eds,
  );
}

export function getEdgeStyle(status: EdgeStatus) {
  return {
    stroke: EDGE_STATUS_COLORS[status],
    strokeWidth: status === "default" ? 1 : 2,
  };
}
