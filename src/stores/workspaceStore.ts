import { create } from "zustand";
import type { Workspace } from "@/types/workspace";
import { getAllWorkspaces } from "@/api/workspace";
import { STORAGE_KEYS } from "@/constants/storage";

interface WorkspaceState {
  workspaces: Workspace[];
  currentId: number | null;
  loading: boolean;
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

  loadWorkspaces: async () => {
    set({ loading: true });
    try {
      const list = await getAllWorkspaces();
      // Default the active workspace to the first one if none is selected yet.
      let currentId = get().currentId;
      if (currentId == null || !list.some((w) => w.id === currentId)) {
        currentId = list[0]?.id ?? null;
        if (currentId != null) localStorage.setItem(STORAGE_KEYS.workspaceId, String(currentId));
      }
      set({ workspaces: list, currentId });
    } finally {
      set({ loading: false });
    }
  },

  setCurrent: (id) => {
    if (id === get().currentId) return;
    localStorage.setItem(STORAGE_KEYS.workspaceId, String(id));
    set({ currentId: id });
    // All list pages fetch on mount / via ProTable requests, so a full reload is
    // the simplest way to guarantee every view re-fetches under the new workspace.
    window.location.reload();
  },
}));
