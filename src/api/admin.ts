import { http } from "@/utils/request";
import type {
  ResourceFile,
  ResourcePathItem,
  FolderNode,
  ManagedUser,
  CustomParam,
  DataSource,
  Catalog,
  Worker,
  Tag,
  SysConfig,
  AuditLog,
  AuditResult,
} from "@/types/admin";
import type { PaginatedResponse, PaginationParams, IPage } from "@/types/common";
import { ipageToPaginated, toPageParams } from "@/types/common";

// ---- Resource Management ----

export interface ResourceQuery {
  /** Folder to list; omit for the root. */
  parentId?: string;
  name?: string;
  page: number;
  pageSize: number;
}

export function getResources(params: ResourceQuery): Promise<PaginatedResponse<ResourceFile>> {
  return http.get<PaginatedResponse<ResourceFile>>("/resources", { params });
}

/** Create a folder under `parentId` (root when omitted). */
export function createFolder(name: string, parentId?: string): Promise<ResourceFile> {
  return http.post<ResourceFile>("/resources/folder", { name, parentId: parentId ?? null });
}

export function uploadResource(
  file: File,
  parentId?: string,
  onProgress?: (percent: number) => void,
): Promise<ResourceFile> {
  const formData = new FormData();
  formData.append("file", file);
  if (parentId) formData.append("parentId", parentId);
  return http.post<ResourceFile>("/resources/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
}

/** Ancestor path (root → … → the folder) for the breadcrumb. */
export function getResourcePath(id: string): Promise<ResourcePathItem[]> {
  return http.get<ResourcePathItem[]>(`/resources/${id}/path`);
}

export function renameResource(id: string, name: string): Promise<ResourceFile> {
  return http.put<ResourceFile>(`/resources/${id}`, { name });
}

/** Move a resource under a new parent folder (root when omitted). */
export function moveResource(id: string, targetParentId?: string): Promise<ResourceFile> {
  return http.post<ResourceFile>(`/resources/${id}/move`, { targetParentId: targetParentId ?? null });
}

/** The full folder hierarchy, for the move-target picker. */
export function getFolderTree(): Promise<FolderNode[]> {
  return http.get<FolderNode[]>("/resources/folders");
}

export function deleteResource(id: string): Promise<void> {
  return http.delete(`/resources/${id}`);
}

// ---- User Management ---- (backend: /user/*)

export function getUsers(params?: PaginationParams): Promise<PaginatedResponse<ManagedUser>> {
  return http.get<IPage<ManagedUser>>("/user/page", { params: toPageParams(params) }).then(ipageToPaginated);
}

export function createUser(data: Omit<ManagedUser, "id" | "createdAt">): Promise<number> {
  return http.post<number>("/user/create", data);
}

export function updateUser(id: string, data: Partial<Omit<ManagedUser, "id" | "createdAt">>): Promise<number> {
  return http.post<number>("/user/update", { ...data, id });
}

// ---- Job Parameters ---- (backend: /jobParam/*)

export function getParams(params?: PaginationParams): Promise<PaginatedResponse<CustomParam>> {
  return http.get<IPage<CustomParam>>("/jobParam/page", { params: toPageParams(params) }).then(ipageToPaginated);
}

export function createParam(data: Omit<CustomParam, "id">): Promise<number> {
  return http.post<number>("/jobParam/create", data);
}

export function updateParam(id: string, data: Partial<Omit<CustomParam, "id">>): Promise<number> {
  return http.post<number>("/jobParam/update", { ...data, id });
}

export function deleteParam(id: string): Promise<boolean> {
  return http.get<boolean>(`/jobParam/delete/${id}`);
}

// ---- Data Sources ----

export function getDataSources(params?: PaginationParams): Promise<PaginatedResponse<DataSource>> {
  return http.get<IPage<DataSource>>("/datasource/page", { params: toPageParams(params) }).then(ipageToPaginated);
}

export function createDataSource(data: Omit<DataSource, "id" | "createdAt" | "updatedAt">): Promise<number> {
  return http.post<number>("/datasource/create", data);
}

export function updateDataSource(
  id: string,
  data: Partial<Omit<DataSource, "id" | "createdAt" | "updatedAt">>,
): Promise<number> {
  return http.post<number>("/datasource/update", { ...data, id });
}

export function deleteDataSource(id: string): Promise<boolean> {
  return http.get<boolean>(`/datasource/delete/${id}`);
}

/** Test a persisted datasource's connection by id (backend returns a boolean). */
export function testDataSourceConnection(id: string): Promise<boolean> {
  return http.get<boolean>(`/datasource/test/${id}`);
}

// ---- Catalogs ---- (backend: /catalog/*)

export function getCatalogs(params?: PaginationParams): Promise<PaginatedResponse<Catalog>> {
  return http.get<IPage<Catalog>>("/catalog/page", { params: toPageParams(params) }).then(ipageToPaginated);
}

export function createCatalog(data: Omit<Catalog, "id" | "createdAt" | "updatedAt">): Promise<number> {
  return http.post<number>("/catalog/create", data);
}

export function updateCatalog(
  id: string,
  data: Partial<Omit<Catalog, "id" | "createdAt" | "updatedAt">>,
): Promise<number> {
  return http.post<number>("/catalog/update", { ...data, id });
}

export function deleteCatalog(id: string): Promise<boolean> {
  return http.get<boolean>(`/catalog/delete/${id}`);
}

// ---- Workers ---- (backend: /worker/*)

export function getWorkers(params?: PaginationParams): Promise<PaginatedResponse<Worker>> {
  return http.get<IPage<Worker>>("/worker/page", { params: toPageParams(params) }).then(ipageToPaginated);
}

export function createWorker(data: Omit<Worker, "id" | "createdAt" | "updatedAt">): Promise<number> {
  return http.post<number>("/worker/create", data);
}

export function updateWorker(
  id: string,
  data: Partial<Omit<Worker, "id" | "createdAt" | "updatedAt">>,
): Promise<number> {
  return http.post<number>("/worker/update", { ...data, id });
}

export function deleteWorker(id: string): Promise<boolean> {
  return http.get<boolean>(`/worker/delete/${id}`);
}

// ---- Tags ---- (backend: /tag/*)

export function getTags(params?: PaginationParams): Promise<PaginatedResponse<Tag>> {
  return http.get<IPage<Tag>>("/tag/page", { params: toPageParams(params) }).then(ipageToPaginated);
}

export function createTag(data: Omit<Tag, "id" | "createdAt" | "updatedAt">): Promise<number> {
  return http.post<number>("/tag/create", data);
}

export function updateTag(id: string, data: Partial<Omit<Tag, "id" | "createdAt" | "updatedAt">>): Promise<number> {
  return http.post<number>("/tag/update", { ...data, id });
}

export function deleteTag(id: string): Promise<boolean> {
  return http.get<boolean>(`/tag/delete/${id}`);
}

// ---- System Configs ---- (backend: /config/*)

export function getSysConfigs(params?: PaginationParams): Promise<PaginatedResponse<SysConfig>> {
  return http.get<IPage<SysConfig>>("/config/page", { params: toPageParams(params) }).then(ipageToPaginated);
}

export function createSysConfig(data: Omit<SysConfig, "id" | "createdAt" | "updatedAt">): Promise<number> {
  return http.post<number>("/config/create", data);
}

export function updateSysConfig(
  id: string,
  data: Partial<Omit<SysConfig, "id" | "createdAt" | "updatedAt">>,
): Promise<number> {
  return http.post<number>("/config/update", { ...data, id });
}

export function deleteSysConfig(id: string): Promise<boolean> {
  return http.get<boolean>(`/config/delete/${id}`);
}

/** Physically purge a soft-deleted config. */
export function purgeSysConfig(id: string): Promise<boolean> {
  return http.get<boolean>(`/config/purge/${id}`);
}

// ---- Audit Log ----

export interface AuditLogQuery extends PaginationParams {
  operator?: string;
  action?: string;
  module?: string;
  result?: AuditResult;
  startTime?: string;
  endTime?: string;
}

export function getAuditLogs(params?: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> {
  return http
    .get<IPage<AuditLog>>("/auditLog/page", { params: { ...params, ...toPageParams(params) } })
    .then(ipageToPaginated);
}
