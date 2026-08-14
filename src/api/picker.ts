import { http } from "@/utils/request";
import type { Worker, Datasource, CatalogInfo, Resource } from "@/types/entities";
import type { JobType } from "@/constants/enums";

/** Workers available as job route targets (excludes deleted). */
export function listWorkers(): Promise<Worker[]> {
  return http.get<Worker[]>("/worker/list");
}

/** Datasources; when `jobType` is given the backend filters to that type's dbType. */
export function listDatasources(jobType?: JobType): Promise<Datasource[]> {
  return http.get<Datasource[]>("/datasource/list", jobType ? { params: { jobType } } : undefined);
}

/** Flink catalogs in the current workspace. */
export function listCatalogs(): Promise<CatalogInfo[]> {
  return http.get<CatalogInfo[]>("/catalog/list");
}

/** FILE resources, optionally filtered by a filename suffix (e.g. "jar"). */
export function listResourceFiles(ext?: string): Promise<Resource[]> {
  return http.get<Resource[]>("/resource/list", { params: { type: "FILE", ext } });
}
