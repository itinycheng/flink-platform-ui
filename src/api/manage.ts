import { http } from "@/utils/request";
import type { ResourceFile, ManagedUser, EnvConfig, CustomParam } from "@/types/manage";
import type { PaginatedResponse, PaginationParams } from "@/types/common";

// ---- Resource Management ----

export function uploadResource(file: File, onProgress?: (percent: number) => void): Promise<ResourceFile> {
  const formData = new FormData();
  formData.append("file", file);
  return http.post<ResourceFile>("/resources/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
}

export function getResources(params?: PaginationParams): Promise<PaginatedResponse<ResourceFile>> {
  return http.get<PaginatedResponse<ResourceFile>>("/resources", { params });
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

// ---- Environment Configuration ----

export function getEnvConfigs(params?: PaginationParams): Promise<PaginatedResponse<EnvConfig>> {
  return http.get<PaginatedResponse<EnvConfig>>("/env-configs", { params });
}

export function updateEnvConfig(id: string, data: Partial<Omit<EnvConfig, "id">>): Promise<EnvConfig> {
  return http.put<EnvConfig>(`/env-configs/${id}`, data);
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
