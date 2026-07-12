import { create } from "zustand";
import type { Workspace } from "@/types/workspace";
import { getAllWorkspaces } from "@/api/workspace";

/** localStorage key holding the active workspace id — read by the request interceptor. */
export const WORKSPACE_KEY = "workspaceId";

interface WorkspaceState {
  workspaces: Workspace[];
  currentId: string | null;
  loading: boolean;
  loadWorkspaces: () => Promise<void>;
  setCurrent: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentId: localStorage.getItem(WORKSPACE_KEY),
  loading: false,

  loadWorkspaces: async () => {
    set({ loading: true });
    try {
      const list = await getAllWorkspaces();
      // Default the active workspace to the first one if none is selected yet.
      let currentId = get().currentId;
      if (!currentId || !list.some((w) => w.id === currentId)) {
        currentId = list[0]?.id ?? null;
        if (currentId) localStorage.setItem(WORKSPACE_KEY, currentId);
      }
      set({ workspaces: list, currentId });
    } finally {
      set({ loading: false });
    }
  },

  setCurrent: (id) => {
    if (id === get().currentId) return;
    localStorage.setItem(WORKSPACE_KEY, id);
    set({ currentId: id });
    // All list pages fetch on mount / via ProTable requests, so a full reload is
    // the simplest way to guarantee every view re-fetches under the new workspace.
    window.location.reload();
  },
}));
