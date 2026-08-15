export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

/** MyBatis-Plus page wrapper returned by the backend `/…/page` endpoints. */
export interface IPage<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/** Adapt a backend {@link IPage} into the UI's {@link PaginatedResponse}. */
export function ipageToPaginated<T>(page: IPage<T>): PaginatedResponse<T> {
  return { data: page.records, total: page.total, page: page.current, pageSize: page.size };
}

/** Map UI pagination params to the backend `page`/`size` query params. */
export function toPageParams(params?: PaginationParams): { page: number; size: number } {
  return { page: params?.page ?? 1, size: params?.pageSize ?? 10 };
}
