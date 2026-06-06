import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, zh } from "@/locales";

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: localStorage.getItem("app_language") || "zh",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
