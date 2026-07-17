import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, Modal, Select, Tag, message, type FormInstance } from "antd";
import { ClearOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { SysConfig, SysConfigStatus, SysConfigType } from "@/types/manage";
import { createSysConfig, deleteSysConfig, getSysConfigs, purgeSysConfig, updateSysConfig } from "@/api/manage";
import RowActions from "@/components/RowActions";
import CodeEditor from "@/components/CodeEditor";
import { enumColor, statusColor } from "@/utils/statusColor";

function getSysConfigTypeOptions(
  t: (k: string) => string,
): { label: string; value: SysConfigType }[] {
  return [
    { label: t("sysConfig.typeHadoop"), value: "HADOOP_CONFIG" },
    { label: t("sysConfig.typeFlink"), value: "FLINK_CONFIG" },
    { label: t("sysConfig.typeHive"), value: "HIVE_CONFIG" },
    { label: t("sysConfig.typeSpark"), value: "SPARK_CONFIG" },
  ];
}

// Only online/offline are user-selectable; `deleted` is set by the backend soft-delete.
function getSysConfigStatusOptions(
  t: (k: string) => string,
): { label: string; value: Exclude<SysConfigStatus, "deleted"> }[] {
  return [
    { label: t("sysConfig.statusOnline"), value: "online" },
    { label: t("sysConfig.statusOffline"), value: "offline" },
  ];
}

const TYPE_LABEL_KEYS: Record<SysConfigType, string> = {
  HADOOP_CONFIG: "sysConfig.typeHadoop",
  FLINK_CONFIG: "sysConfig.typeFlink",
  HIVE_CONFIG: "sysConfig.typeHive",
  SPARK_CONFIG: "sysConfig.typeSpark",
};

const STATUS_LABEL_KEYS: Record<SysConfigStatus, string> = {
  online: "sysConfig.statusOnline",
  offline: "sysConfig.statusOffline",
  deleted: "sysConfig.statusDeleted",
};

interface SysConfigTypeTagProps {
  type: SysConfig["type"];
}

function SysConfigTypeTag({ type }: SysConfigTypeTagProps) {
  const { t } = useTranslation();
  return <Tag color={enumColor(type)}>{t(TYPE_LABEL_KEYS[type])}</Tag>;
}

interface SysConfigStatusTagProps {
  status: SysConfig["status"];
}

function SysConfigStatusTag({ status }: SysConfigStatusTagProps) {
  const { t } = useTranslation();
  return <Tag color={statusColor(status)}>{t(STATUS_LABEL_KEYS[status])}</Tag>;
}

interface SysConfigActionsCellProps {
  record: SysConfig;
  onEdit: (record: SysConfig) => void;
  onDelete: (id: string) => void;
  onPurge: (id: string) => void;
}

function SysConfigActionsCell({ record, onEdit, onDelete, onPurge }: SysConfigActionsCellProps) {
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
          confirm: t("sysConfig.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
        {
          key: "purge",
          tooltip: t("sysConfig.purge"),
          icon: <ClearOutlined />,
          danger: true,
          confirm: t("sysConfig.purgeConfirmDesc", { name: record.name }),
          onClick: () => onPurge(record.id),
          hidden: record.status !== "deleted",
        },
      ]}
    />
  );
}

/**
 * Form.Item injects `value`/`onChange` into its single child at runtime, but
 * CodeEditor declares them as required props. This adapter makes them optional
 * so it type-checks inside Form.Item while still binding to the form field.
 */
function ConfigContentEditor({
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
      language="sql"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(v) => onChange?.(v)}
    />
  );
}

interface SysConfigFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

function SysConfigFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: SysConfigFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("sysConfig.editTitle") : t("sysConfig.addTitle")}
      open={open}
      width={720}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="sysconfig-modal"
    >
      <Form form={form} layout="vertical" data-testid="sysconfig-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("sysConfig.namePlaceholder") }]}>
          <Input placeholder={t("sysConfig.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="type" label={t("common.type")} rules={[{ required: true, message: t("sysConfig.typePlaceholder") }]}>
          <Select placeholder={t("sysConfig.typePlaceholder")} options={getSysConfigTypeOptions(t)} data-testid="select-type" />
        </Form.Item>
        <Form.Item name="version" label={t("sysConfig.version")} rules={[{ required: true, message: t("sysConfig.versionPlaceholder") }]}>
          <Input placeholder={t("sysConfig.versionPlaceholder")} data-testid="input-version" />
        </Form.Item>
        <Form.Item name="status" label={t("common.status")} rules={[{ required: true, message: t("sysConfig.statusPlaceholder") }]}>
          <Select placeholder={t("sysConfig.statusPlaceholder")} options={getSysConfigStatusOptions(t)} data-testid="select-status" />
        </Form.Item>
        <Form.Item
          name="content"
          label={t("sysConfig.content")}
          initialValue=""
          rules={[{ required: true, message: t("sysConfig.contentPlaceholder") }]}
        >
          <ConfigContentEditor placeholder={t("sysConfig.contentPlaceholder")} />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("sysConfig.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// NOTE: Structurally mirrors useParamCrud in CustomParamList, with an
// extra handlePurge for the physical-cleanup action on soft-deleted configs.

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

function useSysConfigCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SysConfig | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: SysConfig) => {
    setEditingConfig(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      version: record.version,
      status: record.status,
      content: record.content,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingConfig) {
        await updateSysConfig(editingConfig.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createSysConfig(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingConfig(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingConfig ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingConfig(null);
  };

  const runRowAction = async (action: (id: string) => Promise<void>, id: string, ok: string, fail: string) => {
    try {
      await action(id);
      message.success(ok);
      void actionRef.current?.reload();
    } catch {
      message.error(fail);
    }
  };

  const handleDelete = (id: string) =>
    runRowAction(deleteSysConfig, id, t("common.deleteSuccess"), t("common.deleteFailed"));
  const handlePurge = (id: string) =>
    runRowAction(purgeSysConfig, id, t("sysConfig.purgeSuccess"), t("sysConfig.purgeFailed"));

  return {
    actionRef,
    modalOpen,
    editingConfig,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
    handlePurge,
  };
}

export default function SysConfigList() {
  const { t } = useTranslation();
  const crud = useSysConfigCrud();

  const columns = useMemo<ProColumns<SysConfig>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      {
        title: t("common.type"),
        dataIndex: "type",
        key: "type",
        width: 130,
        render: (_, r) => <SysConfigTypeTag type={r.type} />,
      },
      { title: t("sysConfig.version"), dataIndex: "version", key: "version", width: 120 },
      {
        title: t("common.status"),
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (_, r) => <SysConfigStatusTag status={r.status} />,
      },
      { title: t("common.description"), dataIndex: "description", key: "description", ellipsis: true },
      { title: t("common.updatedAt"), dataIndex: "updatedAt", key: "updatedAt", width: 200 },
      {
        title: t("common.operation"),
        key: "action",
        width: 200,
        render: (_, record) => (
          <SysConfigActionsCell
            record={record}
            onEdit={crud.handleEdit}
            onDelete={crud.handleDelete}
            onPurge={crud.handlePurge}
          />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete, crud.handlePurge],
  );

  return (
    <div data-testid="sysconfig-list">
      <ProTable<SysConfig>
        headerTitle={t("sysConfig.title")}
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
            data-testid="add-sysconfig-button"
          >
            {t("sysConfig.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getSysConfigs({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <SysConfigFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingConfig}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
