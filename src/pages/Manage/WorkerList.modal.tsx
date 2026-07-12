import { Modal, Form, Input, InputNumber, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import { getWorkerRoleOptions, getWorkerStatusOptions } from "./WorkerList.constants";

interface WorkerFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function WorkerFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: WorkerFormModalProps) {
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
        <Form.Item
          name="port"
          label={t("worker.port")}
          rules={[{ required: true, message: t("worker.portPlaceholder") }]}
        >
          <InputNumber
            placeholder={t("worker.portPlaceholder")}
            min={1}
            max={65535}
            style={{ width: "100%" }}
            data-testid="input-port"
          />
        </Form.Item>
        <Form.Item name="role" label={t("worker.role")} rules={[{ required: true, message: t("worker.rolePlaceholder") }]}>
          <Select placeholder={t("worker.rolePlaceholder")} options={getWorkerRoleOptions(t)} data-testid="select-role" />
        </Form.Item>
        <Form.Item name="status" label={t("common.status")} rules={[{ required: true, message: t("worker.statusPlaceholder") }]}>
          <Select placeholder={t("worker.statusPlaceholder")} options={getWorkerStatusOptions(t)} data-testid="select-status" />
        </Form.Item>
        <Form.Item name="description" label={t("common.description")}>
          <Input.TextArea placeholder={t("worker.descriptionPlaceholder")} rows={3} data-testid="input-description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
