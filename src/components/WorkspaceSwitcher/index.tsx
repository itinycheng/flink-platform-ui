import { useEffect } from "react";
import { Flex, Select } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuthStore } from "@/stores/authStore";

interface WorkspaceSwitcherProps {
  /** Render a "/" breadcrumb separator before the control — used when it sits beside the brand. */
  breadcrumb?: boolean;
}

/** Header dropdown for switching the active workspace (multi-tenant scope). */
export default function WorkspaceSwitcher({ breadcrumb = false }: WorkspaceSwitcherProps) {
  const { t } = useTranslation();
  const { workspaces, currentId, loading, loaded, loadWorkspaces, setCurrent } = useWorkspaceStore();
  const loadUserInfo = useAuthStore((state) => state.loadUserInfo);
  const navigate = useNavigate();

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (loaded && !loading && workspaces.length === 0) void navigate("/no-workspace", { replace: true });
  }, [loaded, loading, workspaces.length, navigate]);

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
        onChange={(id) => {
          setCurrent(id);
          void loadUserInfo();
        }}
        prefix={<AppstoreOutlined style={{ color: "var(--ant-color-text-tertiary)" }} />}
        options={workspaces.map((w) => ({ label: w.isDefault ? t("workspace.defaultName") : w.name, value: w.id }))}
        data-testid="workspace-switcher"
      />
    </Flex>
  );
}
