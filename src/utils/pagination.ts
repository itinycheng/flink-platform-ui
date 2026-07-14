import type { PaginatedResponse } from "@/types/common";

/**
 * Paginate an array of items based on page number and page size.
 * Returns a PaginatedResponse with the correct slice of data.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

/**
 * Parse pagination parameters from a URL.
 */
export function parsePagination(url: URL): { page: number; pageSize: number } {
  return {
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Number(url.searchParams.get("pageSize")) || 10,
  };
}
