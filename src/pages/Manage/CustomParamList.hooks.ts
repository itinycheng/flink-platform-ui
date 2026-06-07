import { useRef, useState } from "react";
import { Form, message } from "antd";
import type { ActionType } from "@ant-design/pro-components";
import type { CustomParam } from "@/types/manage";
import { createParam, deleteParam, updateParam } from "@/api/manage";

// NOTE: This hook is structurally near-identical to useUserCrud in
// src/pages/Manage/UserList.hooks.ts. If a third CRUD list page appears,
// consider extracting a generic `useModalForm<T>()` hook.

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

export function useParamCrud() {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<CustomParam | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingParam(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: CustomParam) => {
    setEditingParam(record);
    form.setFieldsValue({
      name: record.name,
      value: record.value,
      type: record.type,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingParam) {
        await updateParam(editingParam.id, values);
        message.success("参数更新成功");
      } else {
        await createParam(values);
        message.success("参数创建成功");
      }
      setModalOpen(false);
      form.resetFields();
      setEditingParam(null);
      actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingParam ? "参数更新失败，请重试" : "参数创建失败，请重试");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingParam(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteParam(id);
      message.success("参数已删除");
      actionRef.current?.reload();
    } catch {
      message.error("删除失败，请重试");
    }
  };

  return {
    actionRef,
    modalOpen,
    editingParam,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}
