import { useRef, useState } from "react";
import { message } from "antd";
import type { ActionType } from "@ant-design/pro-components";
import type { AlertPolicy } from "@/types/monitor";
import { createAlert, updateAlert } from "@/api/monitor";

export function useAlertPolicyCrud() {
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
        message.success("策略更新成功");
      } else {
        await createAlert(values);
        message.success("策略创建成功");
      }
      setModalOpen(false);
      void actionRef.current?.reload();
    } catch {
      message.error(editingPolicy ? "策略更新失败，请重试" : "策略创建失败，请重试");
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
      message.success(checked ? "策略已启用" : "策略已禁用");
      void actionRef.current?.reload();
    } catch {
      message.error("操作失败，请重试");
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
