import { useState } from "react";
import {
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type NodeProps,
} from "@xyflow/react";
import flowIcon from "@/assets/flow.svg";
import {
  EDGE_STATUS_COLORS,
  EDGE_STATUS_LABELS,
  TASK_TYPE_ICON_MAP,
  handleStyle,
  type EdgeStatus,
} from "./DAGEditor.constants";

export function StatusEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const status = (data?.status as EdgeStatus) || "default";
  const labelInfo = EDGE_STATUS_LABELS[status];

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
      {labelInfo && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              color: EDGE_STATUS_COLORS[status],
              background: labelInfo.bg,
              border: `1px solid ${EDGE_STATUS_COLORS[status]}`,
              padding: "1px 6px",
              lineHeight: "18px",
            }}
            className="nodrag nopan"
          >
            {labelInfo.text}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export function TaskNode({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const desc = data.description as string | undefined;
  const priority = data.priority as string | undefined;
  const taskType = data.taskType as string | undefined;
  const iconSrc = TASK_TYPE_ICON_MAP[taskType ?? ""] ?? flowIcon;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "4px 6px",
        border: selected ? "2px solid var(--ant-color-primary)" : "1px solid var(--ant-color-border, #ddd)",
        background: "var(--ant-color-bg-container, #fff)",
        minWidth: 60,
        textAlign: "center",
        fontSize: 11,
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left-in" style={handleStyle} />
      <img src={iconSrc} alt={taskType ?? "task"} width={20} height={20} style={{ flexShrink: 0 }} />
      {data.label as string}
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right-out" style={handleStyle} />
      {hovered && (desc || priority || taskType) && (
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            transform: "translateX(-50%)",
            marginTop: 6,
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "4px 8px",
            fontSize: 10,
            lineHeight: "14px",
            whiteSpace: "nowrap",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {taskType && <div>Type: {taskType}</div>}
          {priority && <div>Priority: {priority}</div>}
          {desc && <div>{desc}</div>}
        </div>
      )}
    </div>
  );
}
