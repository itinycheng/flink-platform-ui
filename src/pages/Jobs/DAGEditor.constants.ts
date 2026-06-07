import type React from "react";
import { type Node, type Edge, MarkerType } from "@xyflow/react";
import flinkIcon from "@/assets/flink.svg";
import sparkIcon from "@/assets/spark.svg";
import sqlIcon from "@/assets/sql.svg";
import shellIcon from "@/assets/command.svg";

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

export const TASK_TYPE_ICON_MAP: Record<string, string> = {
  sql: sqlIcon,
  shell: shellIcon,
  spark: sparkIcon,
  flink: flinkIcon,
};

export const SIDEBAR_ICON_SIZE = 24;

const SELECTION_CSS_ID = "dag-selection-styles";
if (typeof document !== "undefined" && !document.getElementById(SELECTION_CSS_ID)) {
  const style = document.createElement("style");
  style.id = SELECTION_CSS_ID;
  style.textContent = `
    .react-flow__node.selected,
    .react-flow__node:focus {
      box-shadow: 0 0 0 2.5px var(--ant-color-primary), 0 2px 8px rgba(22,119,255,0.25);
      border-color: var(--ant-color-primary) !important;
    }
    .react-flow__edge.selected .react-flow__edge-path,
    .react-flow__edge:focus .react-flow__edge-path {
      stroke: var(--ant-color-primary) !important;
      stroke-width: 3 !important;
      filter: drop-shadow(0 0 3px rgba(22,119,255,0.4));
    }
    .react-flow__edge.selected .react-flow__edge-interaction,
    .react-flow__edge:focus .react-flow__edge-interaction {
      stroke: var(--ant-color-primary);
      stroke-opacity: 0.1;
    }
    .react-flow__node:hover:not(.selected) {
      box-shadow: 0 0 0 1.5px var(--ant-color-primary-hover, #69b1ff), 0 1px 4px rgba(22,119,255,0.15);
      transition: box-shadow 0.2s ease;
    }
    .react-flow__edge:hover .react-flow__edge-path {
      stroke-width: 2.5 !important;
      filter: drop-shadow(0 0 2px rgba(22,119,255,0.3));
      transition: stroke-width 0.2s ease, filter 0.2s ease;
    }
    .react-flow__node:hover .react-flow__handle {
      opacity: 1 !important;
    }
    .react-flow__node.selected .react-flow__handle {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

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

export function getEdgeStyle(status: EdgeStatus) {
  return {
    stroke: EDGE_STATUS_COLORS[status],
    strokeWidth: status === "default" ? 1 : 2,
  };
}
