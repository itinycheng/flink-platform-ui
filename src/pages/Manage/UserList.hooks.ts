import { useRef, useState } from "react";
import { Form, message } from "antd";
import type { ActionType } from "@ant-design/pro-components";
import type { ManagedUser } from "@/types/manage";
import { createUser, updateUser } from "@/api/manage";

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

export function useUserCrud() {
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
        message.success("用户更新成功");
      } else {
        await createUser({ ...values, status: "active" });
        message.success("用户创建成功");
      }
      setModalOpen(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingUser ? "用户更新失败，请重试" : "用户创建失败，请重试");
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
      message.success(newStatus === "disabled" ? "用户已禁用" : "用户已启用");
      actionRef.current?.reload();
    } catch {
      message.error("操作失败，请重试");
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
