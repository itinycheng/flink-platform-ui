import { Button, Popconfirm, Tag } from "antd";
import type { ManagedUser } from "@/types/manage";
import { STATUS_CONFIG } from "./UserList.constants";

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
  const config = STATUS_CONFIG[status];
  return <Tag color={config.color}>{config.text}</Tag>;
}

interface UserActionsCellProps {
  record: ManagedUser;
  onEdit: (record: ManagedUser) => void;
  onToggleStatus: (record: ManagedUser) => void;
}

export function UserActionsCell({ record, onEdit, onToggleStatus }: UserActionsCellProps) {
  const isActive = record.status === "active";
  return (
    <>
      <Button type="link" onClick={() => onEdit(record)} data-testid={`edit-btn-${record.id}`}>
        编辑
      </Button>
      <Popconfirm
        title={isActive ? "确认禁用" : "确认启用"}
        description={isActive ? `确定要禁用用户 "${record.username}" 吗？` : `确定要启用用户 "${record.username}" 吗？`}
        onConfirm={() => onToggleStatus(record)}
        okText="确定"
        cancelText="取消"
      >
        <Button type="link" danger={isActive} data-testid={`toggle-status-btn-${record.id}`}>
          {isActive ? "禁用" : "启用"}
        </Button>
      </Popconfirm>
    </>
  );
}
