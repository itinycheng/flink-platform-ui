import { useRef, useState } from "react";
import { message } from "antd";
import type { ActionType } from "@ant-design/pro-components";
import { uploadResource, deleteResource } from "@/api/manage";

export function useResourceActions() {
  const actionRef = useRef<ActionType>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      await uploadResource(file, (percent) => setUploadProgress(percent));
      message.success(`文件 "${file.name}" 上传成功`);
      void actionRef.current?.reload();
    } catch {
      message.error("文件上传失败，请重试");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id);
      message.success("资源已删除");
      void actionRef.current?.reload();
    } catch {
      message.error("删除失败，请重试");
    }
  };

  return { actionRef, uploadProgress, handleUpload, handleDelete };
}
