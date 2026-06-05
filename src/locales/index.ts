import zhBase from "./zh.json";
import enBase from "./en.json";
import { mergeLocaleModules, type LocaleBranch } from "./modules";

// 集中 JSON 暂作基座，后续模块只通过 modules 聚合进来。
const locales = mergeLocaleModules({
  zh: zhBase as LocaleBranch,
  en: enBase as LocaleBranch,
});

export const zh = locales.zh;
export const en = locales.en;
