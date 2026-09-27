import { useMemo, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Workspace, WorkspaceStatus } from "@/types/workspace";
import { createWorkspace, deleteWorkspace, getWorkspaces, updateWorkspace } from "@/api/workspace";
import RowActions from "@/components/RowActions";
import { STATUSES, enumOptions } from "@/constants/enums";
import { statusColor } from "@/utils/statusColor";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/app/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { useWorkspaceStore } from "@/stores/workspaceStore";

function getWorkspaceStatusOptions(t: (k: string) => string) {
  return enumOptions(STATUSES, "Status", t);
}

function WorkspaceStatusTag({ status }: { status: WorkspaceStatus }) {
  const { t } = useTranslation();
  return <Tag color={statusColor(status)}>{t(`enums.Status.${status}`)}</Tag>;
}

interface WorkspaceActionsCellProps {
  record: Workspace;
  onEdit: (record: Workspace) => void;
  onDelete: (id: number) => Promise<void>;
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
          onClick: () => void onDelete(record.id),
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
      <Form form={form} layout="vertical" initialValues={{ status: "ENABLE" }} data-testid="workspace-form">
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
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentId);
  const loadWorkspaces = useWorkspaceStore((state) => state.loadWorkspaces);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();
  const invalidateWorkspaces = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["workspace", currentWorkspaceId, "admin", "workspaces"],
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    await loadWorkspaces();
  };

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
      await invalidateWorkspaces();
    } catch (error) {
      if (isFormValidationError(error)) return;
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingWorkspace(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWorkspace(id);
      message.success(t("common.deleteSuccess"));
      await invalidateWorkspaces();
    } catch {
      // handled by the global interceptor toast
    }
  };

  return {
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

function useWorkspaceColumns(
  t: (key: string) => string,
  onEdit: (record: Workspace) => void,
  onDelete: (id: number) => Promise<void>,
) {
  return useMemo<ProColumns<Workspace>[]>(
    () => [
      {
        title: t("common.name"),
        dataIndex: "name",
        key: "name",
        ellipsis: true,
        render: (_, row) => (row.isDefault ? t("workspace.defaultName") : row.name),
      },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, row) => <WorkspaceStatusTag status={row.status} />,
      },
      {
        title: t("common.createdAt"),
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (_, row) => new Date(row.createdAt).toLocaleString(),
      },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => <WorkspaceActionsCell record={record} onEdit={onEdit} onDelete={onDelete} />,
      },
    ],
    [t, onEdit, onDelete],
  );
}

export default function WorkspaceList() {
  const { t } = useTranslation();
  const crud = useWorkspaceCrud();
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const workspacesQuery = useQuery(
    {
      queryKey: queryKeys.adminList(workspaceId, "workspaces", pagination),
      queryFn: () => getWorkspaces(pagination),
      enabled: workspaceId != null,
    },
    queryClient,
  );

  const columns = useWorkspaceColumns(t, crud.handleEdit, crud.handleDelete);

  return (
    <div data-testid="workspace-list">
      <ProTable<Workspace>
        headerTitle={t("workspace.title")}
        rowKey="id"
        columns={columns}
        dataSource={workspacesQuery.data?.data ?? []}
        loading={workspacesQuery.isFetching}
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
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: workspacesQuery.data?.total ?? 0,
          showSizeChanger: true,
          onChange: (page, pageSize) => setPagination({ page, pageSize }),
        }}
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
