import { useRef, useState } from "react";
import { Form, message } from "antd";
import type { ActionType } from "@ant-design/pro-components";
import type { EnvConfig } from "@/types/manage";
import { updateEnvConfig } from "@/api/manage";

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

export function useEnvConfigEdit() {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EnvConfig | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleEdit = (record: EnvConfig) => {
    setEditingConfig(record);
    form.setFieldsValue({ value: record.value, description: record.description ?? "" });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingConfig) {
        await updateEnvConfig(editingConfig.id, values);
        message.success("配置更新成功");
      }
      setModalOpen(false);
      form.resetFields();
      setEditingConfig(null);
      actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error("配置更新失败，请重试");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingConfig(null);
  };

  return { actionRef, modalOpen, editingConfig, confirmLoading, form, handleEdit, handleModalOk, handleModalCancel };
}
