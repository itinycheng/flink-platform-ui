import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Catalog, CatalogType } from "@/types/admin";
import { createCatalog, deleteCatalog, getCatalogs, updateCatalog } from "@/api/admin";
import RowActions from "@/components/RowActions";
import CodeEditor from "@/components/CodeEditor";
import { enumColor } from "@/utils/statusColor";

const CATALOG_TYPE_OPTIONS: { label: string; value: CatalogType }[] = [
  { label: "Hive", value: "hive" },
  { label: "JDBC", value: "jdbc" },
  { label: "Paimon", value: "paimon" },
  { label: "Iceberg", value: "iceberg" },
];

interface CatalogTypeTagProps {
  type: Catalog["type"];
}

function CatalogTypeTag({ type }: CatalogTypeTagProps) {
  return <Tag color={enumColor(type)}>{type}</Tag>;
}

interface CatalogActionsCellProps {
  record: Catalog;
  onEdit: (record: Catalog) => void;
  onDelete: (id: string) => void;
}

function CatalogActionsCell({ record, onEdit, onDelete }: CatalogActionsCellProps) {
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
          confirm: t("catalog.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}

interface CatalogFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

/**
 * Adapter so CodeEditor works as an Ant Design custom form control. Form.Item
 * injects `value` (possibly undefined) and `onChange`; CodeEditor requires a
 * string `value`, so we coerce here.
 */
function CreateSqlField({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <CodeEditor
      value={value ?? ""}
      onChange={(next) => onChange?.(next)}
      language="sql"
      placeholder={placeholder}
    />
  );
}

function CatalogFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: CatalogFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("catalog.editTitle") : t("catalog.addTitle")}
      open={open}
      width={720}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="catalog-modal"
    >
      <Form form={form} layout="vertical" data-testid="catalog-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("catalog.namePlaceholder") }]}>
          <Input placeholder={t("catalog.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("catalog.typePlaceholder") }]}>
          <Select placeholder={t("catalog.typePlaceholder")} options={CATALOG_TYPE_OPTIONS} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="createSql" label={t("catalog.ddlLabel")} rules={[{ required: true, message: t("catalog.ddlPlaceholder") }]}>
          <CreateSqlField placeholder={t("catalog.ddlPlaceholder")} />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("catalog.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

function useCatalogCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingCatalog(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Catalog) => {
    setEditingCatalog(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      createSql: record.createSql,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingCatalog) {
        await updateCatalog(editingCatalog.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createCatalog(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingCatalog(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingCatalog ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingCatalog(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCatalog(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingCatalog,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}

export default function CatalogList() {
  const { t } = useTranslation();
  const crud = useCatalogCrud();

  const columns = useMemo<ProColumns<Catalog>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("common.type"), dataIndex: "type", key: "type", width: 100, render: (_, r) => <CatalogTypeTag type={r.type} /> },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      { title: t("common.updatedAt"), dataIndex: "updatedAt", key: "updatedAt", width: 200 },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <CatalogActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="catalog-list">
      <ProTable<Catalog>
        headerTitle="Catalog"
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
            data-testid="add-catalog-button"
          >
            {t("catalog.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getCatalogs({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <CatalogFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingCatalog}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
