import { create } from "zustand";
import type { Workspace } from "@/types/workspace";
import { getAllWorkspaces } from "@/api/workspace";
import { STORAGE_KEYS } from "@/constants/storage";
import { queryClient } from "@/app/queryClient";
import { useJobStore } from "@/stores/jobStore";
import { queryKeys } from "@/api/queryKeys";

interface WorkspaceState {
  workspaces: Workspace[];
  currentId: number | null;
  loading: boolean;
  loaded: boolean;
  loadWorkspaces: () => Promise<void>;
  setCurrent: (id: number) => void;
}

function readStoredId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEYS.workspaceId);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentId: readStoredId(),
  loading: false,
  loaded: false,

  loadWorkspaces: async () => {
    set({ loading: true });
    try {
      const list = await queryClient.fetchQuery({
        queryKey: queryKeys.workspaces,
        queryFn: getAllWorkspaces,
        staleTime: 60_000,
      });
      // Default the active workspace to the first one if none is selected yet.
      let currentId = get().currentId;
      if (currentId == null || !list.some((w) => w.id === currentId)) {
        currentId = list[0]?.id ?? null;
        if (currentId != null) localStorage.setItem(STORAGE_KEYS.workspaceId, String(currentId));
      }
      set({ workspaces: list, currentId, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setCurrent: (id) => {
    const previousId = get().currentId;
    if (id === previousId) return;
    localStorage.setItem(STORAGE_KEYS.workspaceId, String(id));
    set({ currentId: id });
    // Prevent data from the previous tenant appearing in the new workspace.
    void queryClient.cancelQueries({ queryKey: ["workspace", previousId] }).finally(() => {
      queryClient.removeQueries({ queryKey: ["workspace", previousId] });
    });
    useJobStore.setState({
      treeData: [],
      selectedNode: null,
      treeLoading: false,
      loadingGroups: new Set(),
      loadedGroups: new Set(),
      searchExpandedKeys: null,
      openTabs: [],
      activeTabKey: null,
    });
  },
}));
