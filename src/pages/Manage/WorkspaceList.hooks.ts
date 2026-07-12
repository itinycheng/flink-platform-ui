import { useRef, useState } from "react";
import { Form, message } from "antd";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import type { Workspace } from "@/types/workspace";
import { createWorkspace, deleteWorkspace, updateWorkspace } from "@/api/workspace";

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

export function useWorkspaceCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingWorkspace(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Workspace) => {
    setEditingWorkspace(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description ?? "",
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createWorkspace(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingWorkspace(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingWorkspace ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingWorkspace(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkspace(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingWorkspace,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}
