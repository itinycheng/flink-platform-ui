import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { CheckCircleOutlined, EditOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { ManagedUser } from "@/types/manage";
import { createUser, getUsers, updateUser } from "@/api/manage";
import RowActions from "@/components/RowActions";
import { statusColor } from "@/utils/statusColor";

function getRoleOptions(t: (k: string) => string) {
  return [
    { label: t("user2.roleAdmin"), value: "admin" },
    { label: t("user2.roleDeveloper"), value: "developer" },
    { label: t("user2.roleViewer"), value: "viewer" },
  ];
}

interface UserRoleTagsProps {
  roles: string[];
}

function UserRoleTags({ roles }: UserRoleTagsProps) {
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

function UserStatusTag({ status }: UserStatusTagProps) {
  const { t } = useTranslation();
  const text = status === "active" ? t("common.enabled") : t("common.disabled");
  return <Tag color={statusColor(status)}>{text}</Tag>;
}

interface UserActionsCellProps {
  record: ManagedUser;
  onEdit: (record: ManagedUser) => void;
  onToggleStatus: (record: ManagedUser) => void;
}

function UserActionsCell({ record, onEdit, onToggleStatus }: UserActionsCellProps) {
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

interface UserFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

function UserFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: UserFormModalProps) {
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
        <Form.Item name="roles" label={t("user2.rolesLabel")} rules={[{ required: true, message: t("user2.rolesPlaceholder") }]}>
          <Select mode="multiple" placeholder={t("user2.rolesPlaceholder")} options={getRoleOptions(t)} data-testid="select-roles" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

function useUserCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: ManagedUser) => {
    setEditingUser(record);
    form.setFieldsValue({ username: record.username, email: record.email, roles: record.roles });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createUser({ ...values, status: "active" });
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
    const newStatus = record.status === "active" ? "disabled" : "active";
    try {
      await updateUser(record.id, { status: newStatus });
      message.success(newStatus === "disabled" ? t("user2.disableSuccess") : t("user2.enableSuccess"));
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
        render: (_, r) => <UserRoleTags roles={r.roles} />,
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
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
