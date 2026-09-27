import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse, PaginationParams } from "@/types/common";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { queryClient } from "./queryClient";
import { queryKeys } from "@/api/queryKeys";

type PageLoader<T> = (params: PaginationParams) => Promise<PaginatedResponse<T>>;

/** Controlled pagination backed by a workspace-scoped TanStack Query. */
export function useWorkspacePageQuery<T>(resource: string, loader: PageLoader<T>) {
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  const [params, setParams] = useState<PaginationParams>({ page: 1, pageSize: 10 });
  const query = useQuery(
    {
      queryKey: queryKeys.adminList(workspaceId, resource, params),
      queryFn: () => loader(params),
      enabled: workspaceId != null,
    },
    queryClient,
  );
  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    loading: query.isFetching,
    pagination: {
      current: params.page,
      pageSize: params.pageSize,
      showSizeChanger: true,
      onChange: (page: number, pageSize: number) => setParams({ page, pageSize }),
    },
  };
}

/** Invalidate every cached page/filter variant for one workspace resource. */
export function useInvalidateWorkspaceList(resource: string) {
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  return useCallback(
    async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "admin", resource] }),
        queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "options", resource] }),
        queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, resource] }),
      ]);
    },
    [workspaceId, resource],
  );
}
