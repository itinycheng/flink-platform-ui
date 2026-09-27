import { Button, Result } from "antd";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";

export default function NoWorkspace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  if (!token) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await logout();
    void navigate("/login", { replace: true });
  };

  return (
    <Result
      status="warning"
      title={t("workspace.noWorkspaceTitle")}
      subTitle={t("workspace.noWorkspaceDescription")}
      extra={<Button onClick={() => void handleLogout()}>{t("user.logout")}</Button>}
    />
  );
}

