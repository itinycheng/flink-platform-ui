import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import CodeEditor from "@/components/CodeEditor";
import { getSysConfigStatusOptions, getSysConfigTypeOptions } from "./SysConfigList.constants";

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

export function SysConfigFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: SysConfigFormModalProps) {
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
