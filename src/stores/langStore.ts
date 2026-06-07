import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "@/i18n";

export type Lang = "en" | "zh";

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => {
        void i18n.changeLanguage(lang);
        set({ lang });
      },
    }),
    { name: "lang-storage" },
  ),
);
