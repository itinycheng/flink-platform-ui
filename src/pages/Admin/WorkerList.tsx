import { useMemo, useRef, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Select, Tag, message, type FormInstance } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable, type ActionType, type ProColumns } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";
import type { Worker } from "@/types/admin";
import type { EnvironmentSpec } from "@/types/entities";
import { createWorker, deleteWorker, getWorkers, updateWorker } from "@/api/admin";
import RowActions from "@/components/RowActions";
import { DynamicListEditor } from "@/components/form";
import { WORKER_STATUSES, enumOptions } from "@/constants/enums";
import { statusColor } from "@/utils/statusColor";

function WorkerStatusTag({ role }: { role: Worker["role"] }) {
  const { t } = useTranslation();
  return <Tag color={statusColor(role)}>{t(`enums.WorkerStatus.${role}`)}</Tag>;
}

/** Key/value editor for a worker's environment specs (EnvironmentSpec[]). */
function EnvironmentsEditor({ value, onChange }: { value?: EnvironmentSpec[]; onChange?: (v: EnvironmentSpec[]) => void }) {
  const { t } = useTranslation();
  return (
    <DynamicListEditor<EnvironmentSpec>
      value={value}
      onChange={onChange}
      newItem={() => ({ name: "", value: "" })}
      renderItem={(item, onItemChange) => (
        <>
          <Input
            placeholder={t("worker.envName")}
            value={item.name}
            onChange={(e) => onItemChange({ ...item, name: e.target.value })}
          />
          <Input
            placeholder={t("worker.envValue")}
            value={item.value}
            onChange={(e) => onItemChange({ ...item, value: e.target.value })}
          />
        </>
      )}
    />
  );
}

interface WorkerActionsCellProps {
  record: Worker;
  onEdit: (record: Worker) => void;
  onDelete: (id: string) => void;
}

function WorkerActionsCell({ record, onEdit, onDelete }: WorkerActionsCellProps) {
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
          confirm: t("worker.deleteConfirmDesc", { name: record.name }),
          onClick: () => onDelete(record.id),
        },
      ]}
    />
  );
}

interface WorkerFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

function WorkerFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: WorkerFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("worker.editTitle") : t("worker.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="worker-modal"
    >
      <Form form={form} layout="vertical" data-testid="worker-form">
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("worker.namePlaceholder") }]}>
          <Input placeholder={t("worker.namePlaceholder")} data-testid="input-name" />
        </Form.Item>
        <Form.Item name="ip" label={t("worker.ip")} rules={[{ required: true, message: t("worker.ipPlaceholder") }]}>
          <Input placeholder={t("worker.ipPlaceholder")} data-testid="input-ip" />
        </Form.Item>
        <Form.Item name="port" label={t("worker.port")} rules={[{ required: true, message: t("worker.portPlaceholder") }]}>
          <Input placeholder={t("worker.portPlaceholder")} data-testid="input-port" />
        </Form.Item>
        <Form.Item name="grpcPort" label={t("worker.grpcPort")}>
          <InputNumber min={1} max={65535} style={{ width: "100%" }} data-testid="input-grpc-port" />
        </Form.Item>
        <Form.Item name="role" label={t("common.status")} rules={[{ required: true, message: t("worker.statusPlaceholder") }]}>
          <Select
            placeholder={t("worker.statusPlaceholder")}
            options={enumOptions(WORKER_STATUSES, "WorkerStatus", t)}
            data-testid="select-status"
          />
        </Form.Item>
        <Form.Item name="desc" label={t("common.description")}>
          <Input.TextArea placeholder={t("worker.descriptionPlaceholder")} rows={2} data-testid="input-description" />
        </Form.Item>
        <Form.Item name="environments" label={t("worker.environments")}>
          <EnvironmentsEditor />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

function useWorkerCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingWorker(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Worker) => {
    setEditingWorker(record);
    form.setFieldsValue({
      name: record.name,
      ip: record.ip,
      port: record.port,
      grpcPort: record.grpcPort,
      role: record.role,
      desc: record.desc ?? "",
      environments: record.environments ?? [],
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingWorker) {
        await updateWorker(editingWorker.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createWorker(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingWorker(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingWorker ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingWorker(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorker(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingWorker,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}

export default function WorkerList() {
  const { t } = useTranslation();
  const crud = useWorkerCrud();

  const columns = useMemo<ProColumns<Worker>[]>(
    () => [
      { title: t("common.name"), dataIndex: "name", key: "name", ellipsis: true },
      { title: t("worker.ip"), dataIndex: "ip", key: "ip", width: 160 },
      { title: t("worker.port"), dataIndex: "port", key: "port", width: 90 },
      { title: t("worker.grpcPort"), dataIndex: "grpcPort", key: "grpcPort", width: 100 },
      {
        title: t("common.status"),
        dataIndex: "role",
        key: "role",
        width: 100,
        render: (_, r) => <WorkerStatusTag role={r.role} />,
      },
      { title: t("common.description"), dataIndex: "desc", key: "desc", ellipsis: true },
      {
        title: t("common.operation"),
        key: "action",
        width: 150,
        render: (_, record) => (
          <WorkerActionsCell record={record} onEdit={crud.handleEdit} onDelete={crud.handleDelete} />
        ),
      },
    ],
    [t, crud.handleEdit, crud.handleDelete],
  );

  return (
    <div data-testid="worker-list">
      <ProTable<Worker>
        headerTitle={t("worker.title")}
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
            data-testid="add-worker-button"
          >
            {t("worker.add")}
          </Button>,
        ]}
        request={async (params) => {
          const result = await getWorkers({ page: params.current ?? 1, pageSize: params.pageSize ?? 10 });
          return { data: result.data, total: result.total, success: true };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      />
      <WorkerFormModal
        open={crud.modalOpen}
        isEdit={!!crud.editingWorker}
        form={crud.form}
        confirmLoading={crud.confirmLoading}
        onOk={crud.handleModalOk}
        onCancel={crud.handleModalCancel}
      />
    </div>
  );
}
