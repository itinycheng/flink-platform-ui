import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/app/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { useWorkspaceStore } from "@/stores/workspaceStore";

/** Workspace-scoped, cached options shared by all forms using the same resource. */
export function useRemoteOptions<T>(
  resource: string,
  fetcher: () => Promise<T[]>,
  deps: readonly unknown[],
): { data: T[]; loading: boolean } {
  const workspaceId = useWorkspaceStore((state) => state.currentId);
  const { data = [], isPending } = useQuery(
    {
      queryKey: queryKeys.options(workspaceId, resource, deps),
      queryFn: fetcher,
      enabled: workspaceId != null,
      staleTime: 60_000,
    },
    queryClient,
  );
  return { data, loading: isPending };
}
