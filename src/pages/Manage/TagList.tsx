import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Tag as TagModel, TagStatus } from "@/types/manage";
import { createTag, deleteTag, getTags, updateTag } from "@/api/manage";
import RowActions from "@/components/RowActions";
import { statusColor } from "@/utils/statusColor";

function getTagTypeOptions(t: (k: string) => string) {
  return [
    { label: t("tag.typeBusiness"), value: "business" },
    { label: t("tag.typeSystem"), value: "system" },
    { label: t("tag.typeCustom"), value: "custom" },
  ];
}

function getTagStatusOptions(t: (k: string) => string) {
  return [
    { label: t("tag.statusActive"), value: "active" },
    { label: t("tag.statusDisabled"), value: "disabled" },
  ];
}

const TYPE_LABEL_KEYS: Record<string, string> = {
  business: "tag.typeBusiness",
  system: "tag.typeSystem",
  custom: "tag.typeCustom",
};

const STATUS_LABEL_KEYS: Record<TagStatus, string> = {
  active: "tag.statusActive",
  disabled: "tag.statusDisabled",
};

interface TagTypeTagProps {
  type: TagModel["type"];
}

function TagTypeTag({ type }: TagTypeTagProps) {
  const { t } = useTranslation();
  const key = TYPE_LABEL_KEYS[type];
  return <Tag>{key ? t(key) : type}</Tag>;
}

interface TagStatusTagProps {
  status: TagModel["status"];
}

function TagStatusTag({ status }: TagStatusTagProps) {
  const { t } = useTranslation();
  const key = STATUS_LABEL_KEYS[status];
  return <Tag color={statusColor(status)}>{key ? t(key) : status}</Tag>;
}

interface TagActionsCellProps {
  record: TagModel;
  onEdit: (record: TagModel) => void;
  onDelete: (id: string) => void;
}

function TagActionsCell({ record, onEdit, onDelete }: TagActionsCellProps) {
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
          confirm: t("tag.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}

interface TagFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

function TagFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: TagFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("tag.editTitle") : t("tag.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="tag-modal"
    >
      <Form form={form} layout="vertical" data-testid="tag-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("tag.namePlaceholder") }]}>
          <Input placeholder={t("tag.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("tag.typePlaceholder") }]}>
          <Select placeholder={t("tag.typePlaceholder")} options={getTagTypeOptions(t)} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="status" label={t("common.status")} rules={[{ required: true, message: t("tag.statusPlaceholder") }]}>
          <Select placeholder={t("tag.statusPlaceholder")} options={getTagStatusOptions(t)} data-testid="select-status" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

function useTagCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagModel | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: TagModel) => {
    setEditingTag(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingTag) {
        await updateTag(editingTag.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createTag(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingTag(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingTag ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingTag(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingTag,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}

export default function TagList() {
  const { t } = useTranslation();
  const crud = useTagCrud();

  const columns = useMemo<ProColumns<TagModel>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      {
        title: t("common.type"),
        dataIndex: "type",
        key: "type",
        width: 120,
        render: (_, r) => <TagTypeTag type={r.type} />,
      },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <TagStatusTag status={r.status} />,
      },
      { title: t("common.createdAt"), dataIndex: "createdAt", key: "createdAt", width: 180 },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <TagActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="tag-list">
      <ProTable<TagModel>
        headerTitle={t("tag.title")}
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
            data-testid="add-tag-button"
          >
            {t("tag.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getTags({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <TagFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingTag}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
