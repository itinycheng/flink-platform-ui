import { useEffect } from "react";
import { Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useWorkspaceStore } from "@/stores/workspaceStore";

/** Header dropdown for switching the active workspace (multi-tenant scope). */
export default function WorkspaceSwitcher() {
  const { t } = useTranslation();
  const { workspaces, currentId, loadWorkspaces, setCurrent } = useWorkspaceStore();

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  if (workspaces.length === 0) return null;

  return (
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
  );
}
