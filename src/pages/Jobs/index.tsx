import { ConfigProvider, Flex, Tabs, Typography, type ThemeConfig } from "antd";
import { InboxOutlined, CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useJobStore, findNodeById } from "@/stores/jobStore";
import SiderPanel from "@/pages/Jobs/Sider";
import JobTabWrapper from "@/pages/Jobs/JobTabWrapper";
import flinkIcon from "@/assets/flink.svg";
import sparkIcon from "@/assets/spark.svg";
import sqlIcon from "@/assets/sql.svg";
import shellIcon from "@/assets/command.svg";
import flowIcon from "@/assets/flow.svg";

const tabTheme: ThemeConfig = {
  components: {
    Tabs: {
      horizontalMargin: "0",
      titleFontSize: 13,
      cardBg: "var(--ant-color-bg-layout)",
      cardHeight: 35,
      cardPadding: "4px 12px",
      cardGutter: -1,
      itemColor: "var(--ant-color-text-secondary)",
    },
  },
};

const TAB_ICON_MAP: Record<string, string> = {
  SQL: sqlIcon,
  SHELL: shellIcon,
  FLINK: flinkIcon,
  SPARK: sparkIcon,
  workflow: flowIcon,
};

function getTabIcon(jobType: string): React.ReactNode {
  const src = TAB_ICON_MAP[jobType] ?? flowIcon;
  return <img src={src} alt={jobType} width={16} height={16} style={{ verticalAlign: "middle", marginRight: 4 }} />;
}

export default function JobsPage() {
  const { selectedNode, treeData, openTabs, activeTabKey, closeTab, setActiveTab } = useJobStore();
  const { t } = useTranslation();

  const breadcrumbItems = [{ title: t("nav.workflow") }];
  if (selectedNode?.group) {
    const parent = findNodeById(treeData, selectedNode.group);
    if (parent) breadcrumbItems.push({ title: parent.name });
  }
  if (selectedNode && selectedNode.type !== "group") {
    breadcrumbItems.push({ title: selectedNode.name });
  }

  const tabItems = openTabs.map((tab) => ({
    key: tab.key,
    label: (
      <span style={{ display: "inline-flex", alignItems: "center", paddingInline: 4 }}>
        {getTabIcon(tab.node.type)}
        <span
          style={{
            maxWidth: 120,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "inline-block",
            verticalAlign: "middle",
          }}
        >
          {tab.node.name}
        </span>
        <CloseOutlined
          style={{ color: "inherit" }}
          onClick={(e) => {
            e.stopPropagation();
            closeTab(tab.key);
          }}
        />
      </span>
    ),
    children: <JobTabWrapper node={tab.node} />,
  }));

  return (
    <Flex style={{ height: "100%", overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <SiderPanel />
      </div>

      <Flex vertical style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        {tabItems.length > 0 ? (
          <ConfigProvider theme={tabTheme}>
            <Tabs
              type="card"
              rootClassName="job-tabs-wrapper"
              activeKey={activeTabKey ?? undefined}
              onChange={setActiveTab}
              items={tabItems}
              size="small"
              style={{ flex: 1, minHeight: 0 }}
              styles={{
                header: { background: "var(--ant-color-bg-layout)" },
                content: { flex: 1, height: "100%" },
              }}
            />
          </ConfigProvider>
        ) : (
          <Flex vertical align="center" justify="center" style={{ flex: 1 }}>
            <InboxOutlined style={{ fontSize: 32, color: "var(--ant-color-text-quaternary)" }} />
            <Typography.Text type="secondary" style={{ marginTop: 8 }}>
              {selectedNode?.type === "group" ? t("workflow.selectGroupHint") : t("workflow.selectWorkflowHint")}
            </Typography.Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
