import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import zh from "./locales/zh";

/** i18next is the single source of truth for the active language. */
export const LANG_KEY = "lang";
export type Lang = "en" | "zh";

function initialLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === "zh" || stored === "en" ? stored : "en";
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: initialLang(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  })
  .catch((err) => console.error("[i18n] init failed", err));

// Persist the language whenever it changes so it survives reloads.
i18n.on("languageChanged", (lng) => localStorage.setItem(LANG_KEY, lng));

export default i18n;
