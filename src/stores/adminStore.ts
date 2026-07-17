import { create } from "zustand";

export type AdminCategory = "resources" | "users" | "envConfig" | "customParams";

export interface AdminCategoryItem {
  key: AdminCategory;
  /** i18n key for the label */
  labelKey: string;
}

export const ADMIN_CATEGORIES: AdminCategoryItem[] = [
  { key: "resources", labelKey: "admin.resources" },
  { key: "users", labelKey: "admin.users" },
  { key: "envConfig", labelKey: "admin.envConfig" },
  { key: "customParams", labelKey: "admin.customParams" },
];

export interface AdminState {
  activeCategory: AdminCategory;
  setActiveCategory: (category: AdminCategory) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  activeCategory: "resources",
  setActiveCategory: (category) => set({ activeCategory: category }),
}));
