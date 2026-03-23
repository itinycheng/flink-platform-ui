import JobTree from "@/pages/Jobs/JobTree";
import { useJobStore } from "@/stores/jobStore";
import type { JobTreeNode } from "@/types/job";
import {
  SearchOutlined,
  ApartmentOutlined,
  WarningOutlined,
  DeleteOutlined,
  FolderAddOutlined,
} from "@ant-design/icons";
import { Button, Divider, Flex, Input, Tag, Tooltip, Typography } from "antd";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const JOB_TYPE_FILTERS = [
  { label: "FLOW", value: "workflow" },
  { label: "SQL", value: "sql" },
  { label: "Shell", value: "shell" },
  { label: "Spark", value: "spark" },
  { label: "Flink", value: "flink" },
];

type PanelKey = "tree" | "search" | "errors" | "trash";

const PANELS: { key: PanelKey; icon: React.ReactNode; tooltip: string }[] = [
  { key: "tree", icon: <ApartmentOutlined />, tooltip: "sider.tree" },
  { key: "search", icon: <SearchOutlined />, tooltip: "sider.search" },
  { key: "errors", icon: <WarningOutlined />, tooltip: "sider.errors" },
  { key: "trash", icon: <DeleteOutlined />, tooltip: "sider.trash" },
];

const ICON_BAR_WIDTH = 45;

const iconStyle: React.CSSProperties = {
  width: ICON_BAR_WIDTH,
  height: ICON_BAR_WIDTH,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 16,
  borderRadius: 2,
  transition: "all 0.15s",
};

const iconActiveStyle: React.CSSProperties = {
  ...iconStyle,
  borderLeft: "2px solid #168eff",
  color: "var(--ant-color-text)",
};

const iconInactiveStyle: React.CSSProperties = {
  ...iconStyle,
  borderLeft: "2px solid transparent",
  color: "var(--ant-color-text-tertiary)",
};

export default function SiderPanel() {
  const { t } = useTranslation();
  const addNode = useJobStore((s) => s.addNode);
  const [activePanel, setActivePanel] = useState<PanelKey | null>("tree");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const handleAddGroup = () => {
    const newGroup: JobTreeNode = {
      id: generateId("group"),
      name: t("workflow.newGroup"),
      type: "group",
      group: "",
      children: [],
    };
    addNode(newGroup);
  };

  const toggleTypeFilter = useCallback((value: string) => {
    setTypeFilter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }, []);

  const handlePanelClick = useCallback((key: PanelKey) => {
    setActivePanel((prev) => (prev === key ? null : key));
  }, []);

  return (
    <Flex style={{ height: "100%", overflow: "hidden" }}>
      {/* Activity Bar */}
      <Flex
        vertical
        align="center"
        style={{
          width: ICON_BAR_WIDTH,
          flexShrink: 0,
          paddingTop: 4,
          gap: 2,
          background: "var(--ant-color-bg-layout)",
          borderRight: "1px solid var(--ant-color-border-secondary)",
        }}
      >
        {PANELS.map((panel) => (
          <Tooltip key={panel.key} title={t(panel.tooltip)} placement="right">
            <div
              style={activePanel === panel.key ? iconActiveStyle : iconInactiveStyle}
              onClick={() => handlePanelClick(panel.key)}
            >
              {panel.icon}
            </div>
          </Tooltip>
        ))}
      </Flex>

      {/* Panel Content — hidden when collapsed */}
      {activePanel && (
        <Flex
          vertical
          style={{
            width: 240,
            flexShrink: 0,
            overflow: "hidden",
            borderRight: "1px solid var(--ant-color-border-secondary)",
          }}
        >
          {activePanel === "tree" && <TreePanel onAddGroup={handleAddGroup} />}
          {activePanel === "search" && (
            <SearchPanel
              searchKeyword={searchKeyword}
              typeFilter={typeFilter}
              onSearchChange={setSearchKeyword}
              onToggleType={toggleTypeFilter}
            />
          )}
          {activePanel === "errors" && <ErrorsPanel />}
          {activePanel === "trash" && <TrashPanel />}
        </Flex>
      )}
    </Flex>
  );
}

/** Tree panel — job tree with add group button */
function TreePanel({ onAddGroup }: { onAddGroup: () => void }) {
  const { t } = useTranslation();
  return (
    <Flex vertical style={{ height: "100%", padding: "4px 4px 0" }}>
      <Typography.Text strong style={{ fontSize: 14, paddingInline: 4, flexShrink: 0 }}>
        {t("sider.jobs")}
      </Typography.Text>
      <Flex gap={4} style={{ flexShrink: 0, padding: "6px 4px" }}>
        <Button type="dashed" size="small" icon={<FolderAddOutlined />} onClick={onAddGroup} block>
          {t("workflow.addGroup")}
        </Button>
      </Flex>
      <Divider style={{ margin: "2px 0 6px" }} />
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <JobTree />
      </div>
    </Flex>
  );
}

/** Search panel — keyword + type filter + results */
function SearchPanel({
  searchKeyword,
  typeFilter,
  onSearchChange,
  onToggleType,
}: {
  searchKeyword: string;
  typeFilter: string[];
  onSearchChange: (v: string) => void;
  onToggleType: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Flex vertical style={{ height: "100%", padding: "4px 4px 0" }}>
      <Flex vertical style={{ flexShrink: 0, paddingInline: 4, gap: 8 }}>
        <Typography.Text strong style={{ fontSize: 12 }}>
          {t("sider.search")}
        </Typography.Text>
        <Input
          placeholder={t("workflow.searchPlaceholder")}
          prefix={<SearchOutlined />}
          allowClear
          size="small"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
        <Flex wrap gap={4}>
          {JOB_TYPE_FILTERS.map((item) => (
            <Tag
              key={item.value}
              color={typeFilter.includes(item.value) ? "blue" : undefined}
              onClick={() => onToggleType(item.value)}
              style={{ cursor: "pointer", margin: 0 }}
            >
              {item.label}
            </Tag>
          ))}
        </Flex>
      </Flex>
      <Divider style={{ margin: "6px 0" }} />
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {searchKeyword.trim() || typeFilter.length > 0 ? (
          <JobTree searchKeyword={searchKeyword} typeFilter={typeFilter} />
        ) : (
          <Flex vertical align="center" justify="center" style={{ height: "100%", opacity: 0.4 }}>
            <SearchOutlined style={{ fontSize: 24 }} />
            <Typography.Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
              {t("workflow.searchPlaceholder")}
            </Typography.Text>
          </Flex>
        )}
      </div>
    </Flex>
  );
}

/** Errors panel — placeholder for failed job list */
function ErrorsPanel() {
  const { t } = useTranslation();
  return (
    <Flex vertical align="center" justify="center" style={{ height: "100%", padding: 16 }}>
      <WarningOutlined style={{ fontSize: 24, color: "var(--ant-color-text-quaternary)" }} />
      <Typography.Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
        {t("sider.noErrors")}
      </Typography.Text>
    </Flex>
  );
}

/** Trash panel — placeholder for deleted jobs */
function TrashPanel() {
  const { t } = useTranslation();
  return (
    <Flex vertical align="center" justify="center" style={{ height: "100%", padding: 16 }}>
      <DeleteOutlined style={{ fontSize: 24, color: "var(--ant-color-text-quaternary)" }} />
      <Typography.Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
        {t("sider.trashEmpty")}
      </Typography.Text>
    </Flex>
  );
}
