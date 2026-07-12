import { useRef, useState } from "react";
import { Form, message } from "antd";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import type { ManagedUser } from "@/types/manage";
import { createUser, updateUser } from "@/api/manage";

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

export function useUserCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: ManagedUser) => {
    setEditingUser(record);
    form.setFieldsValue({ username: record.username, email: record.email, roles: record.roles });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createUser({ ...values, status: "active" });
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingUser ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingUser(null);
  };

  const handleToggleStatus = async (record: ManagedUser) => {
    const newStatus = record.status === "active" ? "disabled" : "active";
    try {
      await updateUser(record.id, { status: newStatus });
      message.success(newStatus === "disabled" ? t("user2.disableSuccess") : t("user2.enableSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.actionFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingUser,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleToggleStatus,
  };
}
