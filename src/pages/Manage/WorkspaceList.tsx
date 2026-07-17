import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Workspace, WorkspaceStatus } from "@/types/workspace";
import { createWorkspace, deleteWorkspace, getWorkspaces, updateWorkspace } from "@/api/workspace";
import RowActions from "@/components/RowActions";
import { statusColor } from "@/utils/statusColor";

function getWorkspaceStatusOptions(t: (k: string) => string) {
  return [
    { label: t("workspace.statusActive"), value: "active" },
    { label: t("workspace.statusDisabled"), value: "disabled" },
  ];
}

function getWorkspaceStatusLabels(t: (k: string) => string): Record<WorkspaceStatus, string> {
  return {
    active: t("workspace.statusActive"),
    disabled: t("workspace.statusDisabled"),
  };
}

interface WorkspaceStatusTagProps {
  status: WorkspaceStatus;
}

function WorkspaceStatusTag({ status }: WorkspaceStatusTagProps) {
  const { t } = useTranslation();
  return <Tag color={statusColor(status)}>{getWorkspaceStatusLabels(t)[status]}</Tag>;
}

interface WorkspaceActionsCellProps {
  record: Workspace;
  onEdit: (record: Workspace) => void;
  onDelete: (id: string) => void;
}

function WorkspaceActionsCell({ record, onEdit, onDelete }: WorkspaceActionsCellProps) {
  const { t } = useTranslation();
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
          key: "delete",
          tooltip: t("common.delete"),
          icon: <DeleteOutlined />,
          danger: true,
          confirm: t("workspace.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}

interface WorkspaceFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

function WorkspaceFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: WorkspaceFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("workspace.editTitle") : t("workspace.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="workspace-modal"
    >
      <Form form={form} layout="vertical" initialValues={{ status: "active" }} data-testid="workspace-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("workspace.namePlaceholder") }]}>
          <Input placeholder={t("workspace.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("workspace.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
        <Form.Item name="status" label={t("common.status")} rules={[{ required: true, message: t("workspace.statusPlaceholder") }]}>
          <Select placeholder={t("workspace.statusPlaceholder")} options={getWorkspaceStatusOptions(t)} data-testid="select-status" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

function useWorkspaceCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingWorkspace(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Workspace) => {
    setEditingWorkspace(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description ?? "",
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createWorkspace(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingWorkspace(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingWorkspace ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingWorkspace(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkspace(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingWorkspace,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}

export default function WorkspaceList() {
  const { t } = useTranslation();
  const crud = useWorkspaceCrud();

  const columns = useMemo<ProColumns<Workspace>[]>(
    () => [
      {
        title: t("common.name"),
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        render: (_, r) => (r.isDefault ? t("workspace.defaultName") : r.name),
      },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <WorkspaceStatusTag status={r.status} />,
      },
      {
        title: t("common.createdAt"),
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (_, r) => new Date(r.createdAt).toLocaleString(),
      },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <WorkspaceActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="workspace-list">
      <ProTable<Workspace>
        headerTitle={t("workspace.title")}
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
            data-testid="add-workspace-button"
          >
            {t("workspace.addButton")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getWorkspaces({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <WorkspaceFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingWorkspace}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
