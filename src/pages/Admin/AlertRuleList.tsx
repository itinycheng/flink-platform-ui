import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { AlertChannelType, AlertRule } from "@/types/alert";
import { createAlertRule, deleteAlertRule, getAlertRules, updateAlertRule } from "@/api/alert";
import RowActions from "@/components/RowActions";
import { enumColor } from "@/utils/statusColor";

function getAlertChannelOptions(t: (k: string) => string) {
  return [
    { label: t("alertRule.channelEmail"), value: "email" },
    { label: t("alertRule.channelSms"), value: "sms" },
    { label: t("alertRule.channelDingtalk"), value: "dingtalk" },
    { label: t("alertRule.channelWechat"), value: "wechat" },
    { label: t("alertRule.channelWebhook"), value: "webhook" },
  ];
}

interface AlertChannelTagProps {
  type: AlertChannelType;
}

function AlertChannelTag({ type }: AlertChannelTagProps) {
  const { t } = useTranslation();
  const labels = Object.fromEntries(getAlertChannelOptions(t).map((o) => [o.value, o.label]));
  return <Tag color={enumColor(type)}>{labels[type] ?? type}</Tag>;
}

interface AlertRuleActionsCellProps {
  record: AlertRule;
  onEdit: (record: AlertRule) => void;
  onDelete: (id: string) => void;
}

function AlertRuleActionsCell({ record, onEdit, onDelete }: AlertRuleActionsCellProps) {
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
          confirm: t("alertRule.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}

interface AlertRuleFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

function AlertRuleFormModal({
  open,
  isEdit,
  form,
  confirmLoading,
  onOk,
  onCancel,
}: AlertRuleFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("alertRule.editTitle") : t("alertRule.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="alert-rule-modal"
    >
      <Form form={form} layout="vertical" data-testid="alert-rule-form">
        <Form.Item name="name" label={t("alertRule.nameLabel")} rules={[{ required: true, message: t("alertRule.namePlaceholder") }]}>
          <Input placeholder={t("alertRule.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("alertRule.typePlaceholder") }]}>
          <Select placeholder={t("alertRule.typePlaceholder")} options={getAlertChannelOptions(t)} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="config" label={t("alertRule.configLabel")}>
          <Input.TextArea placeholder={t("alertRule.configPlaceholder")} rows={6} data-testid="input-config" />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("alertRule.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

function useAlertRuleCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: AlertRule) => {
    setEditingRule(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      config: record.config,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingRule) {
        await updateAlertRule(editingRule.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createAlertRule(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingRule(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingRule ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingRule(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlertRule(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingRule,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}

export default function AlertRuleList() {
  const { t } = useTranslation();
  const crud = useAlertRuleCrud();

  const columns = useMemo<ProColumns<AlertRule>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      {
        title: t("common.type"),
        dataIndex: "type",
        key: "type",
        width: 120,
        render: (_, r) => <AlertChannelTag type={r.type} />,
      },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      { title: t("common.updatedAt"), dataIndex: "updatedAt", key: "updatedAt", width: 180 },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <AlertRuleActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="alert-rule-list">
      <ProTable<AlertRule>
        headerTitle={t("alertRule.title")}
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
            data-testid="add-alert-rule-button"
          >
            {t("alertRule.addButton")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getAlertRules({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <AlertRuleFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingRule}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
