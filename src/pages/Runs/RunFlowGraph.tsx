import { useMemo } from "react";
import { type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DAGCanvas } from "@/pages/Studio/DAGEditor.canvas";
import type { RunGraph } from "@/types/run";

interface RunFlowGraphProps {
  graph: RunGraph;
  onNodeClick?: (nodeId: string) => void;
}

/** Read-only DAG of a flow run — reuses the Studio canvas + node components,
 *  with each node colored by its run status. */
export function RunFlowGraph({ graph, onNodeClick }: RunFlowGraphProps) {
  const nodes = useMemo<Node[]>(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: "taskNode",
        position: { x: n.x, y: n.y },
        data: { label: n.label, taskType: n.type, status: n.status },
      })),
    [graph],
  );
  const edges = useMemo<Edge[]>(
    () => graph.edges.map((e, i) => ({ id: `e-${i}`, source: e.source, target: e.target, type: "status" })),
    [graph],
  );

  return (
    <div style={{ display: "flex", height: 320, border: "1px solid var(--ant-color-border-secondary)" }}>
      <DAGCanvas nodes={nodes} edges={edges} readOnly onNodeClick={(_, node) => onNodeClick?.(node.id)} />
    </div>
  );
}
