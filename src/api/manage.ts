import request from "./request";
import type { ResourceFile, ManagedUser, EnvConfig, CustomParam } from "@/types/manage";
import type { PaginatedResponse, PaginationParams } from "@/types/common";

// ---- Resource Management ----

export function uploadResource(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ResourceFile> {
  const formData = new FormData();
  formData.append("file", file);
  return request
    .post<ResourceFile>("/resources/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    })
    .then((res) => res.data);
}

export function getResources(
  params?: PaginationParams,
): Promise<PaginatedResponse<ResourceFile>> {
  return request
    .get<PaginatedResponse<ResourceFile>>("/resources", { params })
    .then((res) => res.data);
}

export function deleteResource(id: string): Promise<void> {
  return request.delete(`/resources/${id}`).then(() => undefined);
}

// ---- User Management ----

export function getUsers(
  params?: PaginationParams,
): Promise<PaginatedResponse<ManagedUser>> {
  return request
    .get<PaginatedResponse<ManagedUser>>("/users", { params })
    .then((res) => res.data);
}

export function createUser(
  data: Omit<ManagedUser, "id" | "createdAt">,
): Promise<ManagedUser> {
  return request.post<ManagedUser>("/users", data).then((res) => res.data);
}

export function updateUser(
  id: string,
  data: Partial<Omit<ManagedUser, "id" | "createdAt">>,
): Promise<ManagedUser> {
  return request
    .put<ManagedUser>(`/users/${id}`, data)
    .then((res) => res.data);
}

// ---- Environment Configuration ----

export function getEnvConfigs(
  params?: PaginationParams,
): Promise<PaginatedResponse<EnvConfig>> {
  return request
    .get<PaginatedResponse<EnvConfig>>("/env-configs", { params })
    .then((res) => res.data);
}

export function updateEnvConfig(
  id: string,
  data: Partial<Omit<EnvConfig, "id">>,
): Promise<EnvConfig> {
  return request
    .put<EnvConfig>(`/env-configs/${id}`, data)
    .then((res) => res.data);
}

// ---- Custom Parameters ----

export function getParams(
  params?: PaginationParams,
): Promise<PaginatedResponse<CustomParam>> {
  return request
    .get<PaginatedResponse<CustomParam>>("/params", { params })
    .then((res) => res.data);
}

export function createParam(
  data: Omit<CustomParam, "id">,
): Promise<CustomParam> {
  return request.post<CustomParam>("/params", data).then((res) => res.data);
}

export function updateParam(
  id: string,
  data: Partial<Omit<CustomParam, "id">>,
): Promise<CustomParam> {
  return request
    .put<CustomParam>(`/params/${id}`, data)
    .then((res) => res.data);
}

export function deleteParam(id: string): Promise<void> {
  return request.delete(`/params/${id}`).then(() => undefined);
}
