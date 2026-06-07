import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const repoRoot = process.cwd();
const evidenceRoot = join(
  repoRoot,
  "evidence",
  "full-chain",
  "raw",
  "aimami",
  "1.0.9",
  "windows-x64",
  "frontend",
  "tauri-dumped",
  "frontend",
);

const evidenceFiles = {
  frontendFiles: join(evidenceRoot, "frontend-files.txt"),
  apiMap: join(evidenceRoot, "api-map.json"),
  queryHits: join(evidenceRoot, "query-hits.jsonl"),
  routerHits: join(evidenceRoot, "router-hits.jsonl"),
  controlFlow: join(evidenceRoot, "frontend-control-flow.jsonl"),
  contractReport: join(evidenceRoot, "frontend-contract-report.md"),
};

const pluginsGateFiles = {
  acceptanceMatrix: join(
    repoRoot,
    "evidence",
    "full-chain",
    "raw",
    "aimami",
    "1.0.9",
    "windows",
    "plugins_frontend_acceptance_mapping",
    "evidence",
    "acceptance-matrix.json",
  ),
  compositeGateMatrix: join(
    repoRoot,
    "evidence",
    "full-chain",
    "raw",
    "aimami",
    "1.0.9",
    "windows",
    "plugins_composite_gate_gap_matrix",
    "evidence",
    "composite-gate-matrix.json",
  ),
};

const targetModules = [
  { id: "accounts", chunk: /^assets\/accounts-page-[^/]+\.js$/ },
  { id: "sessions", chunk: /^assets\/sessions-page-[^/]+\.js$/ },
  { id: "analytics", chunk: /^assets\/analytics-panel-[^/]+\.js$/ },
  { id: "maintenance", chunk: /^assets\/maintenance-page-[^/]+\.js$/ },
  { id: "mcp", chunk: /^assets\/mcp-page-[^/]+\.js$/ },
  { id: "plugins", chunk: /^assets\/plugins-page-[^/]+\.js$/ },
  { id: "relay", chunk: /^assets\/relay-page-[^/]+\.js$/ },
  { id: "settings", chunk: /^assets\/settings-page-[^/]+\.js$/ },
  { id: "skills", chunk: /^assets\/skills-page-[^/]+\.js$/ },
];

const rawVisibleRoutes = [
  "overview",
  "accounts",
  "sessions",
  "mcp",
  "skills",
  "plugins",
  "relay",
  "maintenance",
  "settings",
];

const queryKeyAllowlist = {};

const forbiddenReferenceNames = [
  [108, 111, 98, 101, 104, 117, 98],
  [76, 111, 98, 101, 72, 117, 98],
  [108, 111, 98, 101, 104, 117, 98, 47, 108, 111, 98, 101, 104, 117, 98],
].map((codes) => String.fromCharCode(...codes));

const failures = [];
const notes = [];

function toRepoPath(path) {
  return relative(repoRoot, path).replaceAll(sep, "/");
}

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function readRequired(path) {
  if (!existsSync(path)) {
    failures.push(`缺少文件：${toRepoPath(path)}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function parseJsonFile(path) {
  const content = readRequired(path);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch (error) {
    failures.push(`${toRepoPath(path)} JSON 解析失败：${error.message}`);
    return null;
  }
}

function parseJsonlFile(path) {
  const content = readRequired(path);
  if (!content) return [];
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        failures.push(`${toRepoPath(path)} 第 ${index + 1} 行 JSONL 解析失败：${error.message}`);
        return null;
      }
    })
    .filter(Boolean);
}

function walkFiles(root, predicate) {
  const ignoredDirectories = new Set([".git", "node_modules", "dist", "target"]);
  const files = [];
  const pending = [root];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || !existsSync(current)) continue;

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) pending.push(next);
        continue;
      }
      if (!predicate || predicate(next)) files.push(next);
    }
  }

  return files.sort();
}

function unique(values) {
  return [...new Set(values)].sort();
}

function hasChineseText(value) {
  return /[\u4e00-\u9fff]/.test(value);
}

function assertNoDuplicates(name, values) {
  const seen = new Set();
  const duplicates = [];
  for (const value of values) {
    if (seen.has(value)) duplicates.push(value);
    seen.add(value);
  }
  if (duplicates.length > 0) {
    failures.push(`${name} 存在重复项：${unique(duplicates).join(", ")}`);
  }
}

function assertSameArray(name, expected, actual) {
  const missing = expected.filter((item) => !actual.includes(item));
  const extra = actual.filter((item) => !expected.includes(item));
  const orderMismatch =
    missing.length === 0 &&
    extra.length === 0 &&
    expected.some((item, index) => item !== actual[index]);

  if (missing.length === 0 && extra.length === 0 && !orderMismatch) {
    console.log(`PASS ${name}：${actual.length}/${expected.length}`);
    return;
  }

  failures.push(`${name} 不同步`);
  if (missing.length > 0) failures.push(`  缺失：${missing.join(", ")}`);
  if (extra.length > 0) failures.push(`  额外：${extra.join(", ")}`);
  if (orderMismatch) failures.push(`  顺序不一致：expected=${expected.join(", ")} actual=${actual.join(", ")}`);
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

function parseStringArrayConst(source, constName, fileLabel) {
  const match = source.match(
    new RegExp(`export\\s+const\\s+${constName}[^=]*=\\s*\\[([\\s\\S]*?)\\];`),
  );
  if (!match) {
    failures.push(`${fileLabel} 未找到 ${constName} 数组`);
    return [];
  }
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function pascalCase(moduleId) {
  return moduleId
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join("");
}

function assertEvidenceInputs(raw) {
  parseJsonFile(evidenceFiles.apiMap);
  raw.routerHits = parseJsonlFile(evidenceFiles.routerHits);
  const contractReport = readRequired(evidenceFiles.contractReport);

  if (raw.frontendFiles.length === 0) failures.push("frontend-files.txt 为空");
  if (raw.queryHits.length === 0) failures.push("query-hits.jsonl 为空");
  if (raw.routerHits.length === 0) failures.push("router-hits.jsonl 为空");
  if (raw.controlFlow.length === 0) failures.push("frontend-control-flow.jsonl 为空");
  if (!contractReport.trim()) failures.push("frontend-contract-report.md 为空");

  console.log("PASS raw evidence 输入可读取：frontend-files、api-map、query/router/control-flow、contract-report");
}

function collectQueryGateText() {
  const sourceFiles = [
    ...walkFiles(join(repoRoot, "src", "features"), (file) => {
      if (!/\.(ts|tsx)$/.test(file)) return false;
      const normalized = normalizePath(file);
      return normalized.includes("/cache/") || normalized.includes("/hooks/");
    }),
    ...walkFiles(join(repoRoot, "src", "routes"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(repoRoot, "src", "app", "runtime"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  return sourceFiles.map((file) => readRequired(file)).join("\n");
}

function extractRawQueryKeys(queryHits) {
  const keyToEvidence = new Map();
  for (const hit of queryHits) {
    const match = String(hit.match ?? "").match(/queryKey:\[\s*["']([^"']+)["']/);
    if (!match) {
      failures.push(`query-hits 无法抽取 queryKey 字面量：${JSON.stringify(hit.match)}`);
      continue;
    }
    const key = match[1];
    const current = keyToEvidence.get(key) ?? [];
    current.push(`${hit.file}:${hit.line}`);
    keyToEvidence.set(key, current);
  }
  return keyToEvidence;
}

function validateQueryKeys(queryHits) {
  const queryGateText = collectQueryGateText();
  const keyToEvidence = extractRawQueryKeys(queryHits);
  const rawKeys = [...keyToEvidence.keys()].sort();
  let covered = 0;
  let allowed = 0;

  for (const [key, reason] of Object.entries(queryKeyAllowlist)) {
    if (typeof reason !== "string" || !hasChineseText(reason)) {
      failures.push(`queryKey allowlist ${key} 必须带中文原因字符串`);
    }
    if (!keyToEvidence.has(key)) {
      failures.push(`queryKey allowlist ${key} 不再出现在 raw evidence 中`);
    }
  }

  for (const key of rawKeys) {
    const found =
      queryGateText.includes(`"${key}"`) ||
      queryGateText.includes(`'${key}'`) ||
      queryGateText.includes(`\`${key}\``);

    if (found) {
      if (Object.prototype.hasOwnProperty.call(queryKeyAllowlist, key)) {
        failures.push(`queryKey allowlist ${key} 已有源码覆盖，应移出 allowlist`);
      }
      covered += 1;
      continue;
    }

    const reason = queryKeyAllowlist[key];
    if (reason) {
      allowed += 1;
      notes.push(`ALLOW queryKey ${key}：${reason}`);
      continue;
    }

    failures.push(
      `raw queryKey 未在 src/features cache/hooks 或 route/runtime 中找到：${key} (${keyToEvidence
        .get(key)
        .join(", ")})`,
    );
  }

  const prefix = covered + allowed === rawKeys.length ? "PASS" : "FAIL";
  console.log(`${prefix} raw queryKey 覆盖：${covered}/${rawKeys.length}，allowlist ${allowed}`);
}

function validatePageChunks(frontendFiles) {
  const normalizedFiles = frontendFiles.map(normalizePath);
  let covered = 0;

  for (const moduleInfo of targetModules) {
    const moduleId = moduleInfo.id;
    const pascal = pascalCase(moduleId);
    const chunk = normalizedFiles.find((file) => moduleInfo.chunk.test(file));
    if (!chunk) {
      failures.push(`frontend-files.txt 缺少 ${moduleId} 主 page chunk`);
      continue;
    }

    const routeShellPath = join(
      repoRoot,
      "src",
      "routes",
      "desktop",
      "main",
      moduleId,
      "page.tsx",
    );
    const featureIndexPath = join(repoRoot, "src", "features", moduleId, "index.ts");
    const featureContentPath = join(repoRoot, "src", "features", moduleId, "Content.tsx");
    const featurePagePath = join(
      repoRoot,
      "src",
      "features",
      moduleId,
      "components",
      "page.tsx",
    );

    const routeShell = readRequired(routeShellPath);
    const featureIndex = readRequired(featureIndexPath);
    const featureContent = readRequired(featureContentPath);
    const featurePage = readRequired(featurePagePath);

    const routeOk =
      routeShell.includes(`@/features/${moduleId}`) &&
      routeShell.includes(`export function ${pascal}Route`) &&
      routeShell.includes(`<${pascal}Feature`);
    const featureOk =
      featureIndex.includes(`export function ${pascal}Feature`) &&
      featureIndex.includes(`${pascal}Provider`) &&
      featureIndex.includes(`${pascal}Content`) &&
      featureContent.includes(`${pascal}Page`) &&
      featurePage.includes(`export function ${pascal}Page`);

    if (routeOk && featureOk) {
      covered += 1;
      continue;
    }

    if (!routeOk) failures.push(`${moduleId} page chunk 已存在，但 route shell 未正确挂载 ${pascal}Feature`);
    if (!featureOk) failures.push(`${moduleId} page chunk 已存在，但 feature component 未正确挂载 ${pascal}Page`);
  }

  const prefix = covered === targetModules.length ? "PASS" : "FAIL";
  console.log(`${prefix} page chunk 到 route/feature 覆盖：${covered}/${targetModules.length}`);
}

