import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Space, Tag, message, type FormInstance, type FormListFieldData } from "antd";
import { CheckCircleOutlined, EditOutlined, MinusCircleOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { ManagedUser } from "@/types/admin";
import type { Role } from "@/constants/enums";
import { createUser, getUsers, updateUser } from "@/api/admin";
import { getAllWorkspaces } from "@/api/workspace";
import RowActions from "@/components/RowActions";
import { ROLES, enumOptions } from "@/constants/enums";

/** Option for the workspace picker in the per-workspace role editor. */
interface WsOption {
  label: string;
  value: number;
}

/** Renders the user's global role (UserRoles.global). */
function UserRoleTag({ roles }: { roles: ManagedUser["roles"] }) {
  const { t } = useTranslation();
  const global = roles?.global;
  return global ? <Tag color="blue">{t(`enums.Role.${global}`)}</Tag> : <Tag>-</Tag>;
}

function UserStatusTag({ status }: { status: ManagedUser["status"] }) {
  const { t } = useTranslation();
  return <Tag color={status === "NORMAL" ? "green" : "red"}>{t(`enums.UserStatus.${status}`)}</Tag>;
}

interface UserActionsCellProps {
  record: ManagedUser;
  onEdit: (record: ManagedUser) => void;
  onToggleStatus: (record: ManagedUser) => void;
}

function UserActionsCell({ record, onEdit, onToggleStatus }: UserActionsCellProps) {
  const { t } = useTranslation();
  const isActive = record.status === "NORMAL";
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

interface WorkspaceRoleRowProps {
  field: FormListFieldData;
  wsOptions: WsOption[];
  t: TFunction;
  onRemove: () => void;
}

/** One User.roles.workspaces entry: workspace select + role select. */
function WorkspaceRoleRow({ field, wsOptions, t, onRemove }: WorkspaceRoleRowProps) {
  return (
    <Space align="baseline" style={{ display: "flex", marginBottom: 8 }}>
      <Form.Item
        name={[field.name, "workspaceId"]}
        rules={[{ required: true, message: t("user2.selectWorkspace") }]}
        style={{ marginBottom: 0 }}
      >
        <Select placeholder={t("user2.selectWorkspace")} options={wsOptions} style={{ minWidth: 160 }} />
      </Form.Item>
      <Form.Item
        name={[field.name, "role"]}
        rules={[{ required: true, message: t("user2.rolesPlaceholder") }]}
        style={{ marginBottom: 0 }}
      >
        <Select placeholder={t("user2.rolesPlaceholder")} options={enumOptions(ROLES, "Role", t)} style={{ minWidth: 140 }} />
      </Form.Item>
      <MinusCircleOutlined onClick={onRemove} />
    </Space>
  );
}

interface UserFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  wsOptions: WsOption[];
  onOk: () => void;
  onCancel: () => void;
}

function UserFormModal({ open, isEdit, form, confirmLoading, wsOptions, onOk, onCancel }: UserFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("user2.editTitle") : t("user2.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="user-modal"
    >
      <Form form={form} layout="vertical" data-testid="user-form">
        <Form.Item name="username" label={t("user2.usernameLabel")} rules={[{ required: true, message: t("user2.usernamePlaceholder") }]}>
          <Input placeholder={t("user2.usernamePlaceholder")} data-testid="input-username" />
        </Form.Item>
        <Form.Item
          name="email"
          label={t("user2.emailLabel")}
          rules={[
            { required: true, message: t("user2.emailPlaceholder") },
            { type: "email", message: t("user2.emailInvalid") },
          ]}
        >
          <Input placeholder={t("user2.emailPlaceholder")} data-testid="input-email" />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            name="password"
            label={t("user2.passwordLabel")}
            rules={[{ required: true, message: t("user2.passwordPlaceholder") }]}
          >
            <Input.Password placeholder={t("user2.passwordPlaceholder")} data-testid="input-password" />
          </Form.Item>
        )}
        <Form.Item name="globalRole" label={t("user2.rolesLabel")} rules={[{ required: true, message: t("user2.rolesPlaceholder") }]}>
          <Select placeholder={t("user2.rolesPlaceholder")} options={enumOptions(ROLES, "Role", t)} data-testid="select-roles" />
        </Form.Item>
        <Form.Item label={t("user2.workspaceRolesLabel")} style={{ marginBottom: 0 }}>
          <Form.List name="workspaceRoles">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <WorkspaceRoleRow key={field.key} field={field} wsOptions={wsOptions} t={t} onRemove={() => remove(field.name)} />
                ))}
                <Button type="dashed" size="small" onClick={() => add()} icon={<PlusOutlined />} block>
                  {t("user2.addWorkspaceRole")}
                </Button>
              </>
            )}
          </Form.List>
        </Form.Item>
      </Form>
    </Modal>
  );
}

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

