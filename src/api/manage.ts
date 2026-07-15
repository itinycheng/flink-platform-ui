import { http } from "@/utils/request";
import type {
  ResourceFile,
  ResourcePathItem,
  FolderNode,
  ManagedUser,
  CustomParam,
  DataSource,
  TestConnectionResult,
  Catalog,
  Worker,
  Tag,
  SysConfig,
  AuditLog,
  AuditResult,
} from "@/types/manage";
import type { PaginatedResponse, PaginationParams } from "@/types/common";

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

// ---- User Management ----

export function getUsers(params?: PaginationParams): Promise<PaginatedResponse<ManagedUser>> {
  return http.get<PaginatedResponse<ManagedUser>>("/users", { params });
}

export function createUser(data: Omit<ManagedUser, "id" | "createdAt">): Promise<ManagedUser> {
  return http.post<ManagedUser>("/users", data);
}

export function updateUser(id: string, data: Partial<Omit<ManagedUser, "id" | "createdAt">>): Promise<ManagedUser> {
  return http.put<ManagedUser>(`/users/${id}`, data);
}

// ---- Custom Parameters ----

export function getParams(params?: PaginationParams): Promise<PaginatedResponse<CustomParam>> {
  return http.get<PaginatedResponse<CustomParam>>("/params", { params });
}

export function createParam(data: Omit<CustomParam, "id">): Promise<CustomParam> {
  return http.post<CustomParam>("/params", data);
}

export function updateParam(id: string, data: Partial<Omit<CustomParam, "id">>): Promise<CustomParam> {
  return http.put<CustomParam>(`/params/${id}`, data);
}

export function deleteParam(id: string): Promise<void> {
  return http.delete(`/params/${id}`);
}

// ---- Data Sources ----

export function getDataSources(params?: PaginationParams): Promise<PaginatedResponse<DataSource>> {
  return http.get<PaginatedResponse<DataSource>>("/datasources", { params });
}

export function createDataSource(
  data: Omit<DataSource, "id" | "createdAt" | "updatedAt">,
): Promise<DataSource> {
  return http.post<DataSource>("/datasources", data);
}

export function updateDataSource(
  id: string,
  data: Partial<Omit<DataSource, "id" | "createdAt" | "updatedAt">>,
): Promise<DataSource> {
  return http.put<DataSource>(`/datasources/${id}`, data);
}

export function deleteDataSource(id: string): Promise<void> {
  return http.delete(`/datasources/${id}`);
}

export function testDataSourceConnection(id: string): Promise<TestConnectionResult> {
  return http.post<TestConnectionResult>(`/datasources/${id}/test`);
}

// ---- Catalogs ----

export function getCatalogs(params?: PaginationParams): Promise<PaginatedResponse<Catalog>> {
  return http.get<PaginatedResponse<Catalog>>("/catalogs", { params });
}

export function createCatalog(data: Omit<Catalog, "id" | "createdAt" | "updatedAt">): Promise<Catalog> {
  return http.post<Catalog>("/catalogs", data);
}

export function updateCatalog(
  id: string,
  data: Partial<Omit<Catalog, "id" | "createdAt" | "updatedAt">>,
): Promise<Catalog> {
  return http.put<Catalog>(`/catalogs/${id}`, data);
}

export function deleteCatalog(id: string): Promise<void> {
  return http.delete(`/catalogs/${id}`);
}

// ---- Workers ----

export function getWorkers(params?: PaginationParams): Promise<PaginatedResponse<Worker>> {
  return http.get<PaginatedResponse<Worker>>("/workers", { params });
}

export function createWorker(data: Omit<Worker, "id" | "createdAt" | "updatedAt">): Promise<Worker> {
  return http.post<Worker>("/workers", data);
}

export function updateWorker(
  id: string,
  data: Partial<Omit<Worker, "id" | "createdAt" | "updatedAt">>,
): Promise<Worker> {
  return http.put<Worker>(`/workers/${id}`, data);
}

export function deleteWorker(id: string): Promise<void> {
  return http.delete(`/workers/${id}`);
}

// ---- Tags ----

export function getTags(params?: PaginationParams): Promise<PaginatedResponse<Tag>> {
  return http.get<PaginatedResponse<Tag>>("/tags", { params });
}

export function createTag(data: Omit<Tag, "id" | "createdAt" | "updatedAt">): Promise<Tag> {
  return http.post<Tag>("/tags", data);
}

export function updateTag(id: string, data: Partial<Omit<Tag, "id" | "createdAt" | "updatedAt">>): Promise<Tag> {
  return http.put<Tag>(`/tags/${id}`, data);
}

export function deleteTag(id: string): Promise<void> {
  return http.delete(`/tags/${id}`);
}

// ---- System Configs ----

export function getSysConfigs(params?: PaginationParams): Promise<PaginatedResponse<SysConfig>> {
  return http.get<PaginatedResponse<SysConfig>>("/sys-configs", { params });
}

export function createSysConfig(data: Omit<SysConfig, "id" | "createdAt" | "updatedAt">): Promise<SysConfig> {
  return http.post<SysConfig>("/sys-configs", data);
}

export function updateSysConfig(
  id: string,
  data: Partial<Omit<SysConfig, "id" | "createdAt" | "updatedAt">>,
): Promise<SysConfig> {
  return http.put<SysConfig>(`/sys-configs/${id}`, data);
}

export function deleteSysConfig(id: string): Promise<void> {
  return http.delete(`/sys-configs/${id}`);
}

/** Physically purge a soft-deleted config. */
export function purgeSysConfig(id: string): Promise<void> {
  return http.delete(`/sys-configs/${id}/purge`);
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
  return http.get<PaginatedResponse<AuditLog>>("/audit-logs", { params });
}
