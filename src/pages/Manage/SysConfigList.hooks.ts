import { useRef, useState } from "react";
import { Form, message } from "antd";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import type { SysConfig } from "@/types/manage";
import { createSysConfig, deleteSysConfig, purgeSysConfig, updateSysConfig } from "@/api/manage";

// NOTE: Structurally mirrors useParamCrud in CustomParamList.hooks.ts, with an
// extra handlePurge for the physical-cleanup action on soft-deleted configs.

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

export function useSysConfigCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SysConfig | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: SysConfig) => {
    setEditingConfig(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      version: record.version,
      status: record.status,
      content: record.content,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingConfig) {
        await updateSysConfig(editingConfig.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createSysConfig(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingConfig(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingConfig ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingConfig(null);
  };

  const runRowAction = async (action: (id: string) => Promise<void>, id: string, ok: string, fail: string) => {
    try {
      await action(id);
      message.success(ok);
      void actionRef.current?.reload();
    } catch {
      message.error(fail);
    }
  };

  const handleDelete = (id: string) =>
    runRowAction(deleteSysConfig, id, t("common.deleteSuccess"), t("common.deleteFailed"));
  const handlePurge = (id: string) =>
    runRowAction(purgeSysConfig, id, t("sysConfig.purgeSuccess"), t("sysConfig.purgeFailed"));

  return {
    actionRef,
    modalOpen,
    editingConfig,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
    handlePurge,
  };
}
