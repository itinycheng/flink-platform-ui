import { useEffect } from "react";
import { Flex, Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface WorkspaceSwitcherProps {
  /** Render a hairline divider before the control — used when it sits beside the brand. */
  leadingDivider?: boolean;
}

/** Header dropdown for switching the active workspace (multi-tenant scope). */
export default function WorkspaceSwitcher({ leadingDivider = false }: WorkspaceSwitcherProps) {
  const { t } = useTranslation();
  const { workspaces, currentId, loadWorkspaces, setCurrent } = useWorkspaceStore();

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  if (workspaces.length === 0) return null;

  return (
    <Flex align="center" gap={12}>
      {leadingDivider && <span style={{ width: 1, height: 16, background: "var(--ant-color-split)" }} />}
      <Select
        size="small"
        variant="filled"
        style={{ width: 180 }}
        value={currentId ?? undefined}
        onChange={setCurrent}
        prefix={<AppstoreOutlined />}
        options={workspaces.map((w) => ({ label: w.isDefault ? t("workspace.defaultName") : w.name, value: w.id }))}
        data-testid="workspace-switcher"
      />
    </Flex>
  );
}
