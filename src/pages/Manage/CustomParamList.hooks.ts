import { useRef, useState } from "react";
import { Form, message } from "antd";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        message.success(t("common.updateSuccess"));
      } else {
        await createParam(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingParam(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingParam ? t("common.updateFailed") : t("common.createFailed"));
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
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
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
