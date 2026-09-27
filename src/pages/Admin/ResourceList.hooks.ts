import { useState } from "react";
import { message } from "antd";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  uploadResource,
  deleteResource,
  createFolder,
  getResourcePath,
  renameResource,
  moveResource,
} from "@/api/admin";
import type { Resource } from "@/types/entities";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/app/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useInvalidateWorkspaceList } from "@/app/useWorkspacePageQuery";

/** Folder navigation, upload, create-folder and delete actions for the resource browser. */
export function useResourceActions() {
  const { t } = useTranslation();
  const invalidate = useInvalidateWorkspaceList("resources");
  const [searchParams, setSearchParams] = useSearchParams();
  const folder = searchParams.get("folder");
  const folderId = folder ? Number(folder) : undefined;
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const navigateFolder = (id?: number) => setSearchParams(id != null ? { folder: String(id) } : {});

  const handleUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      await uploadResource(file, folderId, (percent) => setUploadProgress(percent));
      message.success(t("resource.uploadSuccess", { name: file.name }));
      await invalidate();
    } catch {
      // handled by the global interceptor toast
    } finally {
      setUploadProgress(null);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name, folderId);
      message.success(t("resource.folderCreated"));
      await invalidate();
    } catch {
      // handled by the global interceptor toast
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteResource(id);
      message.success(t("common.deleteSuccess"));
      await invalidate();
    } catch {
      // handled by the global interceptor toast
    }
  };

  const handleRename = async (id: number, name: string) => {
    try {
      await renameResource(id, name);
      message.success(t("resource.renameSuccess"));
      await invalidate();
    } catch {
      // handled by the global interceptor toast
    }
  };

  const handleMove = async (id: number, targetPid?: number) => {
    try {
      await moveResource(id, targetPid);
      message.success(t("resource.moveSuccess"));
      await invalidate();
    } catch {
      // handled by the global interceptor toast
    }
  };

  return {
    folder: folderId,
    uploadProgress,
    navigateFolder,
    handleUpload,
    handleCreateFolder,
    handleDelete,
    handleRename,
    handleMove,
  };
}

/** Resolve the ancestor path (root → … → current) of `folderId` for the breadcrumb. */
export function useResourcePath(folderId?: number): Resource[] {
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  const { data = [] } = useQuery(
    {
      queryKey: queryKeys.resourcePath(workspaceId, folderId),
      queryFn: () => (folderId == null ? Promise.resolve([]) : getResourcePath(folderId)),
      enabled: workspaceId != null,
    },
    queryClient,
  );
  return data;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
