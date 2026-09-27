import { http } from "@/utils/request";
import type {
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
import type { Resource } from "@/types/entities";
import type { PaginatedResponse, PaginationParams, IPage } from "@/types/common";
import type { Status } from "@/constants/enums";
import { ipageToPaginated, toPageParams } from "@/types/common";
import { formatLegacyDateTime } from "@/api/legacy/date";
import { adaptLegacyTimestamps, type LegacyTimestampFields } from "@/api/legacy/contracts";

// ---- Resource Management ---- (backend: /resource/*)

export function getResources(params: {
  pid?: number;
  name?: string;
  page: number;
  pageSize: number;
}): Promise<PaginatedResponse<Resource>> {
  return http
    .get<IPage<Resource>>("/resource/page", { params: { pid: params.pid, name: params.name, ...toPageParams(params) } })
    .then(ipageToPaginated);
}

/** Create a folder under `pid` (root when omitted). */
export function createFolder(name: string, pid?: number): Promise<number> {
  return http.post<number>("/resource/create", { name, type: "DIR", pid });
}

export function uploadResource(file: File, pid?: number, onProgress?: (percent: number) => void): Promise<Resource> {
  const formData = new FormData();
  formData.append("file", file);
  if (pid !== undefined) formData.append("pid", String(pid));
  return http.post<Resource>("/resource/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
}

/** Ancestor path (root → … → the resource) for the breadcrumb. */
export function getResourcePath(id: number): Promise<Resource[]> {
  return http.get<Resource[]>(`/resource/getWithParents/${id}`);
}

export function renameResource(id: number, name: string): Promise<number> {
  return http.post<number>("/resource/update", { id, name });
}

/** Move a resource under a new parent folder. `pid` omitted moves it to the root. */
export function moveResource(id: number, pid?: number): Promise<number> {
  return http.post<number>("/resource/update", { id, pid: pid ?? null });
}

/** The flat DIR list, for the move-target picker (nested client-side by `pid`). */
export function getFolderTree(): Promise<Resource[]> {
  return http.get<Resource[]>("/resource/list", { params: { type: "DIR" } });
}

export function deleteResource(id: number): Promise<boolean> {
  return http.get<boolean>(`/resource/delete/${id}`);
}

// ---- User Management ---- (backend: /user/*)

export function getUsers(params?: PaginationParams): Promise<PaginatedResponse<ManagedUser>> {
  return http
    .get<IPage<ManagedUser & LegacyTimestampFields>>("/user/page", { params: toPageParams(params) })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptLegacyTimestamps) }));
}

export function createUser(data: Omit<ManagedUser, "id" | "createdAt">): Promise<number> {
  return http.post<number>("/user/create", data);
}

export function updateUser(id: string, data: Partial<Omit<ManagedUser, "id" | "createdAt">>): Promise<number> {
  const { roles, ...profile } = data;
  return http.post<number>("/user/update", { ...profile, id }).then(async (updatedId) => {
    if (roles) await http.post<number>("/user/update/roles", { id, roles });
    return updatedId;
  });
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
  return http
    .get<IPage<DataSource & LegacyTimestampFields>>("/datasource/page", { params: toPageParams(params) })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptLegacyTimestamps) }));
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
  return http
    .get<IPage<Catalog & LegacyTimestampFields>>("/catalog/page", { params: toPageParams(params) })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptLegacyTimestamps) }));
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
  return http
    .get<IPage<Worker & LegacyTimestampFields>>("/worker/page", { params: toPageParams(params) })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptLegacyTimestamps) }));
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
  return http
    .get<IPage<Tag & LegacyTimestampFields>>("/tag/page", { params: toPageParams(params) })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptLegacyTimestamps) }));
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

export interface SysConfigQuery extends PaginationParams {
  name?: string;
  status?: Status;
}

export function getSysConfigs(params?: SysConfigQuery): Promise<PaginatedResponse<SysConfig>> {
  return http
    .get<IPage<SysConfig & LegacyTimestampFields>>("/config/page", {
      params: { ...toPageParams(params), name: params?.name, status: params?.status },
    })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptLegacyTimestamps) }));
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

interface LegacyAuditLogDto {
  id: number | string;
  entityId?: number | string;
  entityType?: string;
  operation?: string;
  snapshot?: string;
  operatorId?: number | string;
  operateTime?: string;
}

function adaptAuditLog(row: LegacyAuditLogDto): AuditLog {
  return {
    id: String(row.id),
    operator: row.operatorId == null ? "system" : String(row.operatorId),
    action: row.operation ?? "-",
    module: row.entityType?.toLowerCase() ?? "-",
    target: row.entityId == null ? undefined : String(row.entityId),
    result: "success",
    detail: row.snapshot,
    createdAt: row.operateTime ?? "",
  };
}

export function getAuditLogs(params?: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> {
  return http
    .get<IPage<LegacyAuditLogDto>>("/audit-logs", {
      params: {
        ...toPageParams(params),
        operatorId: params?.operator && /^\d+$/.test(params.operator) ? params.operator : undefined,
        operation: params?.action,
        entityType: params?.module?.toUpperCase(),
        startTime: formatLegacyDateTime(params?.startTime),
        endTime: formatLegacyDateTime(params?.endTime),
      },
    })
    .then((page) => ipageToPaginated({ ...page, records: page.records.map(adaptAuditLog) }));
}
