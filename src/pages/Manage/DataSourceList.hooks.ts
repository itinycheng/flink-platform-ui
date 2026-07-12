import { useRef, useState } from "react";
import { Form, message } from "antd";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import type { DataSource } from "@/types/manage";
import i18n from "@/i18n";
import {
  createDataSource,
  deleteDataSource,
  testDataSourceConnection,
  updateDataSource,
} from "@/api/manage";

// NOTE: This hook mirrors useParamCrud in src/pages/Manage/CustomParamList.hooks.ts,
// with an additional handleTest for connection testing.

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

async function handleTest(id: string) {
  try {
    const result = await testDataSourceConnection(id);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  } catch {
    message.error(i18n.t("datasource.testFailed"));
  }
}

export function useDataSourceCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingDataSource(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: DataSource) => {
    setEditingDataSource(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      params: record.params,
      description: record.description ?? "",
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingDataSource) {
        await updateDataSource(editingDataSource.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createDataSource(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingDataSource(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingDataSource ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingDataSource(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDataSource(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingDataSource,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
    handleTest,
  };
}
