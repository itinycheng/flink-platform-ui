import { create } from "zustand";
import type { Workspace } from "@/types/workspace";
import { getAllWorkspaces } from "@/api/workspace";
import { STORAGE_KEYS } from "@/constants/storage";

interface WorkspaceState {
  workspaces: Workspace[];
  currentId: string | null;
  loading: boolean;
  loadWorkspaces: () => Promise<void>;
  setCurrent: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentId: localStorage.getItem(STORAGE_KEYS.workspaceId),
  loading: false,

  loadWorkspaces: async () => {
    set({ loading: true });
    try {
      const list = await getAllWorkspaces();
      // Default the active workspace to the first one if none is selected yet.
      let currentId = get().currentId;
      if (!currentId || !list.some((w) => w.id === currentId)) {
        currentId = list[0]?.id ?? null;
        if (currentId) localStorage.setItem(STORAGE_KEYS.workspaceId, currentId);
      }
      set({ workspaces: list, currentId });
    } finally {
      set({ loading: false });
    }
  },

  setCurrent: (id) => {
    if (id === get().currentId) return;
    localStorage.setItem(STORAGE_KEYS.workspaceId, id);
    set({ currentId: id });
    // All list pages fetch on mount / via ProTable requests, so a full reload is
    // the simplest way to guarantee every view re-fetches under the new workspace.
    window.location.reload();
  },
}));
