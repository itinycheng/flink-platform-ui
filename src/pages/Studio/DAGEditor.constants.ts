import { type Node, type Edge, MarkerType } from "@xyflow/react";

export interface DAGEditorProps {
  embedded?: boolean;
}

export const SIDEBAR_ICON_SIZE = 24;

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
