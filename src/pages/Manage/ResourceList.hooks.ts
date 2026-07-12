import { useRef, useState } from "react";
import { message } from "antd";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import { uploadResource, deleteResource } from "@/api/manage";

export function useResourceActions() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      await uploadResource(file, (percent) => setUploadProgress(percent));
      message.success(t("resource.uploadSuccess", { name: file.name }));
      void actionRef.current?.reload();
    } catch {
      message.error(t("resource.uploadFailed"));
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id);
      message.success(t("common.deleteSuccess"));
      void actionRef.current?.reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  return { actionRef, uploadProgress, handleUpload, handleDelete };
}
