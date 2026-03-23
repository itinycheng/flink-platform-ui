import { create } from "zustand";

export type ManageCategory = "resources" | "users" | "envConfig" | "customParams";

export interface ManageCategoryItem {
  key: ManageCategory;
  /** i18n key for the label */
  labelKey: string;
}

export const MANAGE_CATEGORIES: ManageCategoryItem[] = [
  { key: "resources", labelKey: "manage.resources" },
  { key: "users", labelKey: "manage.users" },
  { key: "envConfig", labelKey: "manage.envConfig" },
  { key: "customParams", labelKey: "manage.customParams" },
];

export interface ManageState {
  activeCategory: ManageCategory;
  setActiveCategory: (category: ManageCategory) => void;
}

export const useManageStore = create<ManageState>((set) => ({
  activeCategory: "resources",
  setActiveCategory: (category) => set({ activeCategory: category }),
}));
