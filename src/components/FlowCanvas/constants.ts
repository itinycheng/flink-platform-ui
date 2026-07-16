import type React from "react";
import { addEdge, type Connection, type Edge, MarkerType } from "@xyflow/react";

/**
 * Presentational constants for the shared FlowCanvas — edge status colors/labels,
 * handle styling, and the small edge helpers. Business graph seeding (initial
 * nodes/edges) stays with the consuming page, not here.
 */
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

// DAG node/edge selection & hover styling lives in src/global.css
// (.react-flow__* rules) — it's static CSS, so it doesn't belong in JS.

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
