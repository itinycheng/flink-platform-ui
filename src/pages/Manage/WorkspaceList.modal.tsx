import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import { getWorkspaceStatusOptions } from "./WorkspaceList.constants";

interface WorkspaceFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function WorkspaceFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: WorkspaceFormModalProps) {
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
