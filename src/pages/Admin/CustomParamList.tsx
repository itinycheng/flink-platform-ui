import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { CustomParam } from "@/types/admin";
import { createParam, deleteParam, getParams, updateParam } from "@/api/admin";
import RowActions from "@/components/RowActions";
import { enumColor } from "@/utils/statusColor";

function getParamTypeOptions(t: (k: string) => string) {
  return [
    { label: t("param.typeString"), value: "string" },
    { label: t("param.typeNumber"), value: "number" },
    { label: t("param.typeBoolean"), value: "boolean" },
    { label: t("param.typeJson"), value: "json" },
  ];
}

interface ParamTypeTagProps {
  type: CustomParam["type"];
}

function ParamTypeTag({ type }: ParamTypeTagProps) {
  return <Tag color={enumColor(type)}>{type}</Tag>;
}

interface ParamActionsCellProps {
  record: CustomParam;
  onEdit: (record: CustomParam) => void;
  onDelete: (id: string) => void;
}

function ParamActionsCell({ record, onEdit, onDelete }: ParamActionsCellProps) {
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
          confirm: t("param.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}

interface ParamFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

function ParamFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: ParamFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("param.editTitle") : t("param.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="custom-param-modal"
    >
      <Form form={form} layout="vertical" data-testid="custom-param-form">
        <Form.Item name="name" label={t("param.nameLabel")} rules={[{ required: true, message: t("param.namePlaceholder") }]}>
          <Input placeholder={t("param.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="value" label={t("param.valueLabel")} rules={[{ required: true, message: t("param.valuePlaceholder") }]}>
          <Input placeholder={t("param.valuePlaceholder")} data-testid="input-value" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("param.typePlaceholder") }]}>
          <Select placeholder={t("param.typePlaceholder")} options={getParamTypeOptions(t)} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("param.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// NOTE: This hook is structurally near-identical to useUserCrud in UserList.
// If a third CRUD list page appears, consider extracting a generic
// `useModalForm<T>()` hook.

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

function useParamCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<CustomParam | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingParam(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: CustomParam) => {
    setEditingParam(record);
    form.setFieldsValue({
      name: record.name,
      value: record.value,
      type: record.type,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingParam) {
        await updateParam(editingParam.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createParam(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingParam(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingParam ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingParam(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteParam(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingParam,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}

export default function CustomParamList() {
  const { t } = useTranslation();
  const crud = useParamCrud();

  const columns = useMemo<ProColumns<CustomParam>[]>(
    () => [
      { title: t("param.nameLabel"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("param.valueLabel"), dataIndex: "value", key: "value", ellipsis: true },
      { title: t("common.type"), dataIndex: "type", key: "type", width: 100, render: (_, r) => <ParamTypeTag type={r.type} /> },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <ParamActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="custom-param-list">
      <ProTable<CustomParam>
        headerTitle={t("param.title")}
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
            data-testid="add-param-button"
          >
            {t("param.addButton")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getParams({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <ParamFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingParam}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
