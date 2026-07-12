import { useRef, useState } from "react";
import { message } from "antd";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import type { AlertPolicy } from "@/types/monitor";
import { createAlert, updateAlert } from "@/api/monitor";

export function useAlertPolicyCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AlertPolicy | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleAdd = () => {
    setEditingPolicy(null);
    setModalOpen(true);
  };

  const handleEdit = (record: AlertPolicy) => {
    setEditingPolicy(record);
    setModalOpen(true);
  };

  const handleFormOk = async (values: Omit<AlertPolicy, "id">) => {
    try {
      setConfirmLoading(true);
      if (editingPolicy) {
        await updateAlert(editingPolicy.id, values);
        message.success(t("monitor.policyUpdateSuccess"));
      } else {
        await createAlert(values);
        message.success(t("monitor.policyCreateSuccess"));
      }
      setModalOpen(false);
      void actionRef.current?.reload();
    } catch {
      message.error(editingPolicy ? t("monitor.policyUpdateFailed") : t("monitor.policyCreateFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleFormCancel = () => {
    setModalOpen(false);
    setEditingPolicy(null);
  };

  const handleToggleEnabled = async (record: AlertPolicy, checked: boolean) => {
    try {
      await updateAlert(record.id, { enabled: checked });
      message.success(checked ? t("monitor.policyEnabled") : t("monitor.policyDisabled"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.actionFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingPolicy,
    confirmLoading,
    handleAdd,
    handleEdit,
    handleFormOk,
    handleFormCancel,
    handleToggleEnabled,
  };
}