function validateRoutesAndLocales(controlFlowRows) {
  const navigationPath = join(repoRoot, "src", "types", "navigation.ts");
  const routeRegistryPath = join(repoRoot, "src", "routes", "registry", "registry.tsx");
  const zhPath = join(repoRoot, "src", "locales", "zh.json");
  const enPath = join(repoRoot, "src", "locales", "en.json");

  const navigationSource = readRequired(navigationPath);
  const registrySource = readRequired(routeRegistryPath);
  const zh = parseJsonFile(zhPath) ?? {};
  const en = parseJsonFile(enPath) ?? {};

  const allAppRoutes = parseStringArrayConst(navigationSource, "ALL_APP_ROUTES", "src/types/navigation.ts");
  assertNoDuplicates("ALL_APP_ROUTES", allAppRoutes);

  const routeEntries = [
    ...registrySource.matchAll(/route:\s*"([^"]+)"[\s\S]*?visible:\s*(true|false)/g),
  ].map((match) => ({
    route: match[1],
    visible: match[2] === "true",
  }));
  const registryRoutes = routeEntries.map((entry) => entry.route);
  const visibleRoutes = routeEntries.filter((entry) => entry.visible).map((entry) => entry.route);

  assertNoDuplicates("routeDefinitions.route", registryRoutes);
  assertSameArray("route registry visible routes 与 raw live routes", rawVisibleRoutes, visibleRoutes);
  assertSameArray("route registry routeDefinitions 与 ALL_APP_ROUTES", allAppRoutes, registryRoutes);

  const routeTitleKeys = unique(
    [...registrySource.matchAll(/titleKey:\s*"([^"]+)"/g)].map((match) => match[1]),
  );
  const rawLocaleKeys = unique(
    controlFlowRows.flatMap((row) =>
      Array.isArray(row.trigger?.i18n_keys) ? row.trigger.i18n_keys : [],
    ),
  );
  const localeKeys = unique([...routeTitleKeys, ...rawLocaleKeys]);

  let missingLocaleKeys = 0;
  for (const key of localeKeys) {
    const missing = [];
    if (!hasLocaleKey(zh, key)) missing.push("zh");
    if (!hasLocaleKey(en, key)) missing.push("en");
    if (missing.length > 0) {
      missingLocaleKeys += 1;
      failures.push(`locale 静态 key 未同步 ${missing.join("/")}：${key}`);
    }
  }

  const localePrefix = missingLocaleKeys === 0 ? "PASS" : "FAIL";
  console.log(
    `${localePrefix} route title/raw control-flow locale key：route ${routeTitleKeys.length}，raw ${rawLocaleKeys.length}，missing ${missingLocaleKeys}`,
  );
}

