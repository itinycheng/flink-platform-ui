import { Flex, Tooltip } from "antd";
import { SyncOutlined, ApiOutlined, CloudOutlined, ScheduleOutlined } from "@ant-design/icons";
import flinkIcon from "@/assets/flink.svg";
import sparkIcon from "@/assets/spark.svg";
import sqlIcon from "@/assets/sql.svg";
import shellIcon from "@/assets/command.svg";
import dependIcon from "@/assets/depend.svg";
import { SIDEBAR_ICON_SIZE } from "./DAGEditor.constants";
import React from "react";

interface SidebarTaskType {
  type: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

const SIDEBAR_TASK_TYPES: SidebarTaskType[] = [
  {
    type: "sql",
    label: "SQL",
    icon: <img src={sqlIcon} alt="SQL" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
  {
    type: "shell",
    label: "Shell",
    icon: <img src={shellIcon} alt="Shell" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
  {
    type: "spark",
    label: "Spark",
    icon: <img src={sparkIcon} alt="Spark" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
  {
    type: "flink",
    label: "Flink",
    icon: <img src={flinkIcon} alt="Flink" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
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
  {
    type: "depend",
    label: "Depend",
    icon: <img src={dependIcon} alt="Depend" width={SIDEBAR_ICON_SIZE} height={SIDEBAR_ICON_SIZE} />,
  },
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
