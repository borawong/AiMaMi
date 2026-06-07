import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const repoRoot = process.cwd();
const sourceRoot = join(repoRoot, "src");
const zh = JSON.parse(readFileSync(join(sourceRoot, "locales", "zh.json"), "utf8"));
const en = JSON.parse(readFileSync(join(sourceRoot, "locales", "en.json"), "utf8"));
const failures = [];

function flattenLocaleKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      return flattenLocaleKeys(child, nextPrefix);
    }
    return [nextPrefix];
  });
}

const sessionLocaleValueQualityKeys = [
  "sessions.childThread",
  "sessions.childThreadsInline",
  "sessions.conversationGroup",
  "sessions.delete",
  "sessions.deleteLagHint",
  "sessions.deleteSelectionTitle",
  "sessions.deleteSelectionDesc",
  "sessions.mainThread",
  "sessions.orphanCount",
  "sessions.orphanThread",
  "sessions.treeDescription",
  "sessions.treeTitle",
  "sessions.unknownProject",
];

function getLocaleValue(locale, key) {
  let current = locale;
  for (const part of key.split(".")) {
    if (
      !current ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function validateLocaleValueQuality(locale, localeName, keys) {
  for (const key of keys) {
    const value = getLocaleValue(locale, key);
    if (typeof value !== "string") {
      continue;
    }

    const valueWithoutInterpolations = value
      .replace(/\{\{[^}]*\}\}/g, "")
      .replace(/\s+/g, "");
    if (/^\?+$/.test(valueWithoutInterpolations) || value.includes("\uFFFD")) {
      failures.push(`${localeName} locale value looks corrupted: ${key}`);
    }
  }
}

function hasLocaleKey(locale, key) {
  let current = locale;
  for (const part of key.split(".")) {
    if (
      !current ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return false;
    }
    current = current[part];
  }
  return true;
}

function walkFiles(root) {
  const ignoredDirectories = new Set(["node_modules", "dist", "target"]);
  const pending = [root];
  const files = [];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          pending.push(next);
        }
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        files.push(next);
      }
    }
  }

  return files.sort();
}

function requireLocaleKeys(keys, context) {
  for (const key of keys) {
    if (!hasLocaleKey(zh, key) || !hasLocaleKey(en, key)) {
      failures.push(`${context} 缺少 zh/en locale key：${key}`);
    }
  }
}

function validateAccountTokenStatusKeys() {
  const required = [
    "accounts.tokenStatus.noRefreshToken",
    "accounts.tokenStatus.noRefreshTokenDesc",
    "accounts.tokenStatus.refreshReused",
    "accounts.tokenStatus.refreshReusedDesc",
    "accounts.tokenStatus.refreshFailed",
    "accounts.tokenStatus.refreshFailedDesc",
    "accounts.tokenStatus.expiresInDays",
    "accounts.tokenStatus.expiresInHours",
  ];

  requireLocaleKeys(required, "accounts tokenStatus 动态 key");
}

const zhKeys = flattenLocaleKeys(zh).sort();
const enKeys = flattenLocaleKeys(en).sort();
const missingEn = zhKeys.filter((key) => !enKeys.includes(key));
const missingZh = enKeys.filter((key) => !zhKeys.includes(key));

for (const key of missingEn) {
  failures.push(`en 缺少 locale key：${key}`);
}
for (const key of missingZh) {
  failures.push(`zh 缺少 locale key：${key}`);
}

validateLocaleValueQuality(zh, "zh", sessionLocaleValueQualityKeys);
validateLocaleValueQuality(en, "en", sessionLocaleValueQualityKeys);
validateAccountTokenStatusKeys();

for (const file of walkFiles(sourceRoot)) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
    const key = match[1];
    if (!hasLocaleKey(zh, key) || !hasLocaleKey(en, key)) {
      failures.push(`${relative(repoRoot, file).replaceAll("\\", "/")} 使用未同步 locale key：${key}`);
    }
  }
}

if (failures.length > 0) {
  console.error("i18n 静态验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`i18n 静态验证通过：zh/en 同步 ${zhKeys.length}/${enKeys.length}，源码静态 key 均已覆盖。`);
