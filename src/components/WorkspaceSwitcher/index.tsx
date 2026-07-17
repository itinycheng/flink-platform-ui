import { useEffect } from "react";
import { Flex, Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface WorkspaceSwitcherProps {
  /** Render a "/" breadcrumb separator before the control — used when it sits beside the brand. */
  breadcrumb?: boolean;
}

/** Header dropdown for switching the active workspace (multi-tenant scope). */
export default function WorkspaceSwitcher({ breadcrumb = false }: WorkspaceSwitcherProps) {
  const { t } = useTranslation();
  const { workspaces, currentId, loadWorkspaces, setCurrent } = useWorkspaceStore();

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  if (workspaces.length === 0) return null;

  return (
    <Flex align="center" gap={8}>
      {breadcrumb && (
        <span style={{ color: "var(--ant-color-split)", fontSize: 18, fontWeight: 300, userSelect: "none" }}>/</span>
      )}
      <Select
        size="small"
        variant="borderless"
        style={{ width: 180 }}
        value={currentId ?? undefined}
        onChange={setCurrent}
        prefix={<AppstoreOutlined style={{ color: "var(--ant-color-text-tertiary)" }} />}
        options={workspaces.map((w) => ({ label: w.isDefault ? t("workspace.defaultName") : w.name, value: w.id }))}
        data-testid="workspace-switcher"
      />
    </Flex>
  );
}
