import { Tag } from "antd";
import { CheckCircleOutlined, EditOutlined, StopOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import RowActions from "@/components/RowActions";
import type { ManagedUser } from "@/types/manage";
import { statusColor } from "@/utils/statusColor";

interface UserRoleTagsProps {
  roles: string[];
}

export function UserRoleTags({ roles }: UserRoleTagsProps) {
  return (
    <>
      {roles.map((role) => (
        <Tag key={role} color="blue">
          {role}
        </Tag>
      ))}
    </>
  );
}

interface UserStatusTagProps {
  status: ManagedUser["status"];
}

export function UserStatusTag({ status }: UserStatusTagProps) {
  const { t } = useTranslation();
  const text = status === "active" ? t("common.enabled") : t("common.disabled");
  return <Tag color={statusColor(status)}>{text}</Tag>;
}

interface UserActionsCellProps {
  record: ManagedUser;
  onEdit: (record: ManagedUser) => void;
  onToggleStatus: (record: ManagedUser) => void;
}

export function UserActionsCell({ record, onEdit, onToggleStatus }: UserActionsCellProps) {
  const { t } = useTranslation();
  const isActive = record.status === "active";
  return (
    <RowActions
      actions={[
        {
          key: "edit",
          tooltip: t("common.edit"),
          icon: <EditOutlined />,
          onClick: () => onEdit(record),
        },
        {
          key: "toggle",
          tooltip: isActive ? t("user2.disable") : t("user2.enable"),
          icon: isActive ? <StopOutlined /> : <CheckCircleOutlined />,
          danger: isActive,
          confirm: isActive
            ? t("user2.disableConfirmDesc", { name: record.username })
            : t("user2.enableConfirmDesc", { name: record.username }),
          onClick: () => onToggleStatus(record),
        },
      ]}
    />
  );
}
