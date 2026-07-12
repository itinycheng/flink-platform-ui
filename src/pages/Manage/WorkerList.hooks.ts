import { useRef, useState } from "react";
import { Form, message } from "antd";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import type { Worker } from "@/types/manage";
import { createWorker, deleteWorker, updateWorker } from "@/api/manage";

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

export function useWorkerCrud() {
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
      role: record.role,
      status: record.status,
      description: record.description ?? "",
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
