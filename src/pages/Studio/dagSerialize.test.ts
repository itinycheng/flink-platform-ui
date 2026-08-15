import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import { serializeFlow } from "./dagSerialize";

describe("serializeFlow (new-UI FlowGraph)", () => {
  const nodes: Node[] = [
    {
      id: "wf-1-task1",
      type: "taskNode",
      position: { x: 100.4, y: 40.6 },
      data: { label: "Extract", taskType: "MYSQL_SQL", description: "d", priority: "high" },
    },
    { id: "wf-1-task2", type: "taskNode", position: { x: 400, y: 40 }, data: { label: "Shell", taskType: "SHELL" } },
  ];
  const edges: Edge[] = [
    { id: "e1", source: "wf-1-task1", target: "wf-1-task2", type: "status", data: { status: "SUCCESS" } },
  ];

  it("captures node data + rounded positions", () => {
    const g = serializeFlow(nodes, edges);
    expect(g.nodes).toHaveLength(2);
    expect(g.nodes[0]).toEqual({
      id: "wf-1-task1",
      taskType: "MYSQL_SQL",
      label: "Extract",
      description: "d",
      priority: "high",
      x: 100,
      y: 41,
    });
    // optional fields omitted when absent
    expect(g.nodes[1].description).toBeUndefined();
    expect(g.nodes[1].priority).toBeUndefined();
  });

  it("captures edges with their status (default when absent)", () => {
    const g = serializeFlow(nodes, edges);
    expect(g.edges).toEqual([{ id: "e1", source: "wf-1-task1", target: "wf-1-task2", status: "SUCCESS" }]);
    const g2 = serializeFlow(nodes, [{ id: "e2", source: "wf-1-task1", target: "wf-1-task2" } as Edge]);
    expect(g2.edges[0].status).toBe("default");
  });
});
