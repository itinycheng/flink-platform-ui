import { useRef, useState } from "react";
import { Form, message } from "antd";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import type { Tag as TagModel } from "@/types/manage";
import { createTag, deleteTag, updateTag } from "@/api/manage";

function isFormValidationError(error: unknown): boolean {
  return !!error && typeof error === "object" && "errorFields" in error;
}

export function useTagCrud() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagModel | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: TagModel) => {
    setEditingTag(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      if (editingTag) {
        await updateTag(editingTag.id, values);
        message.success(t("common.updateSuccess"));
      } else {
        await createTag(values);
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      form.resetFields();
      setEditingTag(null);
      void actionRef.current?.reload();
    } catch (error) {
      if (isFormValidationError(error)) return;
      message.error(editingTag ? t("common.updateFailed") : t("common.createFailed"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingTag(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return {
    actionRef,
    modalOpen,
    editingTag,
    confirmLoading,
    form,
    handleAdd,
    handleEdit,
    handleModalOk,
    handleModalCancel,
    handleDelete,
  };
}
