import { useState } from "react";
import { Drawer, Flex } from "antd";
import { useTranslation } from "react-i18next";
import type { JobTreeNode } from "@/types/job";
import DAGEditor from "@/pages/Studio/DAGEditor";
import JobForm from "@/pages/Studio/JobForm";
import SchedulePanel from "./SchedulePanel";
import ParamsPanel from "./ParamsPanel";

type PanelKey = "schedule" | "params";

interface PanelDef {
  key: PanelKey;
  titleKey: string;
}

const PANELS: PanelDef[] = [
  { key: "schedule", titleKey: "sidePanel.schedule" },
  { key: "params", titleKey: "sidePanel.params" },
];

const BAR_WIDTH = 24;

interface PanelBarItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function PanelBarItem({ label, isActive, onClick }: PanelBarItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        padding: "8px 4px",
        cursor: "pointer",
        fontSize: 12,
        letterSpacing: 1,
        whiteSpace: "nowrap",
        borderRadius: 3,
        background: isActive ? "var(--ant-color-primary-bg)" : "transparent",
        color: isActive ? "var(--ant-color-primary)" : "var(--ant-color-text-tertiary)",
        fontWeight: isActive ? 500 : 400,
        transition: "all 0.15s",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}

export default function JobTabWrapper({ node }: { node: JobTreeNode }) {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);

  const toggle = (key: PanelKey) => {
    setActivePanel((prev) => (prev === key ? null : key));
  };

  return (
    <Flex style={{ height: "100%", overflow: "hidden" }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {node.type === "workflow" ? <DAGEditor embedded /> : <JobForm taskType={node.type} />}
        <Drawer
          title={activePanel ? t(`sidePanel.${activePanel}`) : ""}
          placement="right"
          open={activePanel !== null}
          onClose={() => setActivePanel(null)}
          getContainer={false}
          closable={false}
          mask={false}
          size={320}
          styles={{
            body: { padding: "12px 16px" },
            header: { padding: "12px 16px" },
            wrapper: {
              boxShadow: "var(--ant-box-shadow-secondary)",
              borderLeft: "1px solid var(--ant-color-border-secondary)",
            },
          }}
        >
          {activePanel === "schedule" && <SchedulePanel />}
          {activePanel === "params" && <ParamsPanel />}
        </Drawer>
      </div>

      {/* Right text bar */}
      <Flex
        vertical
        align="center"
        style={{
          width: BAR_WIDTH,
          flexShrink: 0,
          borderLeft: "1px solid var(--ant-color-border-secondary)",
          background: "var(--ant-color-bg-layout)",
          paddingTop: 8,
          gap: 0,
        }}
      >
        {PANELS.map((panel) => (
          <PanelBarItem
            key={panel.key}
            label={t(panel.titleKey)}
            isActive={activePanel === panel.key}
            onClick={() => toggle(panel.key)}
          />
        ))}
      </Flex>
    </Flex>
  );
}
