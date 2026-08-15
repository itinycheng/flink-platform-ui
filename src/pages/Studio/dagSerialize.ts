import type { Node, Edge } from "@xyflow/react";
import type { FlowGraph, FlowNode, FlowEdge } from "@/types/flow";

/**
 * Serialize the new-UI XYFlow canvas into a {@link FlowGraph} for
 * `POST /jobFlow/updateFlow`. Faithful to the canvas (node data + positions +
 * edges), not the legacy vertex/jobId model — the backend accepts both.
 */
function nodeData(node: Node): Record<string, unknown> {
  return (node.data ?? {}) as Record<string, unknown>;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function serializeFlow(nodes: Node[], edges: Edge[]): FlowGraph {
  const flowNodes: FlowNode[] = nodes.map((n) => {
    const data = nodeData(n);
    return {
      id: n.id,
      taskType: str(data.taskType),
      label: str(data.label),
      description: str(data.description) || undefined,
      priority: str(data.priority) || undefined,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
    };
  });

  const flowEdges: FlowEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    status: str((e.data as { status?: string } | undefined)?.status, "default"),
  }));

  return { nodes: flowNodes, edges: flowEdges };
}
