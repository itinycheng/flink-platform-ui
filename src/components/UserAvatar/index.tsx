import { Avatar, Dropdown, Flex, Tag, Space, Typography, type MenuProps } from "antd";
import { UserOutlined, LogoutOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

const PERMISSION_KEYS: Record<string, string> = {
  "dashboard:view": "user.dashboardView",
  "workflow:view": "user.workflowView",
  "workflow:edit": "user.workflowEdit",
  "manage:view": "user.manageView",
  "manage:edit": "user.manageEdit",
  "monitor:view": "user.monitorView",
  "monitor:edit": "user.monitorEdit",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "red",
  developer: "blue",
  viewer: "green",
};

export default function UserAvatar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items: MenuProps["items"] = [
    {
      key: "info",
      type: "group",
      label: (
        <Typography.Text strong>
          <UserOutlined />
          {user.username}
        </Typography.Text>
      ),
    },
    {
      key: "roles",
      disabled: true,
      label: (
        <Space size={4} wrap>
          <Typography.Text type="secondary">{t("user.roles")}:</Typography.Text>
          {user.roles.map((role) => (
            <Tag key={role} color={ROLE_COLORS[role] ?? "default"}>
              {role}
            </Tag>
          ))}
        </Space>
      ),
    },
    { type: "divider" },
    {
      key: "permissions-header",
      disabled: true,
      label: (
        <Typography.Text type="secondary">
          <SafetyCertificateOutlined />
          {t("user.permissions")}
        </Typography.Text>
      ),
    },
    ...user.permissions.map((perm) => ({
      key: perm,
      disabled: true,
      label: (
        <Tag color={perm.includes(":edit") ? "orange" : "blue"}>
          {PERMISSION_KEYS[perm] ? t(PERMISSION_KEYS[perm]) : perm}
        </Tag>
      ),
    })),
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("user.logout"),
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <Flex align="center" gap="middle">
        <Avatar icon={<UserOutlined />} />
        <Typography.Text>{user.username}</Typography.Text>
      </Flex>
    </Dropdown>
  );
}
