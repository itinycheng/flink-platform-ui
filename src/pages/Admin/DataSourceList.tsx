import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { ApiOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { DataSource, DataSourceType } from "@/types/admin";
import {
  createDataSource,
  deleteDataSource,
  getDataSources,
  testDataSourceConnection,
  updateDataSource,
} from "@/api/admin";
import RowActions from "@/components/RowActions";
import { KeyValueEditor } from "@/components/form";
import { DB_TYPES, enumOptions } from "@/constants/enums";
import { enumColor } from "@/utils/statusColor";
import i18n from "@/i18n";

function DataSourceTypeTag({ type }: { type: DataSourceType }) {
  return <Tag color={enumColor(type)}>{type}</Tag>;
}

interface DataSourceActionsCellProps {
  record: DataSource;
  onEdit: (record: DataSource) => void;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
}

function DataSourceActionsCell({ record, onEdit, onTest, onDelete }: DataSourceActionsCellProps) {
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
          key: "test",
          tooltip: t("datasource.test"),
          icon: <ApiOutlined />,
          onClick: () => onTest(record.id),
        },
        {
          key: "delete",
          tooltip: t("common.delete"),
          icon: <DeleteOutlined />,
          danger: true,
          confirm: t("datasource.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}

interface DataSourceFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

function DataSourceFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: DataSourceFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("datasource.editTitle") : t("datasource.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="datasource-modal"
    >
      <Form form={form} layout="vertical" data-testid="datasource-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("datasource.namePlaceholder") }]}>
          <Input placeholder={t("datasource.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("datasource.typePlaceholder") }]}>
          <Select placeholder={t("datasource.typePlaceholder")} options={enumOptions(DB_TYPES, "DbType", t)} data-testid="select-type" />
        </Form.Item>
        <Form.Item name={["params", "url"]} label={t("datasource.url")} rules={[{ required: true, message: t("datasource.urlPlaceholder") }]}>
          <Input placeholder={t("datasource.urlPlaceholder")} data-testid="input-url" />
        </Form.Item>
        <Form.Item name={["params", "username"]} label={t("datasource.username")}>
          <Input placeholder={t("datasource.usernamePlaceholder")} data-testid="input-username" />
        </Form.Item>
        <Form.Item name={["params", "password"]} label={t("datasource.password")}>
          <Input.Password placeholder={t("datasource.passwordPlaceholder")} data-testid="input-password" />
        </Form.Item>
        <Form.Item name={["params", "properties"]} label={t("datasource.properties")}>
          <KeyValueEditor />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("datasource.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

async function handleTest(id: string) {
  try {
    const okConn = await testDataSourceConnection(id);
    if (okConn) {
      message.success(i18n.t("datasource.testOk"));
    } else {
      message.error(i18n.t("datasource.testFailed"));
    }
  } catch {
    // handled by the global interceptor toast
  }
}

// Mirrors useParamCrud in CustomParamList, with an extra handleTest for connection testing.
function useDataSourceCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingDataSource(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: DataSource) => {
    setEditingDataSource(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      params: record.params ?? { url: "" },
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingDataSource) {
        await updateDataSource(editingDataSource.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createDataSource(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingDataSource(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingDataSource(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDataSource(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      // handled by the global interceptor toast
    }
  };

  return {
    actionRef,
    modalOpen,
    editingDataSource,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
    handleTest,
  };
}

export default function DataSourceList() {
  const { t } = useTranslation();
  const crud = useDataSourceCrud();

  const columns = useMemo<ProColumns<DataSource>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("common.type"), dataIndex: "type", key: "type", width: 120, render: (_, r) => <DataSourceTypeTag type={r.type} /> },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      { title: t("common.updatedAt"), dataIndex: "updatedAt", key: "updatedAt", width: 180 },
      {
        title: t("common.operation"),
        key: "action",
        width: 220,
        render: (_, record) => (
          <DataSourceActionsCell
            record={record}
            onEdit={crud.handleEdit}
            onTest={crud.handleTest}
            onDelete={crud.handleDelete}
          />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleTest, crud.handleDelete],
  );

  return (
    <div data-testid="datasource-list">
      <ProTable<DataSource>
        headerTitle={t("datasource.title")}
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
            data-testid="add-datasource-button"
          >
            {t("datasource.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getDataSources({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <DataSourceFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingDataSource}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
