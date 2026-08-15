import type { IPage } from "@/types/common";

/** Build a backend-style IPage slice from an in-memory array. */
export function ipage<T>(items: T[], page: number, size: number): IPage<T> {
  const start = (page - 1) * size;
  return {
    records: items.slice(start, start + size),
    total: items.length,
    size,
    current: page,
    pages: Math.ceil(items.length / size) || 1,
  };
}

/** Parse backend `page`/`size` query params from a request URL. */
export function parsePageSize(url: URL): { page: number; size: number } {
  return { page: Number(url.searchParams.get("page")) || 1, size: Number(url.searchParams.get("size")) || 10 };
}