function validateKnownInternalFrontendGates() {
  const accountsHooksPath = join(repoRoot, "src", "features", "accounts", "hooks", "index.ts");
  const accountsCachePath = join(repoRoot, "src", "features", "accounts", "cache", "index.ts");
  const accountsTypesPath = join(repoRoot, "src", "features", "accounts", "types", "index.ts");
  const accountsServicePath = join(repoRoot, "src", "services", "accounts", "index.ts");
  const sessionsHooksPath = join(repoRoot, "src", "features", "sessions", "hooks", "index.ts");
  const sessionsCachePath = join(repoRoot, "src", "features", "sessions", "cache", "index.ts");
  const sessionsTypesPath = join(repoRoot, "src", "features", "sessions", "types", "index.ts");
  const sessionsServicePath = join(repoRoot, "src", "services", "sessions", "index.ts");
  const analyticsHooksIndexPath = join(repoRoot, "src", "features", "analytics", "hooks", "index.ts");
  const analyticsQueryPath = join(repoRoot, "src", "features", "analytics", "hooks", "query.ts");
  const analyticsPageHookPath = join(repoRoot, "src", "features", "analytics", "hooks", "page.ts");
  const analyticsCachePath = join(repoRoot, "src", "features", "analytics", "cache", "index.ts");
  const analyticsTypesPath = join(repoRoot, "src", "features", "analytics", "types", "index.ts");
  const analyticsServicePath = join(repoRoot, "src", "services", "analytics", "index.ts");
  const relayHooksIndexPath = join(repoRoot, "src", "features", "relay", "hooks", "index.ts");
  const relayQueryPath = join(repoRoot, "src", "features", "relay", "hooks", "query.ts");
  const relayMutationPath = join(repoRoot, "src", "features", "relay", "hooks", "mutation.ts");
  const relayRuntimePath = join(repoRoot, "src", "features", "relay", "hooks", "runtime.ts");
  const relayPageHookPath = join(repoRoot, "src", "features", "relay", "hooks", "page.ts");
  const relayCachePath = join(repoRoot, "src", "features", "relay", "cache", "index.ts");
  const relayTypesPath = join(repoRoot, "src", "features", "relay", "types", "index.ts");
  const relayPagePath = join(repoRoot, "src", "features", "relay", "components", "page.tsx");
  const relayPanelsPath = join(repoRoot, "src", "features", "relay", "panels", "panels.tsx");
  const relayDialogsPath = join(repoRoot, "src", "features", "relay", "dialogs", "dialogs.tsx");
  const relayServicePath = join(repoRoot, "src", "services", "relay", "index.ts");
  const skillsServicePath = join(repoRoot, "src", "services", "skills", "index.ts");
  const customInstructionsPagePath = join(
    repoRoot,
    "src",
    "features",
    "custom-instructions",
    "components",
    "page.tsx",
  );
  const customInstructionsHooksPath = join(
    repoRoot,
    "src",
    "features",
    "custom-instructions",
    "hooks",
    "index.ts",
  );
  const customInstructionsLoadErrorPanelPath = join(
    repoRoot,
    "src",
    "features",
    "custom-instructions",
    "panels",
    "error.tsx",
  );
  const skillsPagePath = join(repoRoot, "src", "features", "skills", "components", "page.tsx");
  const skillsContentPath = join(repoRoot, "src", "features", "skills", "Content.tsx");
  const skillsHooksPath = join(repoRoot, "src", "features", "skills", "hooks", "index.ts");
  const skillsQueryPath = join(repoRoot, "src", "features", "skills", "hooks", "query.ts");
  const skillsMutationPath = join(repoRoot, "src", "features", "skills", "hooks", "mutation.ts");
  const skillsPageHookPath = join(repoRoot, "src", "features", "skills", "hooks", "page.ts");
  const skillsCachePath = join(repoRoot, "src", "features", "skills", "cache", "index.ts");
  const skillsTypesPath = join(repoRoot, "src", "features", "skills", "types", "index.ts");
  const skillsPanelPath = join(repoRoot, "src", "features", "skills", "panels", "page.tsx");

  const accountsHooks = readRequired(accountsHooksPath);
  const accountsCache = readRequired(accountsCachePath);
  const accountsTypes = readRequired(accountsTypesPath);
  const accountsService = readRequired(accountsServicePath);
  const sessionsHooks = readRequired(sessionsHooksPath);
  const sessionsCache = readRequired(sessionsCachePath);
  const sessionsTypes = readRequired(sessionsTypesPath);
  const sessionsService = readRequired(sessionsServicePath);
  const analyticsHooksIndex = readRequired(analyticsHooksIndexPath);
  const analyticsQuery = readRequired(analyticsQueryPath);
  const analyticsPageHook = readRequired(analyticsPageHookPath);
  const analyticsCache = readRequired(analyticsCachePath);
  const analyticsTypes = readRequired(analyticsTypesPath);
  const analyticsService = readRequired(analyticsServicePath);
  const relayHooksIndex = readRequired(relayHooksIndexPath);
  const relayQuery = readRequired(relayQueryPath);
  const relayMutation = readRequired(relayMutationPath);
  const relayRuntime = readRequired(relayRuntimePath);
  const relayPageHook = readRequired(relayPageHookPath);
  const relayCache = readRequired(relayCachePath);
  const relayTypes = readRequired(relayTypesPath);
  const relayPage = readRequired(relayPagePath);
  const relayPanels = readRequired(relayPanelsPath);
  const relayDialogs = readRequired(relayDialogsPath);
  const relayService = readRequired(relayServicePath);
  const customInstructionsPage = readRequired(customInstructionsPagePath);
  const customInstructionsHooks = readRequired(customInstructionsHooksPath);
  const customInstructionsLoadErrorPanel = readRequired(customInstructionsLoadErrorPanelPath);
  const skillsService = readRequired(skillsServicePath);
  const skillsPage = readRequired(skillsPagePath);
  const skillsContent = readRequired(skillsContentPath);
  const skillsHooks = readRequired(skillsHooksPath);
  const skillsQuery = readRequired(skillsQueryPath);
  const skillsMutation = readRequired(skillsMutationPath);
  const skillsPageHook = readRequired(skillsPageHookPath);
  const skillsCache = readRequired(skillsCachePath);
  const skillsTypes = readRequired(skillsTypesPath);
  const skillsPanel = readRequired(skillsPanelPath);

  const accountsTypedPayloadOk =
    accountsService.includes("CoreEnvelope<AccountMonitorPayload>") &&
    accountsService.includes("CoreEnvelope<SwitchPayload>") &&
    accountsService.includes("CoreEnvelope<RemovePayload>") &&
    accountsService.includes("CoreEnvelope<LogoutPayload>") &&
    accountsService.includes("CoreEnvelope<AccountImportPayload>") &&
    accountsService.includes("CoreEnvelope<AccountSessionImportPayload>") &&
    accountsService.includes("CoreEnvelope<AccountExportPayload>") &&
    accountsService.includes("CoreEnvelope<AccountImportPreviewPayload>") &&
    !accountsService.includes("IpcEvidencePayload") &&
    accountsTypes.includes("export type AccountsMutationPayload") &&
    accountsTypes.includes("export type AccountsMutationEnvelope") &&
    accountsTypes.includes("export type AccountsSnapshotEnvelope") &&
    accountsTypes.includes("export type AccountsCachePayload") &&
    accountsHooks.includes("AccountsMutationEnvelope") &&
    accountsHooks.includes("AccountsSnapshotEnvelope") &&
    !accountsHooks.includes("writeMutationPayload = (\n    payload: unknown") &&
    !accountsHooks.includes("writeSnapshotPayload = (\n    payload: unknown") &&
    !accountsCache.includes("ModuleCacheEnvelope<unknown>");
  if (!accountsTypedPayloadOk) {
    failures.push("accounts IPC payload owner 未收口到 typed envelope、模块 types 和 cache helper");
  } else {
    console.log("PASS accounts typed IPC payload owner：service/hook/cache");
  }

  const sessionsTypedPayloadOk =
    sessionsService.includes("CoreEnvelope<SessionsListPayload>") &&
    sessionsService.includes("CoreEnvelope<SessionsDeletePayload>") &&
    sessionsService.includes("CoreEnvelope<SessionAnalyticsPayload>") &&
    analyticsService.includes("CoreEnvelope<SessionAnalyticsPayload>") &&
    !sessionsService.includes("IpcEvidencePayload") &&
    !analyticsService.includes("CoreEnvelope<IpcEvidencePayload>>(\"load_session_analytics\"") &&
    sessionsTypes.includes("export type SessionsListEnvelope") &&
    sessionsTypes.includes("export type SessionsDeleteEnvelope") &&
    sessionsTypes.includes("export type SessionsMutationPayload") &&
    sessionsTypes.includes("export type SessionsCachePayload") &&
    sessionsHooks.includes("SessionsCacheEnvelope") &&
    sessionsHooks.includes("SessionsDeleteEnvelope") &&
    sessionsHooks.includes("selectDeletedSessionIds") &&
    sessionsCache.includes("SessionsCachePayload") &&
    !sessionsCache.includes("ModuleCacheEnvelope<unknown>");
  if (!sessionsTypedPayloadOk) {
    failures.push("sessions IPC payload owner 未收口到 typed envelope、模块 types 和 cache helper");
  } else {
    console.log("PASS sessions typed IPC payload owner：service/hook/cache");
  }

  const analyticsHooksIndexReExportPattern =
    /export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']([^"']+)["'];?/g;
  const analyticsHooksIndexReExports = [...analyticsHooksIndex.matchAll(analyticsHooksIndexReExportPattern)].map(
    (match) => match[1],
  );
  const analyticsHooksIndexOnlyReExports =
    analyticsHooksIndex
      .replace(analyticsHooksIndexReExportPattern, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .trim() === "" &&
    ["query", "page"].every(
      (owner) =>
        analyticsHooksIndex.includes(`from "./${owner}"`) ||
        analyticsHooksIndex.includes(`from './${owner}'`),
    ) &&
    analyticsHooksIndexReExports.every((reExport) =>
      new Set(["./query", "./page"]).has(reExport),
    );
  const analyticsTypedPayloadOk =
    analyticsService.includes("CoreEnvelope<UsageAnalyticsPayload>") &&
    analyticsService.includes("CoreEnvelope<QuotaHistoryPayload>") &&
    analyticsService.includes("CoreEnvelope<SessionAnalyticsPayload>") &&
    analyticsService.includes("CoreEnvelope<TokenAnalyticsPayload>") &&
    analyticsService.includes("CoreEnvelope<ToolAnalyticsPayload>") &&
    analyticsService.includes("CoreEnvelope<ChangeAnalyticsPayload>") &&
    !analyticsService.includes("IpcEvidencePayload") &&
    analyticsTypes.includes("export type AnalyticsUsageEnvelope") &&
    analyticsTypes.includes("export type AnalyticsSessionEnvelope") &&
    analyticsTypes.includes("export type AnalyticsTokenEnvelope") &&
    analyticsTypes.includes("export type AnalyticsToolEnvelope") &&
    analyticsTypes.includes("export type AnalyticsChangeEnvelope") &&
    analyticsTypes.includes("export type AnalyticsQuotaEnvelope") &&
    analyticsTypes.includes("export type AnalyticsCachePayload") &&
    analyticsHooksIndexOnlyReExports &&
    analyticsQuery.includes("AnalyticsCacheEnvelope<AnalyticsUsageEnvelope>") &&
    analyticsQuery.includes("AnalyticsCacheEnvelope<AnalyticsSessionEnvelope>") &&
    analyticsQuery.includes("AnalyticsCacheEnvelope<AnalyticsTokenEnvelope>") &&
    analyticsQuery.includes("AnalyticsCacheEnvelope<AnalyticsToolEnvelope>") &&
    analyticsQuery.includes("AnalyticsCacheEnvelope<AnalyticsChangeEnvelope>") &&
    analyticsQuery.includes("AnalyticsCacheEnvelope<AnalyticsQuotaEnvelope>") &&
    analyticsQuery.includes("useAnalyticsModule") &&
    analyticsQuery.includes("writeAnalyticsPanelPayload") &&
    analyticsPageHook.includes("useAnalyticsPageController") &&
    analyticsPageHook.includes("AnalyticsPageController") &&
    analyticsPageHook.includes("PANELS") &&
    analyticsPageHook.includes("ANALYTICS_RANGES") &&
    analyticsPageHook.includes("ACTIVITY_RANGES") &&
    analyticsPageHook.includes("buildActivityPanel") &&
    analyticsPageHook.includes("buildSessionsPanel") &&
    analyticsPageHook.includes("buildTokenPanel") &&
    analyticsPageHook.includes("buildToolsPanel") &&
    analyticsPageHook.includes("buildChangesPanel") &&
    analyticsPageHook.includes("buildQuotaPanel") &&
    !analyticsPageHook.match(/\buse(Query|Mutation|QueryClient)\b/) &&
    !analyticsPageHook.match(/@\/services\/analytics|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|analyticsService\.|invokeIpc|invoke\(/) &&
    analyticsCache.includes("AnalyticsCachePayload") &&
    !analyticsCache.includes("ModuleCacheEnvelope<unknown>") &&
    !analyticsQuery.includes("payload: unknown") &&
    !analyticsPageHook.includes("payload: unknown");
  if (!analyticsTypedPayloadOk) {
    failures.push("analytics IPC payload owner 必须收口到 split query/page owner、typed envelope、模块 types 和 cache helper");
  } else {
    console.log("PASS analytics typed IPC payload owner：service/query/page/cache");
  }

  const relayEventOk =
    relayService.includes("codex-router-toggle-progress") &&
    relayService.includes("listen<unknown>") &&
    relayService.includes("unlisten?.()") &&
    relayRuntime.includes("useRelayRuntimeEvents") &&
    relayRuntime.includes("subscribeRouterToggleProgress") &&
    relayRuntime.includes("return relayService.subscribeRouterToggleProgress") &&
    relayRuntime.includes("parseRelayRouterToggleProgress") &&
    relayRuntime.includes("writeRelayRouterToggleProgress") &&
    relayCache.includes("RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY") &&
    relayCache.includes("writeRelayRouterToggleProgress") &&
    relayPageHook.includes("useRelayRuntimeEvents") &&
    relayPage.includes("RelayPagePanels") &&
    relayPanels.includes("RelayRouterProgress") &&
    relayPanels.includes("module.routerToggleProgress");
  if (!relayEventOk) {
    failures.push("relay router toggle progress 事件链未覆盖 listen、cleanup、cache key 和页面反馈");
  } else {
    console.log("PASS relay router toggle progress 事件链：listen/cleanup/cache/page");
  }

  const relayTypedPayloadOk =
    relayService.includes("interface RelayProviderDraftInput") &&
    relayService.includes("RelayExtraHeaders") &&
    relayService.includes("toRelayProviderDraftArgs(input)") &&
    relayService.includes("toRelayExtraHeadersArg(input.extraHeaders)") &&
    relayService.includes('RelayNetworkConfig = "system" | "direct"') &&
    relayService.includes("CoreEnvelope<RelayStatePayload>") &&
    relayService.includes("CoreEnvelope<RelayProviderPayload>") &&
    relayService.includes("CoreEnvelope<RelayTestPayload>") &&
    relayService.includes("CoreEnvelope<string[]>") &&
    relayService.includes("CoreEnvelope<RelayActivePayload>") &&
    relayService.includes("CoreEnvelope<RelayProxyPayload>") &&
    relayService.includes("CoreEnvelope<RelayRouterTogglePayload>") &&
    relayService.includes("CoreEnvelope<boolean>") &&
    relayService.includes("CoreEnvelope<RelayExportPayload>") &&
    relayService.includes("CoreEnvelope<RelayImportPayload>") &&
    relayService.includes("CoreEnvelope<RelayPassthroughAuditEntry[]>") &&
    relayService.includes("CoreEnvelope<RelayDiagnosticPayload>") &&
    relayService.includes("CoreEnvelope<RelayRouterIssueFixPayload>") &&
    relayService.includes("systemService.restartCodex()") &&
    !relayService.includes("IpcEvidencePayload") &&
    !relayService.includes("IpcJsonObject") &&
    !relayService.includes("extends IpcJsonObject") &&
    !relayService.includes('"restart_codex"') &&
    relayTypes.includes("export type RelayQueryDataPayload") &&
    relayTypes.includes("export type RelayMutationDataPayload") &&
    relayTypes.includes("export type RelayCachePayload") &&
    relayTypes.includes("export type RelayCacheDataPayload") &&
    relayTypes.includes("export type RelayKnownQueryPayload") &&
    relayTypes.includes("RelayPassthroughAuditEntry[]") &&
    relayTypes.includes("| boolean") &&
    relayTypes.includes("| RelayRouterIssueFixPayload") &&
    relayTypes.includes("CoreEnvelope<RelayCacheDataPayload>") &&
    !relayTypes.includes("RelayCacheEnvelope<TPayload = unknown>") &&
    !relayTypes.includes("ModuleCacheEnvelope<unknown>") &&
    relayCache.includes("createModuleCacheOwner<RelayCachePayload>(\"relay\")") &&
    relayCache.includes("Omit<RelayCacheEnvelope<TPayload>, \"moduleId\">") &&
    !relayCache.includes("createModuleCacheOwner(\"relay\")") &&
    !relayCache.includes("ModuleCacheEnvelope<unknown>") &&
    relayHooksIndex.includes("from \"./query\"") &&
    relayHooksIndex.includes("from \"./mutation\"") &&
    relayHooksIndex.includes("from \"./runtime\"") &&
    relayHooksIndex.includes("from \"./page\"") &&
    !/\b(useQuery|useMutation|useQueryClient|setQueryData|invalidateQueries|cancelQueries)\b/.test(relayHooksIndex) &&
    relayQuery.includes("TPayload extends RelayCachePayload") &&
    relayQuery.includes("relayActiveStateQueryKey") &&
    relayQuery.includes("runRelayQuery") &&
    relayQuery.includes("relayService.loadState") &&
    relayQuery.includes("relayService.getActive") &&
    relayQuery.includes("relayService.getProxyStatus") &&
    relayQuery.includes("relayService.getPassthroughAuditLog") &&
    relayQuery.includes("full-refresh") &&
    !relayQuery.includes("useMutation") &&
    !relayQuery.includes("payload: unknown") &&
    relayMutation.includes("CoreEnvelope<TPayload>") &&
    relayMutation.includes("TPayload extends RelayMutationDataPayload") &&
    relayMutation.includes("writeRelayMutationPayload") &&
    relayMutation.includes("queryClient") &&
    relayMutation.includes("invalidateRelayContractQueries(queryClient)") &&
    relayMutation.includes("cancelQueries") &&
    relayMutation.includes("useRelayVoidMutation") &&
    !relayMutation.includes("useQuery(") &&
    !relayMutation.includes("useMutation<unknown") &&
    !relayMutation.includes("Promise<unknown>") &&
    !relayMutation.includes("payload: unknown") &&
    relayRuntime.includes("relayService.subscribeRouterToggleProgress") &&
    relayRuntime.includes("writeRelayRouterToggleProgress(queryClient") &&
    relayRuntime.includes("parseRelayRouterToggleProgress") &&
    !relayRuntime.includes("setQueryData(") &&
    relayPageHook.includes("useRelayPageController") &&
    relayPageHook.includes("useRelayPageQueries") &&
    relayPageHook.includes("useRelayPageMutations") &&
    relayPageHook.includes("useRelayRuntimeEvents") &&
    relayPageHook.includes("formatExtraHeaders(extraHeaders: RelayExtraHeaders | undefined)") &&
    !relayPageHook.includes("formatExtraHeaders(provider: unknown)") &&
    !/\b(useQuery|useMutation|useQueryClient|setQueryData|invalidateQueries|cancelQueries|relayService\.|invokeIpc|invoke\()\b/.test(relayPageHook) &&
    relayCache.includes("writeRelayQueryPayload") &&
    relayCache.includes("writeRelayMutationPayload") &&
    relayCache.includes("writeQueryPayload<TPayload extends RelayKnownQueryPayload>") &&
    relayCache.includes("setQueryData<CoreEnvelope<TPayload>>") &&
    relayCache.includes("writeRelayStateQueryPayload") &&
    relayCache.includes("writeRelayRouterToggleQueryPayload") &&
    relayCache.includes("setQueryData<CoreEnvelope<RelayStatePayload>>") &&
    relayCache.includes("nextRelayCacheSequence") &&
    (relayCache.includes("acceptRelayCacheSequence") ||
      relayCache.includes("relayLatestAcceptedSequence") ||
      relayCache.includes("sequence <")) &&
    !relayCache.includes("setQueryData<unknown>") &&
    !relayCache.includes("sourcePayload: unknown") &&
    !relayCache.includes("data: unknown") &&
    relayPage.includes("useRelayPageController") &&
    !relayPanels.includes("ReturnType<typeof useRelayPageController>") &&
    !relayDialogs.includes("ReturnType<typeof useRelayPageController>") &&
    !/import\s+type\s+\{[\s\S]*RelayPageController[\s\S]*\}\s+from\s+["']\.\.\/hooks["']/.test(`${relayPanels}\n${relayDialogs}`);
  if (!relayTypedPayloadOk) {
    failures.push("relay IPC payload owner 未收口到 typed envelope、独立 active query key 和 system restart facade");
  } else {
    console.log("PASS relay typed IPC payload owner：service/hook/cache");
  }

  const customInstructionsErrorOk =
    customInstructionsHooks.includes("stateQuery.isError") &&
    customInstructionsHooks.includes("templatesQuery.isError") &&
    customInstructionsHooks.includes("loadErrorPanel") &&
    customInstructionsPage.includes("CustomInstructionsLoadErrorPanel") &&
    customInstructionsLoadErrorPanel.includes('role="alert"') &&
    customInstructionsLoadErrorPanel.includes("customInstructions.loadFailed");
  if (!customInstructionsErrorOk) {
    failures.push("custom-instructions initial query failure 缺少可见 alert");
  } else {
    console.log("PASS custom-instructions initial query failure 可见 alert");
  }

  const skillsErrorOk =
    skillsPageHook.includes("activeQuery.isError") &&
    skillsPageHook.includes("queryFailureAlert") &&
    skillsPageHook.includes("activeQuery.refetch()") &&
    skillsPageHook.includes("skills.loadFailed") &&
    skillsPageHook.includes("skills.loadFailedDesc") &&
    skillsPage.includes("SkillsProvider") &&
    skillsPage.includes("SkillsContent") &&
    skillsContent.includes("SkillsPagePanel") &&
    skillsContent.includes("SkillsConfirmDialogs") &&
    skillsPanel.includes('role="alert"');
  if (!skillsErrorOk) {
    failures.push("skills installed/backups query failure 缺少可见 alert");
  } else {
    console.log("PASS skills query failure 可见 alert");
  }

  const skillsImportCancelOk =
    skillsMutation.includes("skillsService.pickSkillDirectory()") &&
    skillsMutation.includes("return null;") &&
    skillsMutation.includes("if (payload) return writeSkillsMutationPayload(queryClient, payload)");
  if (!skillsImportCancelOk) {
    failures.push("skills import 取消必须保持静默 no-op，不得进入 mutation error");
  } else {
    console.log("PASS skills import 取消语义：silent no-op");
  }
  const skillsHooksIndexBarrelOk =
    (skillsHooks.includes('from "./query"') || skillsHooks.includes("from './query'")) &&
    (skillsHooks.includes('from "./mutation"') || skillsHooks.includes("from './mutation'")) &&
    (skillsHooks.includes('from "./page"') || skillsHooks.includes("from './page'")) &&
    !/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/.test(skillsHooks) &&
    !/\b(setQueryData|invalidateQueries|cancelQueries|nextSkillsCacheSequence|writeSkills)\b/.test(skillsHooks) &&
    !skillsHooks.includes("skillsService.");
  const skillsSplitOwnerOk =
    skillsQuery.includes("useQuery") &&
    skillsQuery.includes("useQueryClient") &&
    skillsQuery.includes("skillsService.loadInstalled") &&
    skillsQuery.includes("skillsService.loadBackups") &&
    skillsQuery.includes("writeSkillsCachePayload") &&
    skillsMutation.includes("useMutation") &&
    skillsMutation.includes("useQueryClient") &&
    skillsMutation.includes("skillsService.importSkill") &&
    skillsMutation.includes("skillsService.removeSkill") &&
    skillsMutation.includes("skillsService.restoreBackup") &&
    skillsMutation.includes("skillsService.deleteBackup") &&
    skillsMutation.includes("writeSkillsMutationPayload") &&
    skillsPageHook.includes("useSkillsPageController") &&
    skillsPageHook.includes("SkillsPageController") &&
    skillsPageHook.includes("useSkillsPageQueries") &&
    skillsPageHook.includes("useSkillsPageMutations") &&
    !/\buse(Query|Mutation|QueryClient)\b/.test(skillsPageHook) &&
    !/@\/services\/skills|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|skillsService\.|invokeIpc|invoke\(/.test(skillsPageHook);
  const skillsTypedPayloadOk =
    skillsService.includes("CoreEnvelope<SkillListPayload>") &&
    skillsService.includes("CoreEnvelope<SkillBackupListPayload>") &&
    skillsService.includes("CoreEnvelope<SkillImportPayload>") &&
    skillsService.includes("CoreEnvelope<SkillRemovePayload>") &&
    skillsService.includes("CoreEnvelope<SkillRestorePayload>") &&
    skillsService.includes("CoreEnvelope<SkillDeleteBackupPayload>") &&
    skillsTypes.includes("export type SkillsInstalledEnvelope") &&
    skillsTypes.includes("export type SkillsBackupsEnvelope") &&
    skillsTypes.includes("export type SkillsMutationPayload") &&
    skillsTypes.includes("export type SkillsMutationEnvelope") &&
    skillsTypes.includes("export type SkillsCachePayload") &&
    skillsTypes.includes("export interface SkillsPageController") &&
    skillsCache.includes("createModuleCacheOwner<SkillsCachePayload>(\"skills\")") &&
    skillsCache.includes("Omit<SkillsCacheEnvelope, \"moduleId\">") &&
    skillsCache.includes("writeSkillsAuthoritativePayload") &&
    skillsCache.includes("writeSkillsCachePayload") &&
    skillsCache.includes("writeSkillsMutationPayload") &&
    skillsCache.includes("setQueryData<CoreEnvelope<SkillListPayload>>") &&
    skillsCache.includes("setQueryData<CoreEnvelope<SkillBackupListPayload>>") &&
    skillsQuery.includes("SKILLS_INSTALLED_QUERY_KEY") &&
    skillsQuery.includes("SKILLS_BACKUPS_QUERY_KEY") &&
    skillsHooksIndexBarrelOk &&
    skillsSplitOwnerOk &&
    !skillsTypes.includes("SkillsCacheEnvelope<TPayload = unknown>") &&
    !skillsTypes.includes("ModuleCacheEnvelope<unknown>") &&
    !skillsCache.includes("createModuleCacheOwner(\"skills\")") &&
    !skillsCache.includes("ModuleCacheEnvelope<unknown>") &&
    !skillsCache.includes("payload: unknown") &&
    !skillsQuery.includes("ModuleCacheEnvelope<unknown>") &&
    !skillsQuery.includes("payload: unknown") &&
    !skillsMutation.includes("ModuleCacheEnvelope<unknown>") &&
    !skillsMutation.includes("payload: unknown");
  if (!skillsTypedPayloadOk) {
    failures.push("skills IPC payload owner 必须收口到 typed envelope、模块 types 和 cache helper");
  } else {
    console.log("PASS skills typed IPC payload owner：service/hook/cache");
  }
}

function validateMcpTypedPayloadGate() {
  const servicePath = join(repoRoot, "src", "services", "mcp", "index.ts");
  const hooksPath = join(repoRoot, "src", "features", "mcp", "hooks", "index.ts");
  const queryPath = join(repoRoot, "src", "features", "mcp", "hooks", "query.ts");
  const mutationPath = join(repoRoot, "src", "features", "mcp", "hooks", "mutation.ts");
  const pagePath = join(repoRoot, "src", "features", "mcp", "hooks", "page.ts");
  const cachePath = join(repoRoot, "src", "features", "mcp", "cache", "index.ts");
  const sequencePath = join(repoRoot, "src", "features", "mcp", "cache", "sequence.ts");
  const typesPath = join(repoRoot, "src", "features", "mcp", "types", "index.ts");
  const service = readRequired(servicePath);
  const hooksIndex = readRequired(hooksPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const cacheSequence = existsSync(sequencePath) ? readRequired(sequencePath) : "";
  const types = readRequired(typesPath);
  const cacheOwnerText = `${cache}\n${cacheSequence}`;

  const hooksIndexBarrelOk =
    (hooksIndex.includes('from "./query"') || hooksIndex.includes("from './query'")) &&
    (hooksIndex.includes('from "./mutation"') || hooksIndex.includes("from './mutation'")) &&
    (hooksIndex.includes('from "./page"') || hooksIndex.includes("from './page'")) &&
    !/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/.test(hooksIndex) &&
    !/\b(setQueryData|invalidateQueries|cancelQueries)\b/.test(hooksIndex) &&
    !hooksIndex.includes("writeMcpAuthoritativePayload") &&
    !hooksIndex.includes("writeMcpCachePayload") &&
    !hooksIndex.includes("writeMcpMutationPayload") &&
    !hooksIndex.includes("mcpService.");

  const splitOwnerOk =
    query.includes("useQuery") &&
    query.includes("MCP_SERVERS_QUERY_KEY") &&
    query.includes("mcpService.loadServers") &&
    query.includes("writeMcpCachePayload") &&
    mutation.includes("useMutation") &&
    mutation.includes("mcpService.setServerEnabled") &&
    mutation.includes("mcpService.removeServer") &&
    mutation.includes("mcpService.upsertServer") &&
    mutation.includes("writeMcpMutationPayload") &&
    page.includes("useMcpPageController") &&
    page.includes("useMcpServers") &&
    page.includes("useMcpServerMutations") &&
    page.includes("useUpsertMcpServerMutation");

  const cacheOwnerOk =
    cache.includes("createModuleCacheOwner<McpCachePayload>(\"mcp\")") &&
    cache.includes("MCP_SERVERS_QUERY_KEY") &&
    cache.includes("writeMcpAuthoritativePayload") &&
    cache.includes("writeMcpCachePayload") &&
    cache.includes("writeMcpMutationPayload") &&
    cache.includes("setQueryData<McpListEnvelope>") &&
    cache.includes("invalidateMcpContractQueries") &&
    cacheOwnerText.includes("nextMcpCacheSequence") &&
    (cacheOwnerText.includes("acceptMcpCacheSequence") ||
      cacheOwnerText.includes("mcpLatestAcceptedSequence") ||
      cacheOwnerText.includes("sequence <")) &&
    !cache.includes("ModuleCacheEnvelope<unknown>");

  const pageControllerBoundaryOk =
    page.includes("useState") &&
    page.includes("createMcpServerFormDraft") &&
    page.includes("getMcpPagination") &&
    page.includes("toast") &&
    !/\buse(Query|Mutation|QueryClient)\b/.test(page) &&
    !/\b(setQueryData|invalidateQueries|cancelQueries)\b/.test(page) &&
    !/@\/services\/mcp|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/.test(page);

  const typedPayloadOk =
    service.includes("McpServerConfigInput") &&
    service.includes("CoreEnvelope<McpServerListPayload>") &&
    service.includes("CoreEnvelope<McpServerMutationPayload>") &&
    service.includes("CoreEnvelope<McpServerRemovePayload>") &&
    !service.includes("IpcEvidencePayload") &&
    !service.includes("IpcJsonObject") &&
    types.includes("export type McpListEnvelope") &&
    types.includes("export type McpMutationEnvelope") &&
    types.includes("export type McpRemoveEnvelope") &&
    types.includes("export type McpCachePayload") &&
    types.includes("export interface McpPageController") &&
    types.includes("export interface McpEditorController") &&
    query.includes("McpListEnvelope") &&
    cache.includes("McpMutationEnvelope") &&
    cache.includes("McpRemoveEnvelope") &&
    cache.includes("writeMcpAuthoritativePayload") &&
    !query.includes("payload: unknown") &&
    !mutation.includes("payload: unknown") &&
    !cache.includes("payload: unknown") &&
    cache.includes("Omit<McpCacheEnvelope, \"moduleId\">") &&
    hooksIndexBarrelOk &&
    splitOwnerOk &&
    cacheOwnerOk &&
    pageControllerBoundaryOk;

  if (!typedPayloadOk) {
    failures.push("mcp IPC payload owner 必须收口到 typed envelope、hooks/query、hooks/mutation、hooks/page 和 cache helper");
  } else {
    console.log("PASS mcp typed IPC payload owner：service/query/mutation/page/cache");
  }
}

function validateSharedCacheTypedGate() {
  const sharedCachePath = join(repoRoot, "src", "features", "_shared", "cache.ts");
  const sharedUpdaterPath = join(repoRoot, "src", "features", "_shared", "updater.tsx");
  const sharedPanelsPath = join(repoRoot, "src", "features", "_shared", "panels.tsx");
  const sharedCache = readRequired(sharedCachePath);
  const sharedUpdater = readRequired(sharedUpdaterPath);
  const sharedPanels = readRequired(sharedPanelsPath);

  const sharedCacheTypedOk =
    sharedCache.includes("export interface ModuleCacheOwner<TPayload = unknown>") &&
    sharedCache.includes("ModuleCacheWriteEnvelope<TPayload>") &&
    sharedCache.includes("createModuleCacheOwner<TPayload = unknown>") &&
    sharedCache.includes("ModuleCacheEnvelope<TPayload>") &&
    !sharedCache.includes("ModuleCacheEnvelope<unknown>");

  const sharedUpdaterTypedOk =
    sharedUpdater.includes("ModuleCacheOwner<TPayload>") &&
    sharedUpdater.includes("ModuleCacheEnvelope<TPayload>") &&
    !sharedUpdater.includes("ModuleCacheEnvelope<unknown>");

  const sharedPanelsTypedOk =
    sharedPanels.includes("RecordList<TItem") &&
    sharedPanels.includes("items: TItem[]") &&
    sharedPanels.includes("renderItem?: (item: TItem, index: number) => ReactNode") &&
    !sharedPanels.includes("items: unknown[]");

  if (!sharedCacheTypedOk || !sharedUpdaterTypedOk || !sharedPanelsTypedOk) {
    failures.push("_shared cache/updater/panel 必须保持 owner 级泛型 payload 和组件 item 边界");
  } else {
    console.log("PASS _shared cache/updater/panel typed owner 边界");
  }
}

function validateOverviewTypedPayloadGate() {
  const typesPath = join(repoRoot, "src", "features", "overview", "types", "index.ts");
  const cachePath = join(repoRoot, "src", "features", "overview", "cache", "index.ts");
  const hooksPath = join(repoRoot, "src", "features", "overview", "hooks", "index.ts");
  const utilsPath = join(repoRoot, "src", "features", "overview", "utils", "index.ts");
  const boundaryPanelPath = join(repoRoot, "src", "features", "overview", "panels", "boundary.tsx");
  const dataPanelPath = join(repoRoot, "src", "features", "overview", "panels", "data.tsx");
  const dialogsPath = join(repoRoot, "src", "features", "overview", "dialogs", "host.tsx");
  const systemServicePath = join(repoRoot, "src", "services", "system", "index.ts");
  const payloadPanelPath = join(repoRoot, "src", "features", "overview", "panels", "payload.tsx");
  const recordsPanelPath = join(repoRoot, "src", "features", "overview", "panels", "records.tsx");
  const types = readRequired(typesPath);
  const cache = readRequired(cachePath);
  const hooks = readRequired(hooksPath);
  const utils = readRequired(utilsPath);
  const boundaryPanel = readRequired(boundaryPanelPath);
  const dataPanel = readRequired(dataPanelPath);
  const dialogs = readRequired(dialogsPath);
  const systemService = readRequired(systemServicePath);
  const payloadPanel = readRequired(payloadPanelPath);
  const recordsPanel = readRequired(recordsPanelPath);

  const typedPayloadOk =
    types.includes("export type OverviewCachePayload") &&
    types.includes("export type OverviewCacheEnvelope") &&
    types.includes("export type OverviewRecordPayload") &&
    types.includes("export type OverviewPayloadSummaryValue") &&
    types.includes("items: DailyActivity[]") &&
    types.includes("items: McpServerSummary[]") &&
    types.includes("payload: NotificationClientStatePayload | null") &&
    types.includes("payload: MysteryRouteGrant[] | null") &&
    types.includes("OverviewImportRemoteSecretDialog") &&
    types.includes("OverviewDialogController") &&
    types.includes("run?: () => Promise<unknown> | unknown") &&
    types.includes("ModuleCacheEnvelope<TPayload>") &&
    cache.includes("createModuleCacheOwner<OverviewCachePayload>(\"overview\")") &&
    cache.includes("OVERVIEW_MYSTERY_GRANTS_QUERY_KEY") &&
    cache.includes("writeOverviewMysteryGrantsPayload") &&
    cache.includes("Omit<OverviewCacheEnvelope<TPayload>, \"moduleId\">") &&
    hooks.includes("writeOverviewAuthoritativePayload") &&
    hooks.includes("systemService.getOrCreateRemoteDeviceSecret()") &&
    hooks.includes("systemService.importRemoteDeviceSecretIfEmpty(secret.trim())") &&
    hooks.includes("systemService.mergeMysteryUnlockGrants(") &&
    hooks.includes("writeOverviewMysteryGrantsPayload(queryClient, payload)") &&
    hooks.includes("queryKey: OVERVIEW_MYSTERY_GRANTS_QUERY_KEY") &&
    hooks.includes("envelopeData<CoreSnapshotPayload>") &&
    hooks.includes("envelopeData<UsageAnalyticsPayload>") &&
    hooks.includes("envelopeData<McpServerListPayload>") &&
    hooks.includes("envelopeData<SkillListPayload>") &&
    hooks.includes("envelopeData<NotificationClientStatePayload>") &&
    hooks.includes("envelopeData<MysteryRouteGrant[]>") &&
    hooks.includes("readArray<DailyActivity>") &&
    hooks.includes("readArray<McpServerSummary>") &&
    hooks.includes("readArray<InstalledSkillSummary>") &&
    utils.includes("items: InstalledSkillSummary[]") &&
    boundaryPanel.includes("onClick={() => void action.run?.()}") &&
    boundaryPanel.includes("disabled={action.disabled || action.isPending}") &&
    !boundaryPanel.includes("variant=\"outline\" disabled aria-label") &&
    dataPanel.includes("remoteDeviceSecret") &&
    dataPanel.includes("t(panel.remoteSecretLabelKey)") &&
    dialogs.includes("OverviewDialogsHost({") &&
    dialogs.includes("ImportRemoteSecretDialog") &&
    dialogs.includes("dialog.onSubmit()") &&
    systemService.includes("epoch_ms: grant.epochMs") &&
    payloadPanel.includes("OverviewPayloadSummaryValue") &&
    recordsPanel.includes("TItem extends OverviewPayloadSummaryValue") &&
    !types.includes("OverviewCacheEnvelope<TPayload = unknown>") &&
    !types.includes("items: unknown[]") &&
    !types.includes("payload: unknown") &&
    !cache.includes("createModuleCacheOwner(\"overview\")") &&
    !cache.includes("ModuleCacheEnvelope<unknown>") &&
    !payloadPanel.includes("value: unknown");

  if (!typedPayloadOk) {
    failures.push("overview IPC payload owner 必须收口到 typed envelope、模块 types 和 cache helper");
  } else {
    console.log("PASS overview typed IPC payload owner：service/hook/cache");
  }
}

function validateTrayShellTypedPayloadGate() {
  const typesPath = join(repoRoot, "src", "features", "tray-shell", "types", "index.ts");
  const cachePath = join(repoRoot, "src", "features", "tray-shell", "cache", "index.ts");
  const hooksIndexPath = join(repoRoot, "src", "features", "tray-shell", "hooks", "index.ts");
  const queryPath = join(repoRoot, "src", "features", "tray-shell", "hooks", "query.ts");
  const mutationPath = join(repoRoot, "src", "features", "tray-shell", "hooks", "mutation.ts");
  const pagePath = join(repoRoot, "src", "features", "tray-shell", "hooks", "page.ts");
  const actionPath = join(repoRoot, "src", "features", "tray-shell", "hooks", "action.ts");
  const utilsPath = join(repoRoot, "src", "features", "tray-shell", "utils", "index.ts");
  const types = readRequired(typesPath);
  const cache = readRequired(cachePath);
  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const utils = readRequired(utilsPath);

  const typedPayloadOk =
    types.includes("export type TrayShellNotificationEnvelope") &&
    types.includes("export type TrayShellCachePayload") &&
    types.includes("CoreEnvelope<NotificationClientStatePayload>") &&
    types.includes("ModuleCacheEnvelope<TPayload>") &&
    types.includes("export interface TrayShellPageController") &&
    types.includes("export type TrayShellMetricModel") &&
    types.includes("export type TrayShellRuntimeRowModel") &&
    types.includes("export interface TrayShellRuntimePanelModel") &&
    types.includes("export interface TrayShellActionModel") &&
    types.includes('id: "focus-main-window"') &&
    types.includes('labelKey: "trayShell.focusMainWindow"') &&
    types.includes("run: () => Promise<void> | void") &&
    types.includes('id: "client"') &&
    types.includes('labelKey: "trayShell.client"') &&
    types.includes('id: "ready"') &&
    types.includes('labelKey: "trayShell.ready"') &&
    types.includes('valueKey: "common.success" | "common.error"') &&
    types.includes('titleKey: "trayShell.notificationClient"') &&
    !types.includes("TrayShellCacheEnvelope<TPayload = unknown>") &&
    !types.includes("id: string") &&
    !types.includes("labelKey: string");
  const cacheOk =
    cache.includes("createModuleCacheOwner<TrayShellCachePayload>(\"tray-shell\")") &&
    cache.includes("Omit<TrayShellCacheEnvelope<TPayload>, \"moduleId\">") &&
    !cache.includes("createModuleCacheOwner(\"tray-shell\")") &&
    !cache.includes("ModuleCacheEnvelope<unknown>");
  const hooksIndexOk =
    hooksIndex.includes("from \"./query\"") &&
    hooksIndex.includes("from \"./mutation\"") &&
    hooksIndex.includes("from \"./page\"") &&
    !hooksIndex.includes("from \"./action\"");
  const actionOwnerOk = !existsSync(actionPath);
  const queryOk =
    query.includes("useTrayShellCacheController") &&
    query.includes("useModuleCacheController(TrayShellCache)") &&
    query.includes("useTrayShellNotificationQuery") &&
    query.includes("useQuery<TrayShellNotificationEnvelope>") &&
    query.includes("TRAY_SHELL_NOTIFICATION_CLIENT_QUERY_KEY") &&
    query.includes("systemService.getNotificationClientState()") &&
    !query.includes("useMutation") &&
    !query.includes("systemService.focusMainWindow");
  const mutationOk =
    mutation.includes("useTrayShellFocusMainWindowMutation") &&
    mutation.includes("useTrayShellFocusMainWindowAction") &&
    mutation.includes("TrayShellActionModel") &&
    mutation.includes("useMutation") &&
    mutation.includes("useQueryClient") &&
    mutation.includes("systemService.focusMainWindow()") &&
    mutation.includes("invalidateTrayShellContractQueries(queryClient)") &&
    mutation.includes("focusMutation.mutateAsync()") &&
    mutation.includes("isPending: focusMutation.isPending") &&
    !mutation.includes("useQuery<") &&
    !mutation.includes("systemService.getNotificationClientState");
  const pageOk =
    page.includes("useTrayShellPageController") &&
    page.includes("TrayShellPageController") &&
    page.includes("useTrayShellNotificationQuery") &&
    page.includes("useTrayShellFocusMainWindowAction") &&
    page.includes("selectTrayShellClient(notification)") &&
    page.includes("selectTrayShellReady(notification)") &&
    !page.includes("@tanstack/react-query") &&
    !page.includes("useQuery(") &&
    !page.includes("useMutation(") &&
    !page.includes("useQueryClient") &&
    !page.includes("@/services/system") &&
    !page.includes("systemService.");
  const utilsOk =
    utils.includes("export function selectTrayShellClient(") &&
    utils.includes("export function selectTrayShellReady(") &&
    utils.includes("NotificationClientStatePayload | null") &&
    !utils.includes("export function readString(") &&
    !utils.includes("export function readBoolean(") &&
    !utils.includes("function readPath(value: unknown");

  if (!typedPayloadOk) failures.push("tray-shell types owner 必须保留 typed payload、TrayShellPageController、metric/runtime/action model");
  if (!cacheOk) failures.push("tray-shell cache owner 必须保留 typed createModuleCacheOwner 和 Omit<TrayShellCacheEnvelope<TPayload>, \"moduleId\">");
  if (!hooksIndexOk) failures.push("tray-shell hooks/index.ts 只能 re-export query、mutation、page");
  if (!actionOwnerOk) failures.push("tray-shell hooks/action.ts 不得保留独立 action owner；focus main window action 必须归 hooks/mutation.ts");
  if (!queryOk) failures.push("tray-shell hooks/query.ts 必须 owning cache controller、notification query 和 getNotificationClientState");
  if (!mutationOk) failures.push("tray-shell hooks/mutation.ts 必须 owning focus main window mutation/action、focusMainWindow 和 cache invalidation");
  if (!pageOk) failures.push("tray-shell hooks/page.ts 必须只组合 query/mutation 与 selectTrayShellClient/Ready，不得直接 TanStack 或 service");
  if (!utilsOk) failures.push("tray-shell utils owner 必须保留 typed selector，且不得回退 unknown reader");

  if (typedPayloadOk && cacheOk && hooksIndexOk && actionOwnerOk && queryOk && mutationOk && pageOk && utilsOk) {
    console.log("PASS tray-shell typed IPC payload owner：service/hook/cache");
  }
}

function validateSettingsTypedPayloadGate() {
  const typesPath = join(repoRoot, "src", "features", "settings", "types", "index.ts");
  const cachePath = join(repoRoot, "src", "features", "settings", "cache", "index.ts");
  const hooksIndexPath = join(repoRoot, "src", "features", "settings", "hooks", "index.ts");
  const queryHookPath = join(repoRoot, "src", "features", "settings", "hooks", "query.ts");
  const mutationHookPath = join(repoRoot, "src", "features", "settings", "hooks", "mutation.ts");
  const actionHookPath = join(repoRoot, "src", "features", "settings", "hooks", "action.ts");
  const pageHookPath = join(repoRoot, "src", "features", "settings", "hooks", "page.ts");
  const proxyComponentPath = join(repoRoot, "src", "features", "settings", "components", "proxy.tsx");
  const panelAndDialogText = [
    ...walkFiles(join(repoRoot, "src", "features", "settings", "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(repoRoot, "src", "features", "settings", "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(repoRoot, "src", "features", "settings", "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ]
    .map((file) => readRequired(file))
    .join("\n");
  const types = readRequired(typesPath);
  const cache = readRequired(cachePath);
  const hooksIndex = readRequired(hooksIndexPath);
  const queryHook = readRequired(queryHookPath);
  const mutationHook = readRequired(mutationHookPath);
  const actionHook = readRequired(actionHookPath);
  const pageHook = readRequired(pageHookPath);
  const hookOwners = [queryHook, mutationHook, actionHook, pageHook].join("\n");
  const proxyComponent = readRequired(proxyComponentPath);
  const hooksIndexReExportPattern =
    /export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']([^"']+)["'];?/g;
  const hooksIndexReExports = [...hooksIndex.matchAll(hooksIndexReExportPattern)].map(
    (match) => match[1],
  );
  const hooksIndexAllowedReExports = new Set([
    "./query",
    "./mutation",
    "./action",
    "./page",
  ]);
  const hooksIndexOnlyReExports =
    hooksIndex
      .replace(hooksIndexReExportPattern, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .trim() === "" &&
    ["query", "mutation", "action", "page"].every(
      (owner) =>
        hooksIndex.includes(`from "./${owner}"`) ||
        hooksIndex.includes(`from './${owner}'`),
    ) &&
    hooksIndexReExports.every((reExport) =>
      hooksIndexAllowedReExports.has(reExport),
    );
  if (!hooksIndexOnlyReExports) {
    const extraReExports = hooksIndexReExports.filter(
      (reExport) => !hooksIndexAllowedReExports.has(reExport),
    );
    failures.push(
      `src/features/settings/hooks/index.ts must only re-export ./query, ./mutation, ./action, ./page${
        extraReExports.length > 0 ? `; extra: ${extraReExports.join(", ")}` : ""
      }`,
    );
  }

  const settingsTypedPayloadOk =
    types.includes("export type SettingsQueryPayload = boolean | RefreshInterval") &&
    types.includes("export type SettingsWritableQueryKey") &&
    types.includes("export type SettingsQueryPayloadForKey") &&
    types.includes("export type SettingsCachePayload =") &&
    types.includes("queryKey: SettingsHasNotchQueryKey") &&
    types.includes("queryKey: SettingsUsageRefreshIntervalQueryKey") &&
    types.includes("value: RefreshInterval") &&
    types.includes("ModuleCacheEnvelope<TPayload>") &&
    types.includes("onRefreshUsageStatus?: () => Promise<void> | void") &&
    types.includes("export interface SettingsPageController") &&
    types.includes("export interface SettingsAppearanceController") &&
    types.includes("export interface SettingsStatusController") &&
    types.includes("export interface SettingsModeSwitchController") &&
    types.includes("export interface SettingsAboutController") &&
    types.includes("export interface SettingsThresholdDialogController") &&
    types.includes("export interface SettingsProxyDialogController") &&
    types.includes("export interface SettingsPageActions") &&
    types.includes("export interface SettingsControllerProps") &&
    cache.includes("createModuleCacheOwner<SettingsCachePayload>(\"settings\")") &&
    cache.includes("Omit<SettingsCacheEnvelope<TPayload>, \"moduleId\">") &&
    cache.includes("TKey extends SettingsWritableQueryKey") &&
    cache.includes("SettingsQueryPayloadForKey<TKey>") &&
    cache.includes("toSettingsCachePayload") &&
    cache.includes("writeSettingsAuthoritativePayload(queryClient") &&
    cache.includes("writeSettingsMutationPayload") &&
    cache.includes("invalidateSettingsContractQueries") &&
    queryHook.includes("runSettingsQuery") &&
    queryHook.includes("settingsService.loadSnapshot") &&
    queryHook.includes("settingsService.getUsageRefreshInterval") &&
    mutationHook.includes("beginSettingsMutation") &&
    mutationHook.includes("writeSettingsMutationPayload") &&
    mutationHook.includes("setUsageRefreshInterval") &&
    mutationHook.includes("settingsService.setApiProxyConfig") &&
    actionHook.includes("useSettingsBusyActions") &&
    hookOwners.includes("Promise<void> | void") &&
    pageHook.includes("SettingsPageController") &&
    proxyComponent.includes("onSaved?: () => Promise<void> | void") &&
    !types.includes("SettingsCacheEnvelope<TPayload = unknown>") &&
    !types.includes("SettingsPageController = ReturnType") &&
    !cache.includes("createModuleCacheOwner(\"settings\")") &&
    !cache.includes("ModuleCacheEnvelope<unknown>") &&
    !hookOwners.includes("Promise<unknown> | void") &&
    !hookOwners.includes("ModuleCacheEnvelope<unknown>") &&
    !hookOwners.includes("payload: unknown") &&
    !pageHook.match(/\buse(Query|Mutation|QueryClient)\b/) &&
    !pageHook.match(/@\/services\/settings|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|settingsService\.|systemService\.|invokeIpc|invoke\(/) &&
    !panelAndDialogText.includes("ReturnType<typeof useSettingsPageController>") &&
    !/(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(panelAndDialogText) &&
    !proxyComponent.includes("Promise<unknown> | void");

  const typedPayloadOk = hooksIndexOnlyReExports && settingsTypedPayloadOk;

  if (!settingsTypedPayloadOk) {
    failures.push("settings split owner gate must keep typed query payload, explicit controller props, cache helper writes, and no unknown fallback");
  } else if (typedPayloadOk) {
    console.log("PASS settings typed IPC payload owner: split hooks/types/cache");
  }
}

function validateMaintenanceTypedPayloadGate() {
  const servicePath = join(repoRoot, "src", "services", "maintenance", "index.ts");
  const typesPath = join(repoRoot, "src", "features", "maintenance", "types", "index.ts");
  const cachePath = join(repoRoot, "src", "features", "maintenance", "cache", "index.ts");
  const hooksIndexPath = join(repoRoot, "src", "features", "maintenance", "hooks", "index.ts");
  const queryPath = join(repoRoot, "src", "features", "maintenance", "hooks", "query.ts");
  const mutationPath = join(repoRoot, "src", "features", "maintenance", "hooks", "mutation.ts");
  const pagePath = join(repoRoot, "src", "features", "maintenance", "hooks", "page.ts");
  const diagnosticsDialogPath = join(
    repoRoot,
    "src",
    "features",
    "maintenance",
    "dialogs",
    "diagnostics.tsx",
  );
  const service = readRequired(servicePath);
  const types = readRequired(typesPath);
  const cache = readRequired(cachePath);
  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const diagnosticsDialog = readRequired(diagnosticsDialogPath);

  const typedPayloadOk =
    service.includes("readEnvelopeData(systemService.clean())") &&
    service.includes("readEnvelopeData(systemService.rebuildRegistry())") &&
    service.includes("readEnvelopeData(systemService.diagnose())") &&
    service.includes("CoreEnvelope<RelayDiagnosticPayload>") &&
    service.includes("CoreEnvelope<RelayRouterIssueFixPayload>") &&
    !service.includes("CoreEnvelope<unknown>") &&
    !service.includes("IpcEvidencePayload") &&
    types.includes("export type MaintenanceCachePayload") &&
    types.includes("export type MaintenanceQueryPayloadForKey") &&
    types.includes("export type MaintenanceSystemInfoPayload") &&
    types.includes("export type MaintenanceRouterDiagnosticsPayload = RelayDiagnosticPayload") &&
    types.includes("export type MaintenanceRouterFixPayload = RelayRouterIssueFixPayload") &&
    types.includes("ModuleCacheEnvelope<TPayload>") &&
    types.includes("SystemInfoPayload") &&
    !types.includes("MaintenanceCacheEnvelope<TPayload = unknown>") &&
    !types.includes("payload: unknown") &&
    cache.includes("createModuleCacheOwner<MaintenanceCachePayload>(\"maintenance\")") &&
    cache.includes("Omit<MaintenanceCacheEnvelope<TPayload>, \"moduleId\">") &&
    cache.includes("TKey extends MaintenanceWritableQueryKey") &&
    cache.includes("MaintenanceQueryPayloadForKey<TKey>") &&
    cache.includes("toMaintenanceCachePayload") &&
    cache.includes("TPayload extends MaintenanceActionPayload") &&
    !cache.includes("createModuleCacheOwner(\"maintenance\")") &&
    !cache.includes("ModuleCacheEnvelope<unknown>") &&
    hooksIndex.includes("from \"./query\"") &&
    hooksIndex.includes("from \"./mutation\"") &&
    hooksIndex.includes("from \"./page\"") &&
    !/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/.test(hooksIndex) &&
    !/@\/services\/maintenance|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|maintenanceService\.|systemService\.|invokeIpc|invoke\(/.test(hooksIndex) &&
    query.includes("useQuery") &&
    query.includes("useQueryClient") &&
    query.includes("runMaintenanceQuery") &&
    query.includes("MAINTENANCE_IMAGE_COMPAT_QUERY_KEY") &&
    query.includes("MAINTENANCE_SYSTEM_INFO_QUERY_KEY") &&
    query.includes("maintenanceService.getImageCompat") &&
    query.includes("maintenanceService.getSystemInfo") &&
    !query.includes("useMutation") &&
    !query.includes("payload: unknown") &&
    mutation.includes("useMutation") &&
    mutation.includes("useQueryClient") &&
    mutation.includes("prepareMaintenanceMutation") &&
    mutation.includes("writeMaintenanceActionPayload") &&
    mutation.includes("writeMaintenanceMutationPayload") &&
    mutation.includes("invalidateMaintenanceContractQueries") &&
    mutation.includes("maintenanceService.runCodexRouterDiagnostics") &&
    mutation.includes("maintenanceService.fixCodexRouterIssue") &&
    !mutation.includes("useQuery(") &&
    !mutation.includes("payload: unknown") &&
    page.includes("MaintenancePageController") &&
    page.includes("value: systemInfoQuery.data?.os ?? \"-\"") &&
    page.includes("value: systemInfoQuery.data?.arch ?? \"-\"") &&
    page.includes("value: systemInfoQuery.data?.osVersion ?? \"-\"") &&
    page.includes("async (key: string, mutateAsync: () => Promise<void>)") &&
    !/\b(useQuery|useMutation|useQueryClient|setQueryData|invalidateQueries|cancelQueries|MAINTENANCE_[A-Z0-9_]+_QUERY_KEY)\b/.test(page) &&
    !/@\/services\/maintenance|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|maintenanceService\.|systemService\.|invokeIpc|invoke\(/.test(page) &&
    !page.includes("readSystemInfoField(value: unknown") &&
    !page.includes("payload: unknown") &&
    diagnosticsDialog.includes("runDiagnostics: () => Promise<MaintenanceRouterDiagnosticsPayload>") &&
    diagnosticsDialog.includes("fixResult: MaintenanceRouterFixPayload") &&
    diagnosticsDialog.includes("diagnosticsResult: MaintenanceRouterDiagnosticsPayload") &&
    diagnosticsDialog.includes("readRouterDiagnosticLabel(item)") &&
    diagnosticsDialog.includes("readRouterDiagnosticStatus(item)") &&
    !diagnosticsDialog.includes("runDiagnostics: () => Promise<unknown>") &&
    !diagnosticsDialog.includes("fixResult: unknown") &&
    !diagnosticsDialog.includes("diagnosticsResult: unknown") &&
    !diagnosticsDialog.includes("function readRouterDiagnosticsPayload(") &&
    !diagnosticsDialog.includes("function readRouterFixPayload(");

  if (!typedPayloadOk) {
    failures.push("maintenance IPC payload owner 必须收口到 typed data payload、模块 types、cache helper 和 dialog typed props");
  } else {
    console.log("PASS maintenance typed IPC payload owner：service/hook/cache/dialog");
  }
}

function validateCustomInstructionsTypedPayloadGate() {
  const servicePath = join(
    repoRoot,
    "src",
    "services",
    "custom-instructions",
    "index.ts",
  );
  const typesPath = join(
    repoRoot,
    "src",
    "features",
    "custom-instructions",
    "types",
    "index.ts",
  );
  const cachePath = join(
    repoRoot,
    "src",
    "features",
    "custom-instructions",
    "cache",
    "index.ts",
  );
  const hooksPath = join(
    repoRoot,
    "src",
    "features",
    "custom-instructions",
    "hooks",
    "index.ts",
  );
  const service = readRequired(servicePath);
  const types = readRequired(typesPath);
  const cache = readRequired(cachePath);
  const hooks = readRequired(hooksPath);

  const typedPayloadOk =
    service.includes("readEnvelopeData(") &&
    service.includes("CoreEnvelope<CustomInstructionStatePayload>") &&
    service.includes("CoreEnvelope<CustomInstructionPreviewPayload>") &&
    !service.includes("CoreEnvelope<unknown>") &&
    !service.includes("IpcEvidencePayload") &&
    types.includes("export type CustomInstructionsStateQueryKey") &&
    types.includes("export type CustomInstructionsCachePayload") &&
    types.includes("CustomInstructionStatePayload") &&
    types.includes("ModuleCacheEnvelope<TPayload>") &&
    !types.includes("CustomInstructionsCacheEnvelope<TPayload = unknown>") &&
    !types.includes("payload: unknown") &&
    cache.includes("createModuleCacheOwner<CustomInstructionsCachePayload>(\"custom-instructions\")") &&
    cache.includes("Omit<CustomInstructionsCacheEnvelope<TPayload>, \"moduleId\">") &&
    cache.includes("writeCustomInstructionsStatePayload") &&
    cache.includes("runCustomInstructionsStateQuery") &&
    cache.includes("writeCustomInstructionsStateMutationPayload") &&
    cache.includes("setQueryData<CustomInstructionStatePayload>") &&
    !cache.includes("createModuleCacheOwner(\"custom-instructions\")") &&
    !cache.includes("ModuleCacheEnvelope<unknown>") &&
    hooks.includes("runCustomInstructionsStateQuery") &&
    hooks.includes("writeCustomInstructionsStateMutationPayload") &&
    hooks.includes("const state = stateQuery.data;") &&
    !hooks.includes("response.data") &&
    !hooks.includes("writeCustomInstructionsCachePayload<TPayload>") &&
    !hooks.includes("writeCustomInstructionsMutationPayload<TPayload>") &&
    !hooks.includes("CustomInstructionsCache.writeAuthoritativePayload");

  if (!typedPayloadOk) {
    failures.push("custom-instructions IPC payload owner 必须收口到 typed data payload、模块 types 和 cache helper");
  } else {
    console.log("PASS custom-instructions typed IPC payload owner：service/hook/cache");
  }
}

function validateDaemonAutoswitchTypedPayloadGate() {
  const typesPath = join(repoRoot, "src", "features", "daemon-autoswitch", "types", "index.ts");
  const cachePath = join(repoRoot, "src", "features", "daemon-autoswitch", "cache", "index.ts");
  const hooksPath = join(repoRoot, "src", "features", "daemon-autoswitch", "hooks", "index.ts");
  const payloadPanelPath = join(
    repoRoot,
    "src",
    "features",
    "daemon-autoswitch",
    "panels",
    "payload.tsx",
  );
  const types = readRequired(typesPath);
  const cache = readRequired(cachePath);
  const hooks = readRequired(hooksPath);
  const payloadPanel = readRequired(payloadPanelPath);

  const typedPayloadOk =
    types.includes("export type DaemonAutoswitchCachePayload") &&
    types.includes("export type DaemonAutoswitchMutationEnvelope") &&
    types.includes("export type DaemonAutoswitchMutationPayload") &&
    types.includes("export type DaemonAutoswitchPanelPayload") &&
    types.includes("ModuleCacheEnvelope<TPayload>") &&
    types.includes('id: "bootstrap"') &&
    types.includes('id: "pending"') &&
    cache.includes("createModuleCacheOwner<DaemonAutoswitchCachePayload>(\"daemon-autoswitch\")") &&
    cache.includes("Omit<DaemonAutoswitchCacheEnvelope<TPayload>, \"moduleId\">") &&
    hooks.includes("DaemonAutoswitchCachePayload") &&
    hooks.includes("DaemonAutoswitchMutationEnvelope") &&
    hooks.includes("writeDaemonAutoswitchAuthoritativePayload") &&
    hooks.includes("reloadDaemonAutoswitchAfterMutation") &&
    payloadPanel.includes("DaemonAutoswitchPanelPayload") &&
    !types.includes("DaemonAutoswitchCacheEnvelope<TPayload = unknown>") &&
    !types.includes("payload: unknown") &&
    !cache.includes("createModuleCacheOwner(\"daemon-autoswitch\")") &&
    !cache.includes("ModuleCacheEnvelope<unknown>") &&
    !hooks.includes("payload: unknown") &&
    !hooks.includes("ModuleCacheEnvelope<unknown>") &&
    !payloadPanel.includes("value: unknown");

  if (!typedPayloadOk) {
    failures.push("daemon-autoswitch IPC payload owner 必须收口到 typed envelope、模块 types 和 cache helper");
  } else {
    console.log("PASS daemon-autoswitch typed IPC payload owner：service/hook/cache");
  }
}

function validatePluginsFrontendNoPromotionGate() {
  const acceptance = parseJsonFile(pluginsGateFiles.acceptanceMatrix) ?? {};
  const composite = parseJsonFile(pluginsGateFiles.compositeGateMatrix) ?? {};
  const pluginsServicePath = join(repoRoot, "src", "services", "plugins", "index.ts");
  const runtimeExtensionsServicePath = join(repoRoot, "src", "services", "runtime-extensions", "index.ts");
  const pluginsContractPath = join(repoRoot, "src", "features", "plugins", "contract.ts");
  const pluginsHooksIndexPath = join(repoRoot, "src", "features", "plugins", "hooks", "index.ts");
  const pluginsQueryHookPath = join(repoRoot, "src", "features", "plugins", "hooks", "query.ts");
  const pluginsRefreshHookPath = join(repoRoot, "src", "features", "plugins", "hooks", "refresh.ts");
  const pluginsMutationHookPath = join(repoRoot, "src", "features", "plugins", "hooks", "mutation.ts");
  const pluginsPageHookPath = join(repoRoot, "src", "features", "plugins", "hooks", "page.ts");
  const pluginsCachePath = join(repoRoot, "src", "features", "plugins", "cache", "index.ts");
  const pluginsTypesPath = join(repoRoot, "src", "features", "plugins", "types", "index.ts");
  const pluginsPagePath = join(repoRoot, "src", "features", "plugins", "components", "page.tsx");
  const pluginsPanelPath = join(repoRoot, "src", "features", "plugins", "panels", "page.tsx");
  const pluginsDialogsIndexPath = join(repoRoot, "src", "features", "plugins", "dialogs", "index.ts");
  const pluginsConfigDialogPath = join(repoRoot, "src", "features", "plugins", "dialogs", "config.tsx");

  const service = readRequired(pluginsServicePath);
  const runtimeService = readRequired(runtimeExtensionsServicePath);
  const contract = readRequired(pluginsContractPath);
  const hooksIndex = readRequired(pluginsHooksIndexPath);
  const queryHook = readRequired(pluginsQueryHookPath);
  const refreshHook = readRequired(pluginsRefreshHookPath);
  const mutationHook = readRequired(pluginsMutationHookPath);
  const pageHook = readRequired(pluginsPageHookPath);
  const hooks = [hooksIndex, queryHook, refreshHook, mutationHook, pageHook].join("\n");
  const cache = readRequired(pluginsCachePath);
  const types = readRequired(pluginsTypesPath);
  const page = readRequired(pluginsPagePath);
  const panel = readRequired(pluginsPanelPath);
  const dialogsIndex = readRequired(pluginsDialogsIndexPath);

  const falseGateFields = [
    "consumerStartReady",
    "strictImplementationUse",
    "readyToImplement",
    "implementation_use",
    "gate_accepted",
    "full_leaf_100",
  ];
  const acceptanceGlobalGate = acceptance.globalGate ?? {};
  const compositeModuleGate = composite.module_gate ?? {};
  for (const field of falseGateFields) {
    if (acceptanceGlobalGate[field] !== false) {
      failures.push(`plugins frontend acceptance gate 不得提升 ${field}=true`);
    }
    if (compositeModuleGate[field] !== false) {
      failures.push(`plugins composite gate 不得提升 ${field}=true`);
    }
  }
  if (compositeModuleGate.no_gate_promotion !== true) {
    failures.push("plugins composite gate 必须声明 no_gate_promotion=true");
  }

  const acceptanceCommands = new Map(
    Array.isArray(acceptance.commands)
      ? acceptance.commands.map((item) => [item.command, item])
      : [],
  );
  const listGate = acceptanceCommands.get("list_plugins") ?? {};
  const toggleGate = acceptanceCommands.get("toggle_plugin") ?? {};
  const getConfigGate = acceptanceCommands.get("get_plugin_config") ?? {};
  const updateConfigGate = acceptanceCommands.get("update_plugin_config") ?? {};
  if (listGate.uiTriggerObserved !== true || listGate.blocked !== false) {
    failures.push("plugins list_plugins 必须保持 visible UI trigger 已观察且未阻塞");
  }
  if (toggleGate.uiTriggerObserved !== true || toggleGate.blocked !== false) {
    failures.push("plugins toggle_plugin 必须保持 visible UI trigger 已观察且未阻塞");
  }
  for (const [command, gate] of [
    ["get_plugin_config", getConfigGate],
    ["update_plugin_config", updateConfigGate],
  ]) {
    if (gate.uiTriggerObserved !== false || gate.frontendConsumptionMapped !== false || gate.blocked !== true) {
      failures.push(`plugins ${command} 必须保持缺少可见配置 UI caller 的阻塞结论`);
    }
  }

  const serviceWrappersOk =
    service.includes('"list_plugins"') &&
    service.includes('"toggle_plugin"') &&
    service.includes('"get_plugin_config"') &&
    service.includes('"update_plugin_config"') &&
    service.includes("{ id, enabled }") &&
    service.includes("{ id, settings }");
  if (!serviceWrappersOk) {
    failures.push("plugins service 必须保留四个 raw wrapper 和参数边界");
  }

  const contractOk =
    contract.includes('"command": "list_plugins"') &&
    contract.includes('"command": "toggle_plugin"') &&
    contract.includes('"command": "get_plugin_config"') &&
    contract.includes('"command": "update_plugin_config"') &&
    contract.includes('"controlFlowCount": 0') &&
    contract.includes('"controlFlowCount": 1');
  if (!contractOk) {
    failures.push("plugins dumped contract 必须记录四个命令及 controlFlowCount 差异");
  }

  const visibleConfigUiSignals = [
    "PluginConfigDialog",
    "configDialog",
    "openForPlugin",
    "loadConfigMutation",
    "updatePluginConfigMutation",
    "pluginsService.getConfig",
    "pluginsService.updateConfig",
    "getPluginConfig",
    "updatePluginConfig",
    "pluginConfigQueryKey",
  ];
  for (const signal of visibleConfigUiSignals) {
    if (hooks.includes(signal) || page.includes(signal) || panel.includes(signal) || dialogsIndex.includes(signal)) {
      failures.push(`plugins 缺少可见配置 UI 证据，前端 owner 不得消费 ${signal}`);
    }
  }
  if (existsSync(pluginsConfigDialogPath)) {
    failures.push("plugins 缺少可见配置 UI 证据，不得保留 dialogs/config.tsx");
  }

  const listToggleOwnerOk =
    queryHook.includes("pluginsService.list()") &&
    queryHook.includes("writePluginsListQueryPayload") &&
    refreshHook.includes("pluginsService.list()") &&
    refreshHook.includes("writePluginsRefreshPayload") &&
    mutationHook.includes("pluginsService.toggle(id, enabled)") &&
    mutationHook.includes("writePluginsMutationPayload") &&
    cache.includes("optimisticallyUpdatePluginsToggle") &&
    cache.includes("rollbackPluginsToggle") &&
    panel.includes("controller.togglePlugin.run(id, checked)") &&
    !panel.includes("Settings2");
  if (!listToggleOwnerOk) {
    failures.push("plugins 页面 owner 只应承接 list/toggle 可见 UI，并保留 mutation payload 写回");
  }

  console.log("PASS plugins frontend gate：list/toggle 可见，config wrapper 不提升为 UI 还原");
}

function validatePluginsTypedPayloadGate() {
  const pluginsServicePath = join(repoRoot, "src", "services", "plugins", "index.ts");
  const runtimeExtensionsServicePath = join(repoRoot, "src", "services", "runtime-extensions", "index.ts");
  const pluginsHooksIndexPath = join(repoRoot, "src", "features", "plugins", "hooks", "index.ts");
  const pluginsQueryHookPath = join(repoRoot, "src", "features", "plugins", "hooks", "query.ts");
  const pluginsRefreshHookPath = join(repoRoot, "src", "features", "plugins", "hooks", "refresh.ts");
  const pluginsMutationHookPath = join(repoRoot, "src", "features", "plugins", "hooks", "mutation.ts");
  const pluginsPageHookPath = join(repoRoot, "src", "features", "plugins", "hooks", "page.ts");
  const pluginsCachePath = join(repoRoot, "src", "features", "plugins", "cache", "index.ts");
  const pluginsTypesPath = join(repoRoot, "src", "features", "plugins", "types", "index.ts");
  const pluginsPanelPath = join(repoRoot, "src", "features", "plugins", "panels", "page.tsx");

  const service = readRequired(pluginsServicePath);
  const runtimeService = readRequired(runtimeExtensionsServicePath);
  const hooksIndex = readRequired(pluginsHooksIndexPath);
  const queryHook = readRequired(pluginsQueryHookPath);
  const refreshHook = readRequired(pluginsRefreshHookPath);
  const mutationHook = readRequired(pluginsMutationHookPath);
  const pageHook = readRequired(pluginsPageHookPath);
  const hooks = [hooksIndex, queryHook, refreshHook, mutationHook, pageHook].join("\n");
  const cache = readRequired(pluginsCachePath);
  const types = readRequired(pluginsTypesPath);
  const panel = readRequired(pluginsPanelPath);

  const typedPayloadOk =
    service.includes("CoreEnvelope<RuntimeExtensionListPayload>") &&
    service.includes("CoreEnvelope<RuntimeExtensionTogglePayload>") &&
    service.includes("CoreEnvelope<RuntimeExtensionConfigPayload>") &&
    runtimeService.includes("CoreEnvelope<RuntimeExtensionListPayload>") &&
    runtimeService.includes("CoreEnvelope<RuntimeExtensionTogglePayload>") &&
    runtimeService.includes("CoreEnvelope<RuntimeExtensionConfigPayload>") &&
    !service.includes("IpcEvidencePayload") &&
    !runtimeService.includes("IpcEvidencePayload") &&
    types.includes("export type PluginsCachePayload") &&
    types.includes("export type PluginsListEnvelope") &&
    types.includes("export type PluginsToggleEnvelope") &&
    types.includes("export type PluginsConfigEnvelope") &&
    queryHook.includes("PluginsListEnvelope") &&
    refreshHook.includes("PluginsListEnvelope") &&
    mutationHook.includes("PluginsToggleEnvelope") &&
    hooks.includes("writePluginsListQueryPayload") &&
    hooks.includes("writePluginsRefreshPayload") &&
    hooks.includes("writePluginsMutationPayload") &&
    pageHook.includes("PluginsPageController") &&
    cache.includes("writePluginsAuthoritativePayload") &&
    cache.includes("writePluginsListQueryPayload") &&
    cache.includes("writePluginsRefreshPayload") &&
    cache.includes("writePluginsMutationPayload") &&
    cache.includes("Omit<PluginsCacheEnvelope, \"moduleId\">") &&
    !cache.includes("ModuleCacheEnvelope<unknown>") &&
    !panel.includes("items: unknown[]");

  if (!typedPayloadOk) {
    failures.push("plugins IPC payload owner 必须收口到 typed envelope、模块 types 和 cache helper");
  } else {
    console.log("PASS plugins typed IPC payload owner：service/hook/cache");
  }
}

function validateSystemTypedPayloadGate() {
  const systemServicePath = join(repoRoot, "src", "services", "system", "index.ts");
  const customInstructionsServicePath = join(
    repoRoot,
    "src",
    "services",
    "custom-instructions",
    "index.ts",
  );
  const systemService = readRequired(systemServicePath);
  const customInstructionsService = readRequired(customInstructionsServicePath);

  const typedPayloadOk =
    systemService.includes("SystemActionPayload") &&
    systemService.includes("CoreEnvelope<SystemActionPayload>") &&
    systemService.includes("CoreEnvelope<boolean>>(\"hotspot_ready\")") &&
    systemService.includes("CoreEnvelope<MysteryRouteGrant[]>") &&
    systemService.includes("toMysteryRouteGrantArgs(grants)") &&
    customInstructionsService.includes("systemService.openPath") &&
    !systemService.includes("CoreEnvelope<unknown>") &&
    !systemService.includes("IpcEvidencePayload") &&
    !systemService.includes("IpcJsonObject") &&
    !customInstructionsService.includes("CoreEnvelope<unknown>") &&
    !customInstructionsService.includes("\"open_path\"");

  if (!typedPayloadOk) {
    failures.push("system IPC payload owner 必须收口到 typed action payload 和 system service facade");
  } else {
    console.log("PASS system typed IPC payload owner：service/action facade");
  }
}

function validateNoForbiddenReferenceNames() {
  const textFiles = [
    ...walkFiles(join(repoRoot, "src"), (file) => /\.(cjs|css|html|js|json|jsx|md|mjs|ts|tsx|txt|yml|yaml)$/i.test(file)),
    ...walkFiles(join(repoRoot, "scripts"), (file) => /\.(cjs|js|json|mjs|ts|txt)$/i.test(file)),
    join(repoRoot, "package.json"),
  ];

  for (const file of textFiles) {
    const content = readRequired(file).toLowerCase();
    for (const forbiddenName of forbiddenReferenceNames) {
      if (content.includes(forbiddenName.toLowerCase())) {
        failures.push(`${toRepoPath(file)} 出现外部参考项目名称`);
      }
    }
  }

  console.log("PASS 外部参考项目名扫描已执行：src、scripts、package.json");
}

const raw = {
  frontendFiles: readRequired(evidenceFiles.frontendFiles)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean),
  queryHits: parseJsonlFile(evidenceFiles.queryHits),
  routerHits: [],
  controlFlow: parseJsonlFile(evidenceFiles.controlFlow),
};

assertEvidenceInputs(raw);
validateQueryKeys(raw.queryHits);
validatePageChunks(raw.frontendFiles);
validateRoutesAndLocales(raw.controlFlow);
validateKnownInternalFrontendGates();
validateSharedCacheTypedGate();
validateOverviewTypedPayloadGate();
validateTrayShellTypedPayloadGate();
validateSettingsTypedPayloadGate();
validateMaintenanceTypedPayloadGate();
validateCustomInstructionsTypedPayloadGate();
validateDaemonAutoswitchTypedPayloadGate();
validateMcpTypedPayloadGate();
validatePluginsFrontendNoPromotionGate();
validatePluginsTypedPayloadGate();
validateSystemTypedPayloadGate();
validateNoForbiddenReferenceNames();

for (const note of notes) {
  console.log(note);
}

if (failures.length > 0) {
  console.error("前端 raw evidence 覆盖验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("前端 raw evidence 覆盖验证通过。");
