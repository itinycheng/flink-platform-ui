import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ActionType } from "@ant-design/pro-components";
import {
  uploadResource,
  deleteResource,
  createFolder,
  getResourcePath,
  renameResource,
  moveResource,
} from "@/api/manage";
import type { ResourcePathItem } from "@/types/manage";

/** Folder navigation, upload, create-folder and delete actions for the resource browser. */
export function useResourceActions() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const folder = searchParams.get("folder") ?? undefined;
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const reload = () => void actionRef.current?.reload();
  const navigateFolder = (id?: string) => setSearchParams(id ? { folder: id } : {});

  const handleUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      await uploadResource(file, folder, (percent) => setUploadProgress(percent));
      message.success(t("resource.uploadSuccess", { name: file.name }));
      reload();
    } catch {
      message.error(t("resource.uploadFailed"));
    } finally {
      setUploadProgress(null);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name, folder);
      message.success(t("resource.folderCreated"));
      reload();
    } catch {
      message.error(t("resource.createFolderFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id);
      message.success(t("common.deleteSuccess"));
      reload();
    } catch {
      message.error(t("common.deleteFailed"));
    }
  };

  const handleRename = async (id: string, name: string) => {
    try {
      await renameResource(id, name);
      message.success(t("resource.renameSuccess"));
      reload();
    } catch {
      message.error(t("resource.renameFailed"));
    }
  };

  const handleMove = async (id: string, targetParentId?: string) => {
    try {
      await moveResource(id, targetParentId);
      message.success(t("resource.moveSuccess"));
      reload();
    } catch {
      message.error(t("resource.moveFailed"));
    }
  };

  return {
    actionRef,
    folder,
    uploadProgress,
    navigateFolder,
    handleUpload,
    handleCreateFolder,
    handleDelete,
    handleRename,
    handleMove,
  };
}

/** Resolve the ancestor path (root → … → current) of `folder` for the breadcrumb. */
export function useResourcePath(folder?: string): ResourcePathItem[] {
  const [path, setPath] = useState<ResourcePathItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!folder) {
        setPath([]);
        return;
      }
      try {
        const result = await getResourcePath(folder);
        if (!cancelled) setPath(result);
      } catch (err) {
        console.error("[Resource] load path failed", err);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [folder]);

  return path;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
