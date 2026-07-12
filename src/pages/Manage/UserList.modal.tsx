import { Modal, Form, Input, Select, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import { getRoleOptions } from "./UserList.constants";

interface UserFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: FormInstance;
  confirmLoading: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export function UserFormModal({ open, isEdit, form, confirmLoading, onOk, onCancel }: UserFormModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={isEdit ? t("user2.editTitle") : t("user2.addTitle")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      destroyOnHidden
      data-testid="user-modal"
    >
      <Form form={form} layout="vertical" data-testid="user-form">
        <Form.Item name="username" label={t("user2.usernameLabel")} rules={[{ required: true, message: t("user2.usernamePlaceholder") }]}>
          <Input placeholder={t("user2.usernamePlaceholder")} data-testid="input-username" />
        </Form.Item>
        <Form.Item
          name="email"
          label={t("user2.emailLabel")}
          rules={[
            { required: true, message: t("user2.emailPlaceholder") },
            { type: "email", message: t("user2.emailInvalid") },
          ]}
        >
          <Input placeholder={t("user2.emailPlaceholder")} data-testid="input-email" />
        </Form.Item>
        <Form.Item name="roles" label={t("user2.rolesLabel")} rules={[{ required: true, message: t("user2.rolesPlaceholder") }]}>
          <Select mode="multiple" placeholder={t("user2.rolesPlaceholder")} options={getRoleOptions(t)} data-testid="select-roles" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