/** One row of the `workspaceRoles` Form.List (see `WorkspaceRoleRow`). */
interface WorkspaceRoleEntry {
  workspaceId?: number;
  role?: Role;
}

/**
 * Rebuilds the full `UserRoles` shape from the form's flat `globalRole` +
 * `workspaceRoles` fields. Pulled out as a pure function so both save paths
 * (create/update) always persist `workspaces` instead of silently dropping it.
 */
function buildRoles(globalRole: Role | undefined, workspaceRoles: WorkspaceRoleEntry[] | undefined) {
  const workspaces = Object.fromEntries(
    (workspaceRoles ?? [])
      .filter((r): r is Required<WorkspaceRoleEntry> => r.workspaceId != null && !!r.role)
      .map((r) => [r.workspaceId, r.role]),
  );
  return { global: globalRole, workspaces };
}

/** Loads the workspace options for the per-workspace role Select (numeric ids). */
function useWorkspaceOptions(): WsOption[] {
  const { t } = useTranslation();
  const [wsOptions, setWsOptions] = useState<WsOption[]>([]);

  useEffect(() => {
    void getAllWorkspaces().then((ws) =>
      setWsOptions(ws.map((w) => ({ label: w.isDefault ? t("workspace.defaultName") : w.name, value: w.id }))),
    );
  }, [t]);

  return wsOptions;
}

function useUserCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const wsOptions = useWorkspaceOptions();
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: ManagedUser) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      globalRole: record.roles?.global,
      workspaceRoles: Object.entries(record.roles?.workspaces ?? {}).map(([id, role]) => ({
        workspaceId: Number(id),
        role,
      })),
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const { globalRole, workspaceRoles, ...values } = await form.validateFields();
      const payload = { ...values, roles: buildRoles(globalRole, workspaceRoles) };
      setConfirmLoading(true);
      if (editingUser) {
        await updateUser(editingUser.id, payload);
        message.success(t("common.updateSuccess"));
      } else {
        await createUser({ ...payload, status: "NORMAL" });
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingUser ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingUser(null);
  };

  const handleToggleStatus = async (record: ManagedUser) => {
    const newStatus = record.status === "NORMAL" ? "LOCKED" : "NORMAL";
    try {
      await updateUser(record.id, { status: newStatus });
      message.success(newStatus === "LOCKED" ? t("user2.disableSuccess") : t("user2.enableSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.actionFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingUser,
    confirmLoading,
    wsOptions,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleToggleStatus,
  };
}

export default function UserList() {
  const { t } = useTranslation();
  const crud = useUserCrud();

  const columns = useMemo<ProColumns<ManagedUser>[]>(
    () => [
      { title: t("user2.usernameLabel"), dataIndex: "username", key: "username", ellipsis: true },
      { title: t("user2.emailLabel"), dataIndex: "email", key: "email", ellipsis: true },
      {
        title: t("user2.rolesLabel"),
        dataIndex: "roles",
        key: "roles",
        width: 200,
        render: (_, r) => <UserRoleTag roles={r.roles} />,
      },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <UserStatusTag status={r.status} />,
      },
      { title: t("common.createdAt"), dataIndex: "createdAt", key: "createdAt", width: 200, valueType: "dateTime", sorter: true },
      {
        title: t("common.operation"),
        key: "action",
        width: 180,
        render: (_, record) => (
          <UserActionsCell record={record} onEdit={crud.handleEdit} onToggleStatus={crud.handleToggleStatus} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleToggleStatus],
  );

  return (
    <div data-testid="user-list">
      <ProTable<ManagedUser>
        headerTitle={t("user2.title")}
        actionRef={crud.actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={crud.handleAdd}
            data-testid="add-user-button"
          >
            {t("user2.addButton")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getUsers({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <UserFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingUser}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        wsOptions={crud.wsOptions}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
