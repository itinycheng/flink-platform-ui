import { Flex, Tooltip } from "antd";
import { SyncOutlined, ApiOutlined, CloudOutlined, ScheduleOutlined } from "@ant-design/icons";
import { SIDEBAR_ICON_SIZE } from "./DAGEditor.constants";
import { TaskIcon, getTaskIcon } from "@/components/TaskIcon";
import React from "react";

/** SVG task icon for the palette, colored via the shared registry. */
function paletteIcon(type: string): React.ReactNode {
  return <TaskIcon type={type} size={SIDEBAR_ICON_SIZE} />;
}

interface SidebarTaskType {
  type: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

const SIDEBAR_TASK_TYPES: SidebarTaskType[] = [
  { type: "sql", label: "SQL", icon: paletteIcon("sql"), color: getTaskIcon("sql").color },
  { type: "shell", label: "Shell", icon: paletteIcon("shell"), color: getTaskIcon("shell").color },
  { type: "spark", label: "Spark", icon: paletteIcon("spark"), color: getTaskIcon("spark").color },
  { type: "flink", label: "Flink", icon: paletteIcon("flink"), color: getTaskIcon("flink").color },
  { type: "sync", label: "Sync", icon: <SyncOutlined style={{ fontSize: SIDEBAR_ICON_SIZE }} />, color: "#faad14" },
  { type: "http", label: "HTTP", icon: <ApiOutlined style={{ fontSize: SIDEBAR_ICON_SIZE }} />, color: "#13c2c2" },
  {
    type: "python",
    label: "Python",
    icon: <CloudOutlined style={{ fontSize: SIDEBAR_ICON_SIZE }} />,
    color: "#2f54eb",
  },
  {
    type: "schedule",
    label: "Timer",
    icon: <ScheduleOutlined style={{ fontSize: SIDEBAR_ICON_SIZE }} />,
    color: "#fa8c16",
  },
  { type: "depend", label: "Depend", icon: paletteIcon("depend"), color: getTaskIcon("depend").color },
  { type: "condition", label: "Condition", icon: paletteIcon("condition"), color: getTaskIcon("condition").color },
  { type: "subflow", label: "SubFlow", icon: paletteIcon("subflow"), color: getTaskIcon("subflow").color },
];

export function TaskSidebar() {
  return (
    <Flex
      vertical
      align="center"
      style={{
        width: 48,
        flexShrink: 0,
        background: "#fff",
        borderTop: "1px solid var(--ant-color-border-secondary)",
        borderRight: "1px solid var(--ant-color-border-secondary)",
        overflowY: "auto",
        scrollbarWidth: "none",
        padding: "5px 0",
        gap: 4,
      }}
    >
      {SIDEBAR_TASK_TYPES.map((item) => (
        <Tooltip key={item.type} title={item.label} placement="right">
          <Flex
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/reactflow-type", item.type);
              e.dataTransfer.setData("application/reactflow-label", item.label);
              e.dataTransfer.effectAllowed = "move";
            }}
            align="center"
            justify="center"
            style={{
              width: 36,
              height: 36,
              cursor: "grab",
              fontSize: 18,
              color: item.color,
              background: "var(--ant-color-bg-container)",
              border: "1px solid var(--ant-color-border-secondary)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (item.color) {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.boxShadow = `0 0 0 1px ${item.color}33`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--ant-color-border-secondary)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {item.icon}
          </Flex>
        </Tooltip>
      ))}
    </Flex>
  );
}
