import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

const repoRoot = process.cwd();
const srcRoot = join(repoRoot, "src");
const featuresRoot = join(srcRoot, "features");
const routesRoot = join(srcRoot, "routes", "desktop", "main");
const servicesRoot = join(srcRoot, "services");

const featureModules = [
  "accounts",
  "analytics",
  "custom-instructions",
  "daemon-autoswitch",
  "maintenance",
  "mcp",
  "overview",
  "plugins",
  "relay",
  "sessions",
  "settings",
  "skills",
  "tray-shell",
  "voice",
];

const modulesWithService = [
  "accounts",
  "analytics",
  "custom-instructions",
  "daemon-autoswitch",
  "maintenance",
  "mcp",
  "plugins",
  "relay",
  "sessions",
  "settings",
  "skills",
  "voice",
];

const strictFeaturePageShells = [
  "accounts",
  "analytics",
  "custom-instructions",
  "daemon-autoswitch",
  "maintenance",
  "mcp",
  "overview",
  "plugins",
  "relay",
  "sessions",
  "settings",
  "skills",
  "tray-shell",
  "voice",
];

const providerContentPageShells = [
  "skills",
  "voice",
];

const requiredFeatureFiles = [
  "Provider.tsx",
  "StoreUpdater.tsx",
  "Content.tsx",
  "cache/index.ts",
  "hooks/index.ts",
  "store/index.ts",
  "types/index.ts",
  "components/index.ts",
  "dialogs/index.ts",
  "panels/index.ts",
  "utils/index.ts",
];

const forbiddenReferenceNames = [
  [108, 111, 98, 101, 104, 117, 98],
  [76, 111, 98, 101, 72, 117, 98],
  [108, 111, 98, 101, 104, 117, 98, 47, 108, 111, 98, 101, 104, 117, 98],
].map((codes) => String.fromCharCode(...codes));

const failures = [];

function repoPath(path) {
  return relative(repoRoot, path).replaceAll(sep, "/");
}

function readRequired(path) {
  if (!existsSync(path)) {
    failures.push(`缺少文件：${repoPath(path)}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function walkFiles(root, predicate) {
  if (!existsSync(root)) return [];
  const ignoredDirectories = new Set([".git", "node_modules", "dist", "target"]);
  const pending = [root];
  const files = [];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;

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

function validateSourceFileNames() {
  const sourceFiles = walkFiles(srcRoot, (file) => /\.(css|json|md|ts|tsx)$/i.test(file));
  for (const file of sourceFiles) {
    if (basename(file).includes("-")) {
      failures.push(`${repoPath(file)} 文件名不得使用连字符；目录已表达 owner，文件名只能保留单词职责`);
    }
  }

  console.log(`PASS src 文件名单词化：${sourceFiles.length}/${sourceFiles.length}`);
}

function assertIncludes(file, content, snippets) {
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      failures.push(`${file} 缺少结构片段：${snippet}`);
    }
  }
}

function assertNotMatches(file, content, patterns) {
  for (const [pattern, reason] of patterns) {
    if (pattern.test(content)) {
      failures.push(`${file} 出现禁止边界：${reason}`);
    }
  }
}

function assertOnlyBarrelReExports(file, content, owners) {
  const reExportPattern =
    /export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']([^"']+)["'];?/g;
  const reExports = [...content.matchAll(reExportPattern)].map((match) => match[1]);
  const allowedPaths = new Set(owners.map((owner) => `./${owner}`));
  const remainder = content
    .replace(reExportPattern, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  if (remainder) {
    failures.push(`${file} 只能作为 re-export barrel，不得包含 hook 实现、cache 写入或 page controller`);
  }

  for (const owner of owners) {
    if (!reExports.includes(`./${owner}`)) {
      failures.push(`${file} 必须 re-export ./${owner} owner`);
    }
  }

  for (const reExport of reExports) {
    if (!allowedPaths.has(reExport)) {
      failures.push(
        `${file} 只能 re-export ${owners
          .map((owner) => `./${owner}`)
          .join("、")}，不得导出 ${reExport}`,
      );
    }
  }
}

function validateAccountsDeepOwnerBoundaries() {
  const accountsRoot = join(featuresRoot, "accounts");
  const hooksIndexPath = join(accountsRoot, "hooks", "index.ts");
  const queryPath = join(accountsRoot, "hooks", "query.ts");
  const mutationPath = join(accountsRoot, "hooks", "mutation.ts");
  const actionPath = join(accountsRoot, "hooks", "action.ts");
  const pagePath = join(accountsRoot, "hooks", "page.ts");
  const cachePath = join(accountsRoot, "cache", "index.ts");
  const typesPath = join(accountsRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(accountsRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(accountsRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(accountsRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const action = readRequired(actionPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((file) => readRequired(file))
    .join("\n");

  assertOnlyBarrelReExports("src/features/accounts/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "action",
    "page",
  ]);
  assertNotMatches("src/features/accounts/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "accounts hooks/index can only re-export split owners"],
    [/\b(writeAccounts|setQueryData|invalidateQueries|cancelQueries|Accounts[A-Za-z]*QueryKeys)\b/, "accounts hooks/index must not own cache writes or query keys"],
    [/@\/services\/accounts|@\/services\/system|@\/services\/maintenance|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|accountsService\.|systemService\.|maintenanceService\.|invokeIpc|invoke\(/, "accounts hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/accounts/hooks/query.ts", query, [
    "useAccountsCacheController",
    "useModuleCacheController(AccountsCache)",
    "useAccountsPageQueries",
    "useQuery",
    "useQueryClient",
    "accountsService.loadSnapshot(true)",
    "AccountsAuthoritativeQueryKeys",
    "AccountsDumpedQueryKeys",
    "writeAccountsSnapshotPayload",
    "AccountsSnapshotEnvelope",
  ]);
  assertNotMatches("src/features/accounts/hooks/query.ts", query, [
    [/\buseMutation\b/, "accounts query owner must not own mutation"],
    [/\buse(State|Reducer|Memo|Callback)\b/, "accounts query owner must not own page/controller UI state or view models"],
    [/\b(writeAccountsMutationPayload|invalidateAccountsDumpedQueries|setQueryData|cancelQueries)\b/, "accounts query owner must delegate mutation writes and invalidation"],
    [/useTranslation|AccountsPageController|setQuery|setPlanFilter|setSelectedKey|envelopeData|readArray|accountEmail|accountKey|accountPlan|isActiveAccount/, "accounts query owner must not own page controller, locale formatting, or view model parsing"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "accounts query owner must use accounts service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "accounts query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/accounts/hooks/mutation.ts", mutation, [
    "useAccountsPageMutations",
    "useMutation",
    "useQueryClient",
    "accountsService.beginAddAccountAttachMonitor",
    "accountsService.refreshUsageSnapshot",
    "accountsService.switchAccount",
    "accountsService.switchAccountAndRestartCodex",
    "accountsService.removeAccounts",
    "accountsService.logout",
    "accountsService.importChatGptSessionAccount",
    "accountsService.exportAccountsToFile",
    "accountsService.previewAccountImport",
    "accountsService.importAccountsFromFile",
    "writeAccountsMutationPayload",
    "writeAccountsSnapshotPayload",
    "invalidateAccountsDumpedQueries",
  ]);
  assertNotMatches("src/features/accounts/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "accounts mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo|Callback)\b/, "accounts mutation owner must not own page/controller UI state"],
    [/\bsetQueryData\b/, "accounts mutation owner must delegate cache writes to cache helper"],
    [/useTranslation|AccountsPageController|setQuery|setPlanFilter|setSelectedKey|envelopeData|readArray|accountEmail|accountPlan|isActiveAccount/, "accounts mutation owner must not own page controller, locale formatting, or view model parsing"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "accounts mutation owner must use accounts service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|useMutation<unknown/, "accounts mutation owner must keep typed mutation payloads"],
  ]);

  assertIncludes("src/features/accounts/hooks/action.ts", action, [
    "useAccountsPathActions",
    "accountsService.openPath",
  ]);
  assertNotMatches("src/features/accounts/hooks/action.ts", action, [
    [/\buse(Query|Mutation|QueryClient)\b/, "accounts action owner must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeAccounts|Accounts[A-Za-z]*QueryKeys)\b/, "accounts action owner must not write cache or consume query keys"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "accounts action owner must not bypass service wrapper"],
    [/useTranslation|AccountsPageController|setQuery|setPlanFilter|setSelectedKey|envelopeData|readArray/, "accounts action owner must not own page controller or UI view model"],
  ]);

  assertIncludes("src/features/accounts/hooks/page.ts", page, [
    "useAccountsPageController",
    "AccountsPageController",
    "useAccountsPageQueries",
    "useAccountsPageMutations",
    "useAccountsPathActions",
    "useState",
    "useMemo",
    "envelopeData",
    "readArray<AccountRecord>",
    "accountEmail",
    "accountKey",
    "accountPlan",
    "isActiveAccount",
  ]);
  assertNotMatches("src/features/accounts/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "accounts page/controller may compose split owner hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeAccounts|Accounts[A-Za-z]*QueryKeys)\b/, "accounts page/controller must not write cache, invalidate, cancel, or consume query keys"],
    [/@\/services\/accounts|@\/services\/system|@\/services\/maintenance|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|accountsService\.|systemService\.|maintenanceService\.|invokeIpc|invoke\(/, "accounts page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "accounts page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/accounts/types/index.ts", types, [
    "export type AccountsMutationPayload",
    "export type AccountsMutationEnvelope",
    "export type AccountsSnapshotEnvelope",
    "export type AccountsCachePayload",
    "export interface AccountsPageQueries",
    "export interface AccountsPageMutations",
    "export interface AccountsPathActions",
    "export interface AccountsModuleController",
    "export interface AccountsPageController",
  ]);
  assertNotMatches("src/features/accounts/types/index.ts", types, [
    [/AccountsPageController\s*=\s*ReturnType|ReturnType<typeof useAccountsPageController>|ReturnType<typeof useAccountsModule>/, "accounts controller contract must be explicit, not ReturnType"],
    [/AccountsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "accounts types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/accounts/cache/index.ts", cache, [
    "createModuleCacheOwner<AccountsCachePayload>(\"accounts\")",
    "AccountsDumpedQueryKeys",
    "AccountsAuthoritativeQueryKeys",
    "writeAccountsSnapshotPayload",
    "writeAccountsMutationPayload",
    "invalidateAccountsDumpedQueries",
    "setQueryData<ModuleCacheEnvelope<AccountsCachePayload>>",
    "mutationFenceAt",
    "isStaleEnvelope",
    "next.sequence < current.sequence",
  ]);
  assertNotMatches("src/features/accounts/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "accounts cache owner must not own React hooks"],
    [/@\/services\/accounts|@\/services\/system|@\/services\/maintenance|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|accountsService\.|systemService\.|maintenanceService\.|invokeIpc|invoke\(/, "accounts cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("accounts"\)|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "accounts cache owner must keep typed payloads"],
  ]);

  if (
    controllerConsumerText.includes("ReturnType<typeof useAccountsPageController>") ||
    controllerConsumerText.includes("ReturnType<typeof useAccountsModule>")
  ) {
    failures.push("src/features/accounts panels/dialogs/components must consume explicit Accounts controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+Accounts[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/accounts panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS accounts deep owner gate executed: hooks/index, query, mutation, action, page, cache, types, panels/dialogs/components");
}

function validateSessionsDeepOwnerBoundaries() {
  const sessionsRoot = join(featuresRoot, "sessions");
  const hooksIndexPath = join(sessionsRoot, "hooks", "index.ts");
  const queryPath = join(sessionsRoot, "hooks", "query.ts");
  const mutationPath = join(sessionsRoot, "hooks", "mutation.ts");
  const pagePath = join(sessionsRoot, "hooks", "page.ts");
  const cachePath = join(sessionsRoot, "cache", "index.ts");
  const typesPath = join(sessionsRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(sessionsRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(sessionsRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(sessionsRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((file) => readRequired(file))
    .join("\n");

  assertOnlyBarrelReExports("src/features/sessions/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "page",
  ]);
  assertNotMatches("src/features/sessions/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback|useRef)\b/, "sessions hooks/index can only re-export split owners"],
    [/\b(writeSessions|writeAnalytics|fenceAnalytics|setQueryData|invalidateQueries|cancelQueries|Sessions[A-Za-z]*QueryKeys|Analytics[A-Za-z]*QueryKeys)\b/, "sessions hooks/index must not own cache writes or query keys"],
    [/@\/services\/sessions|@\/services\/analytics|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|sessionsService\.|analyticsService\.|invokeIpc|invoke\(/, "sessions hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/sessions/hooks/query.ts", query, [
    "SessionsCacheEnvelope",
    "useSessionsCacheController",
    "useModuleCacheController(SessionsCache)",
    "useSessionsPageQueries",
    "useQuery",
    "useQueryClient",
    "SessionsAuthoritativeQueryKeys",
    "SessionsDumpedQueryKeys",
    "AnalyticsAuthoritativeQueryKeys",
    "AnalyticsDumpedQueryKeys",
    "sessionsService.loadSessions",
    "analyticsService.loadUsageAnalytics",
    "writeSessionsListPayload",
    "writeAnalyticsPanelPayload",
  ]);
  assertNotMatches("src/features/sessions/hooks/query.ts", query, [
    [/\buseMutation\b/, "sessions query owner must not own mutation"],
    [/\buse(State|Reducer|Memo|Callback)\b/, "sessions query owner must not own page/controller UI state or view models"],
    [/\b(writeSessionsMutationPayload|invalidateSessionsDumpedQueries|fenceAnalyticsPanelPayload|setQueryData|cancelQueries)\b/, "sessions query owner must delegate mutation writes, fences, and invalidation"],
    [/useTranslation|SessionsPageController|SessionsModuleController|setSelected|setExpanded|setFocused|deleteRequest|setDeleteRequest|buildSessionGroups|countOrphans|flattenGroups|formatBytes|readNumber|selectDeletedSessionIds/, "sessions query owner must not own page controller, locale formatting, view model, or delete dialog state"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "sessions query owner must use sessions/analytics service wrappers, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>|response\.data/, "sessions query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/sessions/hooks/mutation.ts", mutation, [
    "SessionsDeleteEnvelope",
    "useSessionsPageMutations",
    "useMutation",
    "useQueryClient",
    "sessionsService.deleteSessions",
    "writeSessionsMutationPayload",
    "fenceAnalyticsPanelPayload",
    "invalidateSessionsDumpedQueries",
  ]);
  if (!/refreshPromiseRef|singleFlight|refreshPromise/.test(mutation)) {
    failures.push("src/features/sessions/hooks/mutation.ts must own single-flight refresh");
  }
  assertNotMatches("src/features/sessions/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "sessions mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo|Callback)\b/, "sessions mutation owner must not own page/controller UI state"],
    [/\bsetQueryData\b/, "sessions mutation owner must delegate cache writes to cache helper"],
    [/useTranslation|SessionsPageController|setSelected|setExpanded|setFocused|deleteRequest|setDeleteRequest|buildSessionGroups|countOrphans|flattenGroups|formatBytes|readNumber/, "sessions mutation owner must not own page controller, locale formatting, view model, or delete dialog state"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "sessions mutation owner must use sessions service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>|useMutation<unknown|Promise<unknown>|response\.data/, "sessions mutation owner must keep typed mutation payloads"],
  ]);

  assertIncludes("src/features/sessions/hooks/page.ts", page, [
    "useSessionsModule",
    "SessionsModuleController",
    "useSessionsPageController",
    "SessionsPageController",
    "useSessionsPageQueries",
    "useSessionsPageMutations",
    "useState",
    "useMemo",
    "useTranslation",
    "buildSessionGroups",
    "countOrphans",
    "flattenGroups",
    "formatBytes",
    "readNumber",
    "selectDeletedSessionIds",
    "deleteRequest",
  ]);
  assertNotMatches("src/features/sessions/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "sessions page/controller may compose split owner hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeSessions|writeAnalytics|fenceAnalytics|Sessions[A-Za-z]*QueryKeys|Analytics[A-Za-z]*QueryKeys)\b/, "sessions page/controller must not write cache, invalidate, cancel, or consume query keys"],
    [/@\/services\/sessions|@\/services\/analytics|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|sessionsService\.|analyticsService\.|invokeIpc|invoke\(/, "sessions page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>|response\.data/, "sessions page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/sessions/types/index.ts", types, [
    "export type SessionsListEnvelope",
    "export type SessionsDeleteEnvelope",
    "export type SessionsMutationPayload",
    "export type SessionsMutationEnvelope",
    "export type SessionsCachePayload",
    "export interface SessionsModuleController",
    "export interface SessionsPageQueries",
    "export interface SessionsPageMutations",
    "export interface SessionsPageController",
  ]);
  assertNotMatches("src/features/sessions/types/index.ts", types, [
    [/Sessions[A-Za-z]*(?:Controller|Queries|Mutations)\s*=\s*ReturnType|ReturnType<typeof useSessions[A-Za-z]*/, "sessions controller contracts must be explicit, not hook ReturnType"],
    [/SessionsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>/, "sessions types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/sessions/cache/index.ts", cache, [
    "createModuleCacheOwner<SessionsCachePayload>(\"sessions\")",
    "SessionsDumpedQueryKeys",
    "SessionsAuthoritativeQueryKeys",
    "writeSessionsListPayload",
    "writeSessionsMutationPayload",
    "invalidateSessionsDumpedQueries",
    "setQueryData<ModuleCacheEnvelope<SessionsCachePayload>>",
    "mutationFenceAt",
    "isStaleEnvelope",
    "next.sequence < current.sequence",
  ]);
  assertNotMatches("src/features/sessions/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback|Ref)\b/, "sessions cache owner must not own React hooks"],
    [/@\/services\/sessions|@\/services\/analytics|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|sessionsService\.|analyticsService\.|invokeIpc|invoke\(/, "sessions cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("sessions"\)|ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>/, "sessions cache owner must keep typed payloads"],
  ]);

  if (
    controllerConsumerText.includes("ReturnType<typeof useSessionsPageController>") ||
    controllerConsumerText.includes("ReturnType<typeof useSessionsModule>")
  ) {
    failures.push("src/features/sessions panels/dialogs/components must consume explicit Sessions controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+Sessions[A-Za-z]*(?:Controller|Props|Queries|Mutations)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/sessions panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS sessions deep owner gate executed: hooks/index, query, mutation, page, cache, types, panels/dialogs/components");
}

function validateAnalyticsDeepOwnerBoundaries() {
  const analyticsRoot = join(featuresRoot, "analytics");
  const hooksIndexPath = join(analyticsRoot, "hooks", "index.ts");
  const queryPath = join(analyticsRoot, "hooks", "query.ts");
  const pagePath = join(analyticsRoot, "hooks", "page.ts");
  const cachePath = join(analyticsRoot, "cache", "index.ts");
  const typesPath = join(analyticsRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(analyticsRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(analyticsRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(analyticsRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((file) => readRequired(file))
    .join("\n");

  assertOnlyBarrelReExports("src/features/analytics/hooks/index.ts", hooksIndex, [
    "query",
    "page",
  ]);
  assertNotMatches("src/features/analytics/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "analytics hooks/index can only re-export split owners"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeAnalytics|fenceAnalytics|Analytics[A-Za-z]*QueryKeys)\b/, "analytics hooks/index must not own cache writes or query keys"],
    [/@\/services\/analytics|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|analyticsService\.|invokeIpc|invoke\(/, "analytics hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/analytics/hooks/query.ts", query, [
    "useAnalyticsCacheController",
    "useModuleCacheController(AnalyticsCache)",
    "useAnalyticsModule",
    "useQuery",
    "useQueryClient",
    "analyticsService.loadUsageAnalytics",
    "analyticsService.loadSessionAnalytics",
    "analyticsService.loadTokenAnalytics",
    "analyticsService.loadToolAnalytics",
    "analyticsService.loadChangeAnalytics",
    "analyticsService.loadQuotaHistory",
    "AnalyticsAuthoritativeQueryKeys",
    "AnalyticsDumpedQueryKeys",
    "writeAnalyticsPanelPayload",
    "AnalyticsCacheEnvelope<AnalyticsUsageEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsSessionEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsTokenEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsToolEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsChangeEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsQuotaEnvelope>",
  ]);
  assertNotMatches("src/features/analytics/hooks/query.ts", query, [
    [/\buseMutation\b/, "analytics query owner must not own mutation"],
    [/\buse(State|Reducer|Memo)\b/, "analytics query owner must not own page/controller UI state or view models"],
    [/useTranslation|formatInvokeError|build[A-Za-z]*(Panel|Model)|AnalyticsPageController|setActivePanel|setRange|setActivityRange|setQuotaAccountKey/, "analytics query owner must not own page controller, locale formatting, or panel view models"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "analytics query owner must use analytics service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "analytics query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/analytics/hooks/page.ts", page, [
    "useAnalyticsPageController",
    "AnalyticsPageController",
    "useAnalyticsModule",
    "useState",
    "useMemo",
    "useTranslation",
    "PANELS",
    "ANALYTICS_RANGES",
    "ACTIVITY_RANGES",
    "buildActivityPanel",
    "buildSessionsPanel",
    "buildTokenPanel",
    "buildToolsPanel",
    "buildChangesPanel",
    "buildQuotaPanel",
  ]);
  assertNotMatches("src/features/analytics/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "analytics page/controller may compose query hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeAnalytics|fenceAnalytics|Analytics[A-Za-z]*QueryKeys)\b/, "analytics page/controller must not write cache, invalidate, cancel, or consume query keys"],
    [/@\/services\/analytics|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|analyticsService\.|invokeIpc|invoke\(/, "analytics page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "analytics page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/analytics/types/index.ts", types, [
    "export type AnalyticsUsageEnvelope",
    "export type AnalyticsSessionEnvelope",
    "export type AnalyticsTokenEnvelope",
    "export type AnalyticsToolEnvelope",
    "export type AnalyticsChangeEnvelope",
    "export type AnalyticsQuotaEnvelope",
    "export type AnalyticsCachePayload",
    "export interface AnalyticsPageController",
  ]);
  assertNotMatches("src/features/analytics/types/index.ts", types, [
    [/AnalyticsPageController\s*=\s*ReturnType|ReturnType<typeof useAnalyticsPageController>/, "analytics controller contract must be explicit, not ReturnType"],
    [/AnalyticsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "analytics types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/analytics/cache/index.ts", cache, [
    "createModuleCacheOwner<AnalyticsCachePayload>(\"analytics\")",
    "AnalyticsDumpedQueryKeys",
    "AnalyticsAuthoritativeQueryKeys",
    "writeAnalyticsPanelPayload",
    "setQueryData<ModuleCacheEnvelope<AnalyticsCachePayload>>",
    "mutationFenceAt",
    "isStaleEnvelope",
    "next.sequence < current.sequence",
  ]);
  assertNotMatches("src/features/analytics/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "analytics cache owner must not own React hooks"],
    [/@\/services\/analytics|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|analyticsService\.|invokeIpc|invoke\(/, "analytics cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("analytics"\)|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "analytics cache owner must keep typed payloads"],
  ]);

  if (controllerConsumerText.includes("ReturnType<typeof useAnalyticsPageController>")) {
    failures.push("src/features/analytics panels/dialogs/components must consume explicit Analytics controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+Analytics[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/analytics panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS analytics deep owner gate executed: hooks/index, query, page, cache, types, panels/dialogs/components");
}

function validateCustomInstructionsDeepOwnerBoundaries() {
  const customInstructionsRoot = join(featuresRoot, "custom-instructions");
  const hooksIndexPath = join(customInstructionsRoot, "hooks", "index.ts");
  const queryPath = join(customInstructionsRoot, "hooks", "query.ts");
  const mutationPath = join(customInstructionsRoot, "hooks", "mutation.ts");
  const actionPath = join(customInstructionsRoot, "hooks", "action.ts");
  const pagePath = join(customInstructionsRoot, "hooks", "page.ts");
  const cachePath = join(customInstructionsRoot, "cache", "index.ts");
  const typesPath = join(customInstructionsRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(customInstructionsRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(customInstructionsRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(customInstructionsRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const action = readRequired(actionPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((file) => readRequired(file))
    .join("\n");

  const hooksIndexReExportPattern =
    /export\s+(type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']([^"']+)["'];?/g;
  const hooksIndexReExports = [...hooksIndex.matchAll(hooksIndexReExportPattern)].map(
    (match) => ({ typeOnly: Boolean(match[1]), path: match[2] }),
  );
  const hooksIndexRemainder = hooksIndex
    .replace(hooksIndexReExportPattern, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
  const hooksIndexAllowedReExports = new Set([
    "./query",
    "./mutation",
    "./action",
    "./page",
    "../types",
  ]);
  if (hooksIndexRemainder) {
    failures.push("src/features/custom-instructions/hooks/index.ts 只能作为 re-export barrel，不得包含 hook 实现、cache 写入或 page controller");
  }
  for (const owner of ["query", "mutation", "action", "page"]) {
    if (!hooksIndexReExports.some((item) => item.path === `./${owner}`)) {
      failures.push(`src/features/custom-instructions/hooks/index.ts 必须 re-export ./${owner} owner`);
    }
  }
  for (const reExport of hooksIndexReExports) {
    if (!hooksIndexAllowedReExports.has(reExport.path)) {
      failures.push(`src/features/custom-instructions/hooks/index.ts 不得导出 ${reExport.path}`);
    }
    if (reExport.path === "../types" && !reExport.typeOnly) {
      failures.push("src/features/custom-instructions/hooks/index.ts 只能从 ../types re-export 显式 controller 类型");
    }
  }
  assertNotMatches("src/features/custom-instructions/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "custom-instructions hooks/index can only re-export split owners"],
    [/\b(runCustomInstructionsStateQuery|writeCustomInstructions|setQueryData|invalidateQueries|cancelQueries|CUSTOM_INSTRUCTION_[A-Z0-9_]+_QUERY_KEY)\b/, "custom-instructions hooks/index must not own query keys or cache writes"],
    [/@\/services\/custom-instructions|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|customInstructionsService\.|systemService\.|invokeIpc|invoke\(/, "custom-instructions hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/custom-instructions/hooks/query.ts", query, [
    "useCustomInstructionsCacheController",
    "useModuleCacheController(CustomInstructionsCache)",
    "useCustomInstructionQueries",
    "useQuery",
    "useQueryClient",
    "CUSTOM_INSTRUCTION_STATE_QUERY_KEY",
    "CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY",
    "runCustomInstructionsStateQuery",
    "customInstructionsService.loadState",
    "mergeCustomInstructionTemplates",
  ]);
  assertNotMatches("src/features/custom-instructions/hooks/query.ts", query, [
    [/\buseMutation\b/, "custom-instructions query owner must not own mutation"],
    [/\buse(State|Reducer|Memo|Callback)\b/, "custom-instructions query owner must not own page/controller UI state or view models"],
    [/\b(writeCustomInstructionsStateMutationPayload|invalidateCustomInstructionsContractQueries|setQueryData|cancelQueries)\b/, "custom-instructions query owner must delegate mutation writes and invalidation"],
    [/toast\(|useTranslation|useBusyAction|CustomInstructionsPageController|loadErrorPanel|setDraftContent|setPreview|setPendingApply/, "custom-instructions query owner must not own page controller, locale formatting, busy actions, or dialog state"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "custom-instructions query owner must use module service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "custom-instructions query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/custom-instructions/hooks/mutation.ts", mutation, [
    "useCustomInstructionMutations",
    "useMutation",
    "useQueryClient",
    "customInstructionsService.previewApply",
    "customInstructionsService.apply",
    "customInstructionsService.clearBlock",
    "customInstructionsService.rollback",
    "writeCustomInstructionsStateMutationPayload",
    "cancelQueries",
  ]);
  assertNotMatches("src/features/custom-instructions/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "custom-instructions mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo|Callback)\b/, "custom-instructions mutation owner must not own page/controller UI state"],
    [/\b(setQueryData|invalidateQueries)\b/, "custom-instructions mutation owner must delegate cache writes and invalidation to cache helper"],
    [/toast\(|useTranslation|useBusyAction|CustomInstructionsPageController|setDraftContent|setPreview|setPendingApply|previewOpen|clearOpen/, "custom-instructions mutation owner must not own page controller, locale formatting, busy actions, or dialog state"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "custom-instructions mutation owner must use module service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|useMutation<unknown|Promise<unknown>/, "custom-instructions mutation owner must keep typed mutation payloads"],
  ]);

  assertIncludes("src/features/custom-instructions/hooks/action.ts", action, [
    "useCustomInstructionPathActions",
    "customInstructionsService.openPath",
  ]);
  assertNotMatches("src/features/custom-instructions/hooks/action.ts", action, [
    [/\buse(Query|Mutation|QueryClient)\b/, "custom-instructions action owner must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|runCustomInstructionsStateQuery|writeCustomInstructions|CUSTOM_INSTRUCTION_[A-Z0-9_]+_QUERY_KEY)\b/, "custom-instructions action owner must not write cache or consume query keys"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "custom-instructions action owner must not bypass service wrapper"],
    [/toast\(|useTranslation|useBusyAction|CustomInstructionsPageController|setDraftContent|setPreview|setPendingApply/, "custom-instructions action owner must not own page controller or UI feedback"],
  ]);

  assertIncludes("src/features/custom-instructions/hooks/page.ts", page, [
    "useCustomInstructionsPageController",
    "CustomInstructionsPageController",
    "useCustomInstructionQueries",
    "useCustomInstructionMutations",
    "useCustomInstructionPathActions",
    "useState",
    "useMemo",
    "useTranslation",
    "useBusyAction",
    "stateQuery.isError",
    "templatesQuery.isError",
    "loadErrorPanel",
  ]);
  assertNotMatches("src/features/custom-instructions/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "custom-instructions page/controller may compose split hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|runCustomInstructionsStateQuery|writeCustomInstructions|CUSTOM_INSTRUCTION_[A-Z0-9_]+_QUERY_KEY)\b/, "custom-instructions page/controller must not write cache, invalidate, cancel, or consume query keys"],
    [/@\/services\/custom-instructions|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|customInstructionsService\.|systemService\.|invokeIpc|invoke\(/, "custom-instructions page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|response\.data/, "custom-instructions page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/custom-instructions/types/index.ts", types, [
    "export type CustomInstructionsStateQueryKey",
    "export type CustomInstructionsTemplatesQueryKey",
    "export type CustomInstructionsCachePayload",
    "export type CustomInstructionsCacheEnvelope",
    "export interface CustomInstructionsPageController",
  ]);
  assertIncludes("src/features/custom-instructions/types/index.ts", types, [
    "export interface CustomInstructionsHeaderPanelController",
    "export interface CustomInstructionsLoadErrorPanelController",
    "export interface CustomInstructionsConfigurePanelController",
    "export interface CustomInstructionsTemplatesPanelController",
    "export interface CustomInstructionsBodyPanelController",
    "export interface CustomInstructionsPreviewDialogController",
    "export interface CustomInstructionsClearDialogController",
  ]);
  assertNotMatches("src/features/custom-instructions/types/index.ts", types, [
    [/CustomInstructionsPageController\s*=\s*ReturnType|ReturnType<typeof useCustomInstructionsPageController>/, "custom-instructions controller contract must be explicit, not ReturnType"],
    [/CustomInstructionsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "custom-instructions types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/custom-instructions/cache/index.ts", cache, [
    "createModuleCacheOwner<CustomInstructionsCachePayload>(\"custom-instructions\")",
    "Omit<CustomInstructionsCacheEnvelope<TPayload>, \"moduleId\">",
    "CUSTOM_INSTRUCTION_STATE_QUERY_KEY",
    "CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY",
    "writeCustomInstructionsAuthoritativePayload",
    "writeCustomInstructionsStatePayload",
    "runCustomInstructionsStateQuery",
    "writeCustomInstructionsStateMutationPayload",
    "invalidateCustomInstructionsContractQueries",
    "setQueryData<CustomInstructionStatePayload>",
  ]);
  if (
    !cache.includes("nextCustomInstructionsCacheSequence") ||
    !(
      cache.includes("customInstructionsLatestAcceptedSequence") ||
      cache.includes("sequence <")
    )
  ) {
    failures.push("src/features/custom-instructions/cache/index.ts must own sequence/stale/delayed response protection");
  }
  assertNotMatches("src/features/custom-instructions/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "custom-instructions cache owner must not own React hooks"],
    [/@\/services\/custom-instructions|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|customInstructionsService\.|systemService\.|invokeIpc|invoke\(/, "custom-instructions cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("custom-instructions"\)|CustomInstructionsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "custom-instructions cache owner must keep typed payloads"],
  ]);

  if (controllerConsumerText.includes("ReturnType<typeof useCustomInstructionsPageController>")) {
    failures.push("src/features/custom-instructions panels/dialogs/components must consume explicit CustomInstructions controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+CustomInstructions[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/custom-instructions panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS custom-instructions deep owner gate executed: hooks/index, query, mutation, action, page, cache, types, panels/dialogs/components");
}

function validateMcpDeepOwnerBoundaries() {
  const mcpRoot = join(featuresRoot, "mcp");
  const hooksIndexPath = join(mcpRoot, "hooks", "index.ts");
  const queryPath = join(mcpRoot, "hooks", "query.ts");
  const mutationPath = join(mcpRoot, "hooks", "mutation.ts");
  const pagePath = join(mcpRoot, "hooks", "page.ts");
  const cachePath = join(mcpRoot, "cache", "index.ts");
  const sequencePath = join(mcpRoot, "cache", "sequence.ts");
  const typesPath = join(mcpRoot, "types", "index.ts");
  const panelPaths = [
    join(mcpRoot, "panels", "overview.tsx"),
    join(mcpRoot, "panels", "servers.tsx"),
    join(mcpRoot, "dialogs", "editor.tsx"),
    join(mcpRoot, "dialogs", "remove.tsx"),
  ];
  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const cacheSequence = existsSync(sequencePath) ? readRequired(sequencePath) : "";
  const types = readRequired(typesPath);
  const panelOwnerText = panelPaths.map((file) => readRequired(file)).join("\n");
  const cacheOwnerText = `${cache}\n${cacheSequence}`;

  const barrelRemainder = hooksIndex
    .replace(/export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["'][^"']+["'];?/g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  if (barrelRemainder) {
    failures.push("src/features/mcp/hooks/index.ts 只能作为 re-export barrel，不得包含 hook 实现、cache 写入或 page controller");
  }
  for (const ownerFile of ["query", "mutation", "page"]) {
    if (!hooksIndex.includes(`from "./${ownerFile}"`) && !hooksIndex.includes(`from './${ownerFile}'`)) {
      failures.push(`src/features/mcp/hooks/index.ts 必须 re-export ./${ownerFile} owner`);
    }
  }
  assertNotMatches("src/features/mcp/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "mcp hooks/index 只能聚合 re-export，不得 owning query/mutation/controller"],
    [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "mcp hooks/index 不得 owning TanStack cache 操作"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "mcp hooks/index 不得直接拼底层 IPC transport"],
  ]);

  assertIncludes("src/features/mcp/hooks/query.ts", query, [
    "useQuery",
    "useQueryClient",
    "MCP_SERVERS_QUERY_KEY",
    "mcpService.loadServers",
    "writeMcpCachePayload",
  ]);
  assertNotMatches("src/features/mcp/hooks/query.ts", query, [
    [/\buseMutation\b/, "mcp query owner 不得 owning mutation"],
    [/\buse(State|Reducer)\b/, "mcp query owner 不得 owning 页面短生命周期 UI state"],
    [/\b(setQueryData|cancelQueries)\b/, "mcp query owner 不得 owning mutation cache 写入或取消"],
    [/toast\(|navigator\.clipboard/, "mcp query owner 不得 owning toast 或剪贴板 UI 组合"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "mcp query owner 必须经 mcp service wrapper，不得直接拼 IPC"],
  ]);

  assertIncludes("src/features/mcp/hooks/mutation.ts", mutation, [
    "useMutation",
    "useQueryClient",
    "mcpService.setServerEnabled",
    "mcpService.removeServer",
    "mcpService.upsertServer",
    "writeMcpMutationPayload",
    "cancelQueries",
  ]);
  assertNotMatches("src/features/mcp/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "mcp mutation owner 不得 owning query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "mcp mutation owner 不得 owning page/controller UI state"],
    [/\b(setQueryData|invalidateQueries)\b/, "mcp mutation owner 必须把 cache 写入和失效交给 cache helper"],
    [/toast\(|navigator\.clipboard/, "mcp mutation owner 不得 owning toast 或剪贴板 UI 组合"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "mcp mutation owner 必须经 mcp service wrapper，不得直接拼 IPC"],
  ]);

  assertIncludes("src/features/mcp/hooks/page.ts", page, [
    "useMcpPageController",
    "McpPageController",
    "useState",
    "createMcpServerFormDraft",
    "getMcpPagination",
    "useMcpServers",
    "useMcpServerMutations",
    "useUpsertMcpServerMutation",
    "toast",
  ]);
  assertNotMatches("src/features/mcp/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "mcp page/controller 只能组合 query/mutation hook，不得直接 owning TanStack"],
    [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "mcp page/controller 不得直接写 cache、失效 query 或取消 query"],
    [/@\/services\/mcp|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "mcp page/controller 不得直接拼底层 IPC transport 或 service wrapper"],
  ]);
  assertIncludes("src/features/mcp/types/index.ts", types, [
    "export interface McpPageController",
    "export interface McpOverviewController",
    "export interface McpServersController",
    "export interface McpPaginationController",
    "export interface McpEditorController",
    "export interface McpRemoveController",
  ]);
  if (panelOwnerText.includes("ReturnType<typeof useMcpPageController>") || panelOwnerText.includes("../hooks")) {
    failures.push("src/features/mcp/panels 和 dialogs 必须消费 types controller 合同，不得反向依赖 hooks ReturnType");
  }

  assertIncludes("src/features/mcp/cache/index.ts", cache, [
    "createModuleCacheOwner<McpCachePayload>(\"mcp\")",
    "MCP_SERVERS_QUERY_KEY",
    "writeMcpAuthoritativePayload",
    "writeMcpCachePayload",
    "writeMcpMutationPayload",
    "setQueryData<McpListEnvelope>",
    "invalidateMcpContractQueries",
    "invalidateQueries({ queryKey: MCP_SERVERS_QUERY_KEY })",
  ]);
  if (
    !cacheOwnerText.includes("nextMcpCacheSequence") ||
    !(
      cacheOwnerText.includes("acceptMcpCacheSequence") ||
      cacheOwnerText.includes("mcpLatestAcceptedSequence") ||
      cacheOwnerText.includes("sequence <")
    )
  ) {
    failures.push("src/features/mcp/cache/index.ts 必须托管 mutation payload sequence 或等价 stale/delayed response 防护");
  }
  assertNotMatches("src/features/mcp/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "mcp cache owner 不得 owning React hook"],
    [/@\/services\/mcp|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "mcp cache owner 不得直接拼 IPC 或调用 service"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "mcp cache owner 必须保留 typed payload"],
  ]);

  console.log("PASS mcp 深层 owner 边界门禁已执行：hooks/index、query、mutation、page、cache");
}

function validatePluginsDeepOwnerBoundaries() {
  const pluginsRoot = join(featuresRoot, "plugins");
  const hooksIndexPath = join(pluginsRoot, "hooks", "index.ts");
  const queryPath = join(pluginsRoot, "hooks", "query.ts");
  const refreshPath = join(pluginsRoot, "hooks", "refresh.ts");
  const mutationPath = join(pluginsRoot, "hooks", "mutation.ts");
  const pagePath = join(pluginsRoot, "hooks", "page.ts");
  const cachePath = join(pluginsRoot, "cache", "index.ts");
  const sequencePath = join(pluginsRoot, "cache", "sequence.ts");
  const typesPath = join(pluginsRoot, "types", "index.ts");
  const componentPagePath = join(pluginsRoot, "components", "page.tsx");
  const panelPagePath = join(pluginsRoot, "panels", "page.tsx");
  const dialogsIndexPath = join(pluginsRoot, "dialogs", "index.ts");
  const panelPaths = [
    ...walkFiles(join(pluginsRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(pluginsRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const refresh = readRequired(refreshPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const cacheSequence = existsSync(sequencePath) ? readRequired(sequencePath) : "";
  const types = readRequired(typesPath);
  const componentPage = readRequired(componentPagePath);
  const panelPage = readRequired(panelPagePath);
  const dialogsIndex = readRequired(dialogsIndexPath);
  const panelOwnerText = panelPaths.map((file) => readRequired(file)).join("\n");
  const cacheOwnerText = `${cache}\n${cacheSequence}`;

  assertOnlyBarrelReExports("src/features/plugins/hooks/index.ts", hooksIndex, [
    "query",
    "refresh",
    "mutation",
    "page",
  ]);
  assertNotMatches("src/features/plugins/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "plugins hooks/index 只能聚合 re-export，不得 owning query/mutation/controller"],
    [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "plugins hooks/index 不得 owning TanStack cache 操作"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "plugins hooks/index 不得直接拼底层 IPC transport"],
  ]);

  assertIncludes("src/features/plugins/hooks/query.ts", query, [
    "useQuery",
    "useQueryClient",
    "useModuleCacheController",
    "PluginsCache",
    "PLUGINS_LIST_QUERY_KEY",
    "pluginsService.list",
    "writePluginsListQueryPayload",
    "usePluginConfigQuery",
    "pluginsService.getConfig",
    "getPluginsConfigQueryKey",
    "writePluginsConfigQueryPayload",
  ]);
  assertNotMatches("src/features/plugins/hooks/query.ts", query, [
    [/\buseMutation\b/, "plugins query owner 不得 owning mutation 或 refresh mutation"],
    [/\buse(State|Reducer)\b/, "plugins query owner 不得 owning 页面短生命周期 UI state"],
    [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "plugins query owner 不得 owning cache 写入、失效或取消"],
    [/toast\(|useToast|navigator\.clipboard/, "plugins query owner 不得 owning toast 或 UI 组合"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "plugins query owner 必须经 plugins service wrapper，不得直接拼 IPC"],
  ]);

  assertIncludes("src/features/plugins/hooks/refresh.ts", refresh, [
    "useMutation",
    "useQueryClient",
    "pluginsService.list",
    "nextPluginsCacheSequence",
    "writePluginsRefreshPayload",
  ]);
  if (!/nextPluginsCacheSequence\(\)[\s\S]*pluginsService\.list\(\)/.test(refresh)) {
    failures.push("src/features/plugins/hooks/refresh.ts 必须在请求发起前分配 refresh sequence");
  }
  assertNotMatches("src/features/plugins/hooks/refresh.ts", refresh, [
    [/\buseQuery\b/, "plugins refresh owner 不得 owning list query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "plugins refresh owner 不得 owning page/controller UI state"],
    [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "plugins refresh owner 必须把 cache 写入、失效和取消交给 cache helper"],
    [/writePluginsMutationPayload|optimisticallyUpdatePluginsToggle|rollbackPluginsToggle/, "plugins refresh owner 不得 owning toggle mutation payload、optimistic update 或 rollback"],
    [/pluginsService\.(getConfig|updateConfig)|getPluginConfig|updatePluginConfig/, "plugins refresh owner 不得消费 config service"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "plugins refresh owner 必须经 plugins service wrapper，不得直接拼 IPC"],
  ]);

  assertIncludes("src/features/plugins/hooks/mutation.ts", mutation, [
    "useMutation",
    "useQueryClient",
    "pluginsService.toggle",
    "optimisticallyUpdatePluginsToggle",
    "rollbackPluginsToggle",
    "writePluginsMutationPayload",
    "usePluginsConfigMutation",
    "pluginsService.updateConfig",
    "beginPluginsConfigMutation",
    "rollbackPluginsConfig",
  ]);
  assertNotMatches("src/features/plugins/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "plugins mutation owner 不得 owning query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "plugins mutation owner 不得 owning page/controller UI state"],
    [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "plugins mutation owner 必须把 optimistic update、rollback、cache 写入和失效交给 cache helper"],
    [/writePluginsRefreshPayload|pluginsService\.list/, "plugins mutation owner 不得 owning refresh/list 请求"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "plugins mutation owner 必须经 plugins service wrapper，不得直接拼 IPC"],
  ]);

  assertIncludes("src/features/plugins/hooks/page.ts", page, [
    "usePluginsPageController",
    "PluginsPageController",
    "usePluginsListQuery",
    "usePluginsRefreshMutation",
    "usePluginsToggleMutation",
    "usePluginConfigQuery",
    "usePluginsConfigMutation",
    "selectedPluginId",
    "selectedPlugin",
    "configDraft",
    "configErrorKey",
    "setConfigDraft",
    "saveConfig",
  ]);
  assertNotMatches("src/features/plugins/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "plugins page/controller 只能组合 query/refresh/mutation hook，不得直接 owning TanStack"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|nextPluginsCacheSequence|writePlugins|PLUGINS_LIST_QUERY_KEY)\b/, "plugins page/controller 不得直接写 cache、失效 query、分配 sequence 或消费 query key"],
    [/@\/services\/plugins|@\/services\/runtime-extensions|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|pluginsService|invokeIpc|invoke\(/, "plugins page/controller 不得直接访问 service、API 或 IPC"],
  ]);

  assertIncludes("src/features/plugins/types/index.ts", types, [
    "export interface PluginsPageController",
    "export interface PluginsPageAction",
    "export interface PluginsTogglePluginAction",
    "export interface PluginsPagePanelProps",
    "export interface PluginsConfigPanelController",
    "selectedPluginId",
    "selectedPlugin",
    "configQuery",
    "configDraft",
    "configErrorKey",
    "canSaveConfig",
    "setConfigDraft",
    "saveConfig",
  ]);
  if (
    panelOwnerText.includes("ReturnType<typeof usePluginsPageController>") ||
    panelOwnerText.includes("../hooks")
  ) {
    failures.push("src/features/plugins/panels 和 dialogs 必须消费 types controller 合同，不得反向依赖 hooks ReturnType");
  }

  assertIncludes("src/features/plugins/cache/index.ts", cache, [
    "createModuleCacheOwner<PluginsCachePayload>(\"plugins\")",
    "PLUGINS_LIST_QUERY_KEY",
    "writePluginsAuthoritativePayload",
    "writePluginsListQueryPayload",
    "writePluginsRefreshPayload",
    "optimisticallyUpdatePluginsToggle",
    "rollbackPluginsToggle",
    "writePluginsMutationPayload",
    "invalidatePluginsContractQueries",
    "invalidateQueries({ queryKey: PLUGINS_LIST_QUERY_KEY })",
    "PLUGINS_CONFIG_QUERY_ROOT",
    "getPluginsConfigQueryKey",
    "writePluginsConfigQueryPayload",
    "beginPluginsConfigMutation",
    "rollbackPluginsConfig",
    "isPluginsConfigEnvelope",
    "queryClient.setQueryData(getPluginsConfigQueryKey",
    "invalidateQueries({ queryKey: PLUGINS_CONFIG_QUERY_ROOT })",
  ]);
  if (
    !cacheOwnerText.includes("nextPluginsCacheSequence") ||
    !(
      cacheOwnerText.includes("pluginsLatestAcceptedSequence") ||
      cacheOwnerText.includes("acceptPluginsCacheSequence") ||
      cacheOwnerText.includes("sequence <")
    )
  ) {
    failures.push("src/features/plugins/cache/index.ts 或 cache/sequence.ts 必须托管 sequence/stale/delayed response 防护");
  }
  assertNotMatches("src/features/plugins/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "plugins cache owner 不得 owning React hook"],
    [/@\/services\/plugins|@\/services\/runtime-extensions|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "plugins cache owner 不得直接拼 IPC 或调用 service"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "plugins cache owner 必须保留 typed payload"],
  ]);

  assertIncludes("src/features/plugins/panels/page.tsx", panelPage, [
    "PluginsConfigSection",
    "Textarea",
    "Button",
    "selectedPlugin",
    "configDraft",
    "configErrorKey",
    "setConfigDraft",
    "saveConfig",
    "plugins.configJson",
    "plugins.saveConfig",
  ]);

  console.log("PASS plugins 深层 owner 边界门禁已执行：hooks/index、query、refresh、mutation、page、cache、types、panels");
}

function validateTrayShellDeepOwnerBoundaries() {
  const trayShellRoot = join(featuresRoot, "tray-shell");
  const hooksIndexPath = join(trayShellRoot, "hooks", "index.ts");
  const queryPath = join(trayShellRoot, "hooks", "query.ts");
  const mutationPath = join(trayShellRoot, "hooks", "mutation.ts");
  const pagePath = join(trayShellRoot, "hooks", "page.ts");
  const actionPath = join(trayShellRoot, "hooks", "action.ts");
  const cachePath = join(trayShellRoot, "cache", "index.ts");
  const typesPath = join(trayShellRoot, "types", "index.ts");
  const panelPaths = walkFiles(join(trayShellRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file));

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const panelOwnerText = panelPaths.map((file) => readRequired(file)).join("\n");

  assertOnlyBarrelReExports("src/features/tray-shell/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "page",
  ]);
  if (existsSync(actionPath)) {
    failures.push("src/features/tray-shell/hooks/action.ts 不得保留独立 action owner；focus main window action 必须归 hooks/mutation.ts");
  }
  assertNotMatches("src/features/tray-shell/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "tray-shell hooks/index 只能聚合 re-export，不得 owning query/mutation/controller"],
    [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "tray-shell hooks/index 不得 owning TanStack cache 操作"],
    [/@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "tray-shell hooks/index 不得直接访问 service、API 或 IPC"],
  ]);

  assertIncludes("src/features/tray-shell/hooks/query.ts", query, [
    "useTrayShellCacheController",
    "useModuleCacheController(TrayShellCache)",
    "useTrayShellNotificationQuery",
    "useQuery<TrayShellNotificationEnvelope>",
    "TRAY_SHELL_NOTIFICATION_CLIENT_QUERY_KEY",
    "systemService.getNotificationClientState()",
  ]);
  assertNotMatches("src/features/tray-shell/hooks/query.ts", query, [
    [/\buse(QueryClient|Mutation)\b/, "tray-shell query owner 只能 owning cache controller 和 notification query"],
    [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "tray-shell query owner 不得 owning mutation cache 写入、失效或取消"],
    [/systemService\.focusMainWindow|focus-main-window|TrayShellActionModel/, "tray-shell query owner 不得 owning focus main window action"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "tray-shell query owner 必须经 system service wrapper，不得直接拼 IPC"],
  ]);

  assertIncludes("src/features/tray-shell/hooks/mutation.ts", mutation, [
    "useTrayShellFocusMainWindowMutation",
    "useTrayShellFocusMainWindowAction",
    "TrayShellActionModel",
    "useMutation",
    "useQueryClient",
    "systemService.focusMainWindow()",
    "invalidateTrayShellContractQueries(queryClient)",
  ]);
  assertNotMatches("src/features/tray-shell/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "tray-shell mutation owner 不得 owning notification query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "tray-shell mutation owner 不得 owning page/controller UI state"],
    [/systemService\.getNotificationClientState|TRAY_SHELL_NOTIFICATION_CLIENT_QUERY_KEY/, "tray-shell mutation owner 不得 owning notification query service 或 query key"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "tray-shell mutation owner 必须经 system service wrapper，不得直接拼 IPC"],
  ]);

  assertIncludes("src/features/tray-shell/hooks/page.ts", page, [
    "useTrayShellPageController",
    "TrayShellPageController",
    "useTrayShellNotificationQuery",
    "useTrayShellFocusMainWindowAction",
    "selectTrayShellClient",
    "selectTrayShellReady",
  ]);
  assertNotMatches("src/features/tray-shell/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "tray-shell page/controller 只能组合 query/mutation hook，不得直接 owning TanStack"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|TRAY_SHELL_NOTIFICATION_CLIENT_QUERY_KEY|TrayShellCache)\b/, "tray-shell page/controller 不得直接写 cache、失效 query 或消费 query key/cache owner"],
    [/@\/services\/system|systemService\.|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "tray-shell page/controller 不得直接访问 service、API 或 IPC"],
  ]);

  assertIncludes("src/features/tray-shell/types/index.ts", types, [
    "export interface TrayShellPageController",
    "export type TrayShellMetricModel",
    "export type TrayShellRuntimeRowModel",
    "export interface TrayShellRuntimePanelModel",
    "export interface TrayShellActionModel",
    "export type TrayShellCachePayload",
    "export type TrayShellCacheEnvelope",
  ]);
  assertNotMatches("src/features/tray-shell/types/index.ts", types, [
    [/TrayShellCacheEnvelope<TPayload = unknown>|payload:\s*unknown/, "tray-shell types owner 必须保留 typed payload"],
    [/id:\s*string|labelKey:\s*string/, "tray-shell action/metric/runtime model 不得回退宽泛 string contract"],
  ]);

  assertIncludes("src/features/tray-shell/cache/index.ts", cache, [
    "createModuleCacheOwner<TrayShellCachePayload>(\"tray-shell\")",
    "Omit<TrayShellCacheEnvelope<TPayload>, \"moduleId\">",
    "TRAY_SHELL_NOTIFICATION_CLIENT_QUERY_KEY",
    "invalidateTrayShellContractQueries",
  ]);
  assertNotMatches("src/features/tray-shell/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "tray-shell cache owner 不得 owning React hook"],
    [/@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "tray-shell cache owner 不得直接访问 service、API 或 IPC"],
    [/createModuleCacheOwner\("tray-shell"\)|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "tray-shell cache owner 必须保留 typed payload"],
  ]);

  if (panelOwnerText.includes("ReturnType<typeof useTrayShellPageController>") || panelOwnerText.includes("../hooks")) {
    failures.push("src/features/tray-shell/panels 必须消费 types controller 合同，不得反向依赖 hooks ReturnType");
  }

  console.log("PASS tray-shell 深层 owner 边界门禁已执行：hooks/index、query、mutation、page、cache、types、panels");
}

function validateSettingsDeepOwnerBoundaries() {
  const settingsRoot = join(featuresRoot, "settings");
  const hooksIndexPath = join(settingsRoot, "hooks", "index.ts");
  const queryPath = join(settingsRoot, "hooks", "query.ts");
  const mutationPath = join(settingsRoot, "hooks", "mutation.ts");
  const actionPath = join(settingsRoot, "hooks", "action.ts");
  const pagePath = join(settingsRoot, "hooks", "page.ts");
  const cachePath = join(settingsRoot, "cache", "index.ts");
  const typesPath = join(settingsRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(settingsRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(settingsRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(settingsRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const action = readRequired(actionPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((file) => readRequired(file))
    .join("\n");

  assertOnlyBarrelReExports("src/features/settings/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "action",
    "page",
  ]);
  assertNotMatches("src/features/settings/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "settings hooks/index can only re-export split owners"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|beginSettingsMutation|writeSettings)/, "settings hooks/index must not own cache writes"],
    [/@\/services\/settings|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "settings hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/settings/hooks/query.ts", query, [
    "useSettingsCacheController",
    "useModuleCacheController(SettingsCache)",
    "useQuery",
    "useQueryClient",
    "runSettingsQuery",
    "settingsService.loadSnapshot",
    "settingsService.hasNotch",
    "settingsService.getHotspotEnabled",
    "settingsService.getImageCompat",
    "settingsService.getUsageRefreshInterval",
    "settingsService.getAppVersion",
    "SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY",
    "SETTINGS_HAS_NOTCH_QUERY_KEY",
    "SETTINGS_HOTSPOT_ENABLED_QUERY_KEY",
    "SETTINGS_IMAGE_COMPAT_QUERY_KEY",
    "SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY",
  ]);
  assertNotMatches("src/features/settings/hooks/query.ts", query, [
    [/\buseMutation\b/, "settings query owner must not own mutation"],
    [/\buseReducer\b/, "settings query owner must not own page/controller reducer state"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|beginSettingsMutation|writeSettingsMutationPayload)\b/, "settings query owner must delegate cache writes and mutation fences"],
    [/toast\(|useBusyAction/, "settings query owner must not own toast or busy UI actions"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "settings query owner must use settings service wrapper, not IPC/API transport"],
  ]);

  assertIncludes("src/features/settings/hooks/mutation.ts", mutation, [
    "useMutation",
    "useQueryClient",
    "settingsService.setAutoSwitch",
    "settingsService.configureAutoSwitch",
    "settingsService.setHotspotEnabled",
    "settingsService.hotspotReady",
    "settingsService.setImageCompat",
    "setUsageRefreshInterval",
    "settingsService.setApiProxyConfig",
    "settingsService.testApiProxyConfig",
    "settingsService.detectApiProxyConfig",
    "settingsService.checkUpdateInstallability",
    "beginSettingsMutation",
    "writeSettingsMutationPayload",
  ]);
  assertNotMatches("src/features/settings/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "settings mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "settings mutation owner must not own page/controller UI state"],
    [/\b(setQueryData|invalidateQueries)\b/, "settings mutation owner must delegate cache writes and invalidation to cache helper"],
    [/toast\(|useBusyAction/, "settings mutation owner must not own toast or busy UI actions"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "settings mutation owner must use settings service wrapper, not IPC/API transport"],
  ]);

  assertIncludes("src/features/settings/hooks/action.ts", action, [
    "useSettingsBusyActions",
    "useBusyAction",
    "updateCheckAction",
    "detectProxyAction",
    "testProxyAction",
    "saveProxyAction",
  ]);
  assertNotMatches("src/features/settings/hooks/action.ts", action, [
    [/\buse(Query|Mutation|QueryClient)\b/, "settings action owner may compose module hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|beginSettingsMutation|writeSettings|SETTINGS_[A-Z0-9_]+_QUERY_KEY)\b/, "settings action owner must not write cache or consume query keys"],
    [/@\/services\/settings|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|settingsService\.|systemService\.|invokeIpc|invoke\(/, "settings action owner must not access service/API/IPC directly"],
  ]);

  assertIncludes("src/features/settings/hooks/page.ts", page, [
    "useSettingsPageController",
    "SettingsPageController",
    "SettingsPageProps",
    "useState",
  ]);
  assertNotMatches("src/features/settings/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "settings page/controller may compose query/mutation/action hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|beginSettingsMutation|writeSettings|SETTINGS_[A-Z0-9_]+_QUERY_KEY)\b/, "settings page/controller must not write cache or consume query keys"],
    [/@\/services\/settings|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|settingsService\.|systemService\.|invokeIpc|invoke\(/, "settings page/controller must not access service/API/IPC directly"],
  ]);

  assertIncludes("src/features/settings/types/index.ts", types, [
    "export interface SettingsPageController",
    "export interface SettingsStatusController",
    "export interface SettingsAppearanceController",
    "export interface SettingsModeSwitchController",
    "export interface SettingsAboutController",
    "export interface SettingsThresholdDialogController",
    "export interface SettingsProxyDialogController",
    "export interface SettingsPageActions",
    "export interface SettingsControllerProps",
    "export type SettingsCachePayload",
    "export type SettingsCacheEnvelope",
  ]);
  assertNotMatches("src/features/settings/types/index.ts", types, [
    [/SettingsPageController\s*=\s*ReturnType|ReturnType<typeof useSettingsPageController>/, "settings controller contract must be explicit, not ReturnType"],
    [/SettingsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "settings types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/settings/cache/index.ts", cache, [
    "createModuleCacheOwner<SettingsCachePayload>(\"settings\")",
    "Omit<SettingsCacheEnvelope<TPayload>, \"moduleId\">",
    "TKey extends SettingsWritableQueryKey",
    "SettingsQueryPayloadForKey<TKey>",
    "writeSettingsAuthoritativePayload",
    "writeSettingsQueryPayload",
    "runSettingsQuery",
    "beginSettingsMutation",
    "writeSettingsMutationPayload",
    "invalidateSettingsContractQueries",
    "queryClient.setQueryData<SettingsQueryPayloadForKey<TKey>>",
    "SettingsCache.invalidateContractQueries(queryClient)",
  ]);
  if (!cache.includes("settingsMutationFences") || !cache.includes("canAcceptSettingsPayload")) {
    failures.push("src/features/settings/cache/index.ts must own mutation fences and stale/delayed response acceptance");
  }
  assertNotMatches("src/features/settings/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "settings cache owner must not own React hooks"],
    [/@\/services\/settings|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "settings cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("settings"\)|SettingsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "settings cache owner must keep typed payloads"],
  ]);

  if (controllerConsumerText.includes("ReturnType<typeof useSettingsPageController>")) {
    failures.push("src/features/settings panels/dialogs/components must consume explicit Settings controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+Settings[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/settings panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS settings deep owner gate executed: hooks/index, query, mutation, action, page, cache, types, panels/dialogs/components");
}

function validateSkillsDeepOwnerBoundaries() {
  const skillsRoot = join(featuresRoot, "skills");
  const hooksIndexPath = join(skillsRoot, "hooks", "index.ts");
  const queryPath = join(skillsRoot, "hooks", "query.ts");
  const mutationPath = join(skillsRoot, "hooks", "mutation.ts");
  const pagePath = join(skillsRoot, "hooks", "page.ts");
  const cachePath = join(skillsRoot, "cache", "index.ts");
  const sequencePath = join(skillsRoot, "cache", "sequence.ts");
  const typesPath = join(skillsRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(skillsRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(skillsRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(skillsRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const cacheSequence = existsSync(sequencePath) ? readRequired(sequencePath) : "";
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((file) => readRequired(file))
    .join("\n");
  const cacheOwnerText = `${cache}\n${cacheSequence}`;

  assertOnlyBarrelReExports("src/features/skills/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "page",
  ]);
  assertNotMatches("src/features/skills/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "skills hooks/index can only re-export split owners"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|nextSkillsCacheSequence|writeSkills)/, "skills hooks/index must not own cache writes or sequence"],
    [/@\/services\/skills|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|skillsService\.|invokeIpc|invoke\(/, "skills hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/skills/hooks/query.ts", query, [
    "useSkillsCacheController",
    "useModuleCacheController(SkillsCache)",
    "useQuery",
    "useQueryClient",
    "SKILLS_INSTALLED_QUERY_KEY",
    "SKILLS_BACKUPS_QUERY_KEY",
    "skillsService.loadInstalled",
    "skillsService.loadBackups",
    "writeSkillsCachePayload",
  ]);
  assertNotMatches("src/features/skills/hooks/query.ts", query, [
    [/\buseMutation\b/, "skills query owner must not own mutation"],
    [/\buse(State|Reducer)\b/, "skills query owner must not own page/controller UI state"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeSkillsMutationPayload)\b/, "skills query owner must delegate cache writes, invalidation, and mutation payloads"],
    [/toast\(|navigator\.clipboard/, "skills query owner must not own toast or clipboard UI"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "skills query owner must use skills service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "skills query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/skills/hooks/mutation.ts", mutation, [
    "useMutation",
    "useQueryClient",
    "skillsService.pickSkillDirectory",
    "skillsService.importSkill",
    "skillsService.removeSkill",
    "skillsService.restoreBackup",
    "skillsService.deleteBackup",
    "writeSkillsMutationPayload",
    "cancelQueries",
  ]);
  if (!/skillsService\.pickSkillDirectory\(\)[\s\S]*return null;[\s\S]*if \(payload\) return writeSkillsMutationPayload\(queryClient, payload\)/.test(mutation)) {
    failures.push("src/features/skills/hooks/mutation.ts must keep import cancel as silent null no-op before writeSkillsMutationPayload");
  }
  assertNotMatches("src/features/skills/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "skills mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "skills mutation owner must not own page/controller UI state"],
    [/\b(setQueryData|invalidateQueries)\b/, "skills mutation owner must delegate cache writes and invalidation to cache helper"],
    [/toast\(|navigator\.clipboard/, "skills mutation owner must not own toast or clipboard UI"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "skills mutation owner must use skills service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "skills mutation owner must keep typed mutation payloads"],
  ]);

  assertIncludes("src/features/skills/hooks/page.ts", page, [
    "useSkillsPageController",
    "SkillsPageController",
    "useState",
    "useSkillsPageQueries",
    "useSkillsPageMutations",
    "activeQuery.isError",
    "queryFailureAlert",
    "activeQuery.refetch()",
    "skills.loadFailed",
    "skills.loadFailedDesc",
  ]);
  assertNotMatches("src/features/skills/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "skills page/controller may compose query/mutation hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|nextSkillsCacheSequence|writeSkills|SKILLS_[A-Z0-9_]+_QUERY_KEY)\b/, "skills page/controller must not write cache, invalidate, cancel, allocate sequence, or consume query keys"],
    [/@\/services\/skills|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|skillsService\.|invokeIpc|invoke\(/, "skills page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "skills page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/skills/types/index.ts", types, [
    "export type SkillsInstalledEnvelope",
    "export type SkillsBackupsEnvelope",
    "export type SkillsMutationPayload",
    "export type SkillsMutationEnvelope",
    "export type SkillsCachePayload",
    "export interface SkillsPageController",
  ]);
  if (!/export interface Skills[A-Za-z]*(Panel|Dialogs?|Dialog|Controller)Props\b/.test(types)) {
    failures.push("src/features/skills/types/index.ts must declare explicit panel/dialog/controller props types");
  }
  assertNotMatches("src/features/skills/types/index.ts", types, [
    [/SkillsPageController\s*=\s*ReturnType|ReturnType<typeof useSkillsPageController>/, "skills controller contract must be explicit, not ReturnType"],
    [/SkillsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "skills types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/skills/cache/index.ts", cache, [
    "createModuleCacheOwner<SkillsCachePayload>(\"skills\")",
    "Omit<SkillsCacheEnvelope, \"moduleId\">",
    "SKILLS_INSTALLED_QUERY_KEY",
    "SKILLS_BACKUPS_QUERY_KEY",
    "writeSkillsAuthoritativePayload",
    "writeSkillsCachePayload",
    "writeSkillsMutationPayload",
    "invalidateSkillsContractQueries",
    "setQueryData<CoreEnvelope<SkillListPayload>>",
    "setQueryData<CoreEnvelope<SkillBackupListPayload>>",
    "invalidateQueries({ queryKey: SKILLS_INSTALLED_QUERY_KEY })",
    "invalidateQueries({ queryKey: SKILLS_BACKUPS_QUERY_KEY })",
  ]);
  if (
    !cacheOwnerText.includes("nextSkillsCacheSequence") ||
    !(
      cacheOwnerText.includes("acceptSkillsCacheSequence") ||
      cacheOwnerText.includes("skillsLatestAcceptedSequence") ||
      cacheOwnerText.includes("sequence <")
    )
  ) {
    failures.push("src/features/skills/cache/index.ts or cache/sequence.ts must own sequence/stale/delayed response protection");
  }
  assertNotMatches("src/features/skills/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "skills cache owner must not own React hooks"],
    [/@\/services\/skills|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|skillsService\.|invokeIpc|invoke\(/, "skills cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("skills"\)|SkillsCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "skills cache owner must keep typed payloads"],
  ]);

  if (controllerConsumerText.includes("ReturnType<typeof useSkillsPageController>")) {
    failures.push("src/features/skills panels/dialogs/components must consume explicit Skills controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+Skills[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/skills panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS skills deep owner gate executed: hooks/index, query, mutation, page, cache, types, panels/dialogs/components");
}

function validateRelayDeepOwnerBoundaries() {
  const relayRoot = join(featuresRoot, "relay");
  const hooksIndexPath = join(relayRoot, "hooks", "index.ts");
  const queryPath = join(relayRoot, "hooks", "query.ts");
  const mutationPath = join(relayRoot, "hooks", "mutation.ts");
  const runtimePath = join(relayRoot, "hooks", "runtime.ts");
  const pagePath = join(relayRoot, "hooks", "page.ts");
  const cachePath = join(relayRoot, "cache", "index.ts");
  const sequencePath = join(relayRoot, "cache", "sequence.ts");
  const typesPath = join(relayRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(relayRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(relayRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(relayRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const runtime = readRequired(runtimePath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const cacheSequence = existsSync(sequencePath) ? readRequired(sequencePath) : "";
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((file) => readRequired(file))
    .join("\n");
  const cacheOwnerText = `${cache}\n${cacheSequence}`;

  assertOnlyBarrelReExports("src/features/relay/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "runtime",
    "page",
  ]);
  assertNotMatches("src/features/relay/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "relay hooks/index can only re-export split owners"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|nextRelayCacheSequence|writeRelay)/, "relay hooks/index must not own cache writes, invalidation, cancellation, or sequence"],
    [/@\/services\/relay|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|relayService\.|systemService\.|invokeIpc|invoke\(/, "relay hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/relay/hooks/query.ts", query, [
    "useRelayCacheController",
    "useModuleCacheController(RelayCache)",
    "useQuery",
    "useQueryClient",
    "RELAY_STATE_QUERY_KEY",
    "relayActiveStateQueryKey",
    "relayService.loadState",
    "relayService.getActive",
    "relayService.getProxyStatus",
    "relayService.getPassthroughAuditLog",
    "runRelayQuery",
    "full-refresh",
  ]);
  assertNotMatches("src/features/relay/hooks/query.ts", query, [
    [/\buseMutation\b/, "relay query owner must not own mutation"],
    [/\buse(State|Reducer)\b/, "relay query owner must not own page/controller UI state"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeRelayMutationPayload)\b/, "relay query owner must delegate cache writes, invalidation, cancellation, and mutation payloads"],
    [/toast\(|navigator\.clipboard/, "relay query owner must not own toast or browser UI"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "relay query owner must use relay service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "relay query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/relay/hooks/mutation.ts", mutation, [
    "useMutation",
    "useQueryClient",
    "relayService.upsert",
    "relayService.delete",
    "relayService.activate",
    "relayService.deactivate",
    "relayService.setCodexRouterEnabled",
    "writeRelayMutationPayload",
    "invalidateRelayContractQueries",
    "cancelQueries",
  ]);
  assertNotMatches("src/features/relay/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "relay mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "relay mutation owner must not own page/controller UI state"],
    [/\b(setQueryData|invalidateQueries)\b/, "relay mutation owner must delegate cache writes and invalidation to cache helper"],
    [/toast\(|navigator\.clipboard/, "relay mutation owner must not own toast or browser UI"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "relay mutation owner must use relay service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|useMutation<unknown|Promise<unknown>/, "relay mutation owner must keep typed mutation payloads"],
  ]);

  assertIncludes("src/features/relay/hooks/runtime.ts", runtime, [
    "useRelayRuntimeEvents",
    "useEffect",
    "useQueryClient",
    "relayService.subscribeRouterToggleProgress",
    "return relayService.subscribeRouterToggleProgress",
    "parseRelayRouterToggleProgress",
    "writeRelayRouterToggleProgress",
    "RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY",
  ]);
  assertNotMatches("src/features/relay/hooks/runtime.ts", runtime, [
    [/\buse(Query|Mutation)\b/, "relay runtime owner must not own query or mutation"],
    [/\buse(State|Reducer|Memo|Callback)\b/, "relay runtime owner must not own page/controller UI state"],
    [/\bsetQueryData\b/, "relay runtime owner must write router progress through cache helper only"],
    [/relayService\.(?!subscribeRouterToggleProgress\b)\w+/, "relay runtime owner must not call relay service commands beyond router progress subscription"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "relay runtime owner must use relay service event facade, not IPC/API transport"],
  ]);

  assertIncludes("src/features/relay/hooks/page.ts", page, [
    "useRelayPageController",
    "RelayPageController",
    "useState",
    "useMemo",
    "useRelayPageQueries",
    "useRelayPageMutations",
    "useRelayRuntimeEvents",
    "toast",
    "formatExtraHeaders(extraHeaders: RelayExtraHeaders | undefined)",
  ]);
  assertNotMatches("src/features/relay/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "relay page/controller may compose split owner hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|nextRelayCacheSequence|writeRelay|RELAY_[A-Z0-9_]+_QUERY_KEY|relay[A-Za-z]*QueryKey)\b/, "relay page/controller must not write cache, invalidate, cancel, allocate sequence, or consume query keys"],
    [/@\/services\/relay|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|relayService\.|systemService\.|invokeIpc|invoke\(/, "relay page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|formatExtraHeaders\(provider:\s*unknown\)/, "relay page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/relay/types/index.ts", types, [
    "export type RelayQueryDataPayload",
    "export type RelayMutationDataPayload",
    "export type RelayCachePayload",
    "export type RelayCacheDataPayload",
    "export type RelayKnownQueryPayload",
    "export interface RelayPageController",
  ]);
  if (!/export interface Relay[A-Za-z]*(Panel|Panels|Dialogs?|Dialog|Controller)Props\b/.test(types)) {
    failures.push("src/features/relay/types/index.ts must declare explicit panel/dialog/controller props types");
  }
  assertNotMatches("src/features/relay/types/index.ts", types, [
    [/RelayPageController\s*=\s*ReturnType|ReturnType<typeof useRelayPageController>/, "relay controller contract must be explicit, not ReturnType"],
    [/RelayCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "relay types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/relay/cache/index.ts", cache, [
    "createModuleCacheOwner<RelayCachePayload>(\"relay\")",
    "Omit<RelayCacheEnvelope<TPayload>, \"moduleId\">",
    "RELAY_STATE_QUERY_KEY",
    "RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY",
    "writeRelayAuthoritativePayload",
    "writeRelayQueryPayload",
    "writeRelayMutationPayload",
    "writeRelayStateQueryPayload",
    "writeRelayRouterToggleQueryPayload",
    "writeRelayRouterToggleProgress",
    "invalidateRelayContractQueries",
    "setQueryData<CoreEnvelope<RelayStatePayload>>",
  ]);
  if (
    !cacheOwnerText.includes("nextRelayCacheSequence") ||
    !(
      cacheOwnerText.includes("acceptRelayCacheSequence") ||
      cacheOwnerText.includes("relayLatestAcceptedSequence") ||
      cacheOwnerText.includes("sequence <")
    )
  ) {
    failures.push("src/features/relay/cache/index.ts or cache/sequence.ts must own full-refresh/mutation sequence and stale/delayed response protection");
  }
  assertNotMatches("src/features/relay/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "relay cache owner must not own React hooks"],
    [/@\/services\/relay|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|relayService\.|systemService\.|invokeIpc|invoke\(/, "relay cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("relay"\)|RelayCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "relay cache owner must keep typed payloads"],
  ]);

  if (controllerConsumerText.includes("ReturnType<typeof useRelayPageController>")) {
    failures.push("src/features/relay panels/dialogs/components must consume explicit Relay controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+Relay[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/relay panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS relay deep owner gate executed: hooks/index, query, mutation, runtime, page, cache, types, panels/dialogs/components");
}

function validateMaintenanceDeepOwnerBoundaries() {
  const maintenanceRoot = join(featuresRoot, "maintenance");
  const hooksIndexPath = join(maintenanceRoot, "hooks", "index.ts");
  const queryPath = join(maintenanceRoot, "hooks", "query.ts");
  const mutationPath = join(maintenanceRoot, "hooks", "mutation.ts");
  const pagePath = join(maintenanceRoot, "hooks", "page.ts");
  const cachePath = join(maintenanceRoot, "cache", "index.ts");
  const typesPath = join(maintenanceRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    join(maintenanceRoot, "dialogs", "index.ts"),
    join(maintenanceRoot, "dialogs", "diagnostics.tsx"),
    join(maintenanceRoot, "dialogs", "restart.tsx"),
    join(maintenanceRoot, "panels", "index.ts"),
    join(maintenanceRoot, "components", "index.ts"),
    join(maintenanceRoot, "components", "page.tsx"),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((path) => readRequired(path))
    .join("\n");

  assertOnlyBarrelReExports("src/features/maintenance/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "page",
  ]);
  assertNotMatches("src/features/maintenance/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "maintenance hooks/index can only re-export split owners"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|beginMaintenanceMutation|prepareMaintenanceMutation|writeMaintenance|Maintenance[A-Za-z]*QueryKeys|MAINTENANCE_[A-Z0-9_]+_QUERY_KEY)\b/, "maintenance hooks/index must not own cache writes or query keys"],
    [/@\/services\/maintenance|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|maintenanceService\.|systemService\.|invokeIpc|invoke\(/, "maintenance hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/maintenance/hooks/query.ts", query, [
    "useQuery",
    "useQueryClient",
    "runMaintenanceQuery",
    "MAINTENANCE_IMAGE_COMPAT_QUERY_KEY",
    "MAINTENANCE_SYSTEM_INFO_QUERY_KEY",
    "maintenanceService.getImageCompat",
    "maintenanceService.getSystemInfo",
  ]);
  assertNotMatches("src/features/maintenance/hooks/query.ts", query, [
    [/\buseMutation\b/, "maintenance query owner must not own mutation"],
    [/\buse(State|Reducer|Memo)\b/, "maintenance query owner must not own page/controller UI state or view models"],
    [/\b(beginMaintenanceMutation|prepareMaintenanceMutation|writeMaintenanceActionPayload|writeMaintenanceMutationPayload|invalidateMaintenanceContractQueries|setQueryData|cancelQueries)\b/, "maintenance query owner must delegate mutation fences, cache writes, and invalidation"],
    [/toast\(|useTranslation|formatInvokeError|MaintenancePageController|restartDialog|routerDiagnosticsDialog|setActionResult|setActionRunning/, "maintenance query owner must not own page controller, locale formatting, or dialog state"],
    [/@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|systemService\.|invokeIpc|invoke\(/, "maintenance query owner must use maintenance service wrapper, not system/API/IPC transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "maintenance query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/maintenance/hooks/mutation.ts", mutation, [
    "useMutation",
    "useQueryClient",
    "prepareMaintenanceMutation",
    "writeMaintenanceActionPayload",
    "writeMaintenanceMutationPayload",
    "invalidateMaintenanceContractQueries",
    "maintenanceService.diagnose",
    "maintenanceService.clean",
    "maintenanceService.rebuildRegistry",
    "maintenanceService.runCodexRouterDiagnostics",
    "maintenanceService.fixCodexRouterIssue",
  ]);
  assertNotMatches("src/features/maintenance/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "maintenance mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "maintenance mutation owner must not own page/controller UI state"],
    [/\b(setQueryData|invalidateQueries)\b/, "maintenance mutation owner must delegate cache writes and invalidation to cache helper"],
    [/toast\(|useTranslation|MaintenancePageController|restartDialog|routerDiagnosticsDialog|setActionResult|setActionRunning/, "maintenance mutation owner must not own page controller, locale formatting, or dialog state"],
    [/@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|systemService\.|invokeIpc|invoke\(/, "maintenance mutation owner must use maintenance service wrapper, not system/API/IPC transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|useMutation<unknown|Promise<unknown>/, "maintenance mutation owner must keep typed mutation payloads"],
  ]);

  assertIncludes("src/features/maintenance/hooks/page.ts", page, [
    "useMaintenance",
    "MaintenancePageController",
    "restartDialog",
    "routerDiagnosticsDialog",
  ]);
  assertNotMatches("src/features/maintenance/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "maintenance page/controller may compose split owner hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|beginMaintenanceMutation|prepareMaintenanceMutation|writeMaintenance|Maintenance[A-Za-z]*QueryKeys|MAINTENANCE_[A-Z0-9_]+_QUERY_KEY)\b/, "maintenance page/controller must not write cache, invalidate, cancel, allocate fences, or consume query keys"],
    [/@\/services\/maintenance|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|maintenanceService\.|systemService\.|invokeIpc|invoke\(/, "maintenance page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "maintenance page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/maintenance/types/index.ts", types, [
    "export type MaintenanceCachePayload",
    "export type MaintenanceQueryPayloadForKey",
    "export interface MaintenancePageController",
  ]);
  assertNotMatches("src/features/maintenance/types/index.ts", types, [
    [/MaintenancePageController\s*=\s*ReturnType|ReturnType<typeof useMaintenancePageController>/, "maintenance controller contract must be explicit, not ReturnType"],
    [/MaintenanceCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "maintenance types owner must keep typed cache payloads"],
  ]);

  assertNotMatches("src/features/maintenance/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "maintenance cache owner must not own React hooks"],
    [/@\/services\/maintenance|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|maintenanceService\.|systemService\.|invokeIpc|invoke\(/, "maintenance cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("maintenance"\)|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "maintenance cache owner must keep typed payloads"],
  ]);

  if (controllerConsumerText.includes("ReturnType<typeof useMaintenancePageController>")) {
    failures.push("src/features/maintenance dialogs/panels/components must consume explicit Maintenance controller types, not hook ReturnType");
  }

  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+Maintenance[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/maintenance dialogs/panels/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS maintenance deep owner gate executed: hooks/index, query, mutation, page, cache, types, dialogs/panels/components");
}

function validateDaemonAutoswitchDeepOwnerBoundaries() {
  const daemonRoot = join(featuresRoot, "daemon-autoswitch");
  const hooksIndexPath = join(daemonRoot, "hooks", "index.ts");
  const queryPath = join(daemonRoot, "hooks", "query.ts");
  const mutationPath = join(daemonRoot, "hooks", "mutation.ts");
  const runtimePath = join(daemonRoot, "hooks", "runtime.ts");
  const pagePath = join(daemonRoot, "hooks", "page.ts");
  const cachePath = join(daemonRoot, "cache", "index.ts");
  const typesPath = join(daemonRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(daemonRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(daemonRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(daemonRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const runtime = readRequired(runtimePath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((path) => readRequired(path))
    .join("\n");

  assertOnlyBarrelReExports("src/features/daemon-autoswitch/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "runtime",
    "page",
  ]);
  assertNotMatches("src/features/daemon-autoswitch/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "daemon-autoswitch hooks/index can only re-export split owners"],
    [/\b(writeDaemonAutoswitch|setQueryData|invalidateQueries|cancelQueries|DaemonAutoswitch[A-Za-z]*QueryKeys|DAEMON_AUTOSWITCH_[A-Z0-9_]+_QUERY_KEY)\b/, "daemon-autoswitch hooks/index must not own cache writes or query keys"],
    [/@\/services\/daemon-autoswitch|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|daemonAutoswitchService\.|systemService\.|invokeIpc|invoke\(/, "daemon-autoswitch hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/daemon-autoswitch/hooks/query.ts", query, [
    "useDaemonAutoswitchCacheController",
    "useModuleCacheController(DaemonAutoswitchCache)",
    "useDaemonAutoswitchBootstrapQuery",
    "useDaemonAutoswitchPendingQuery",
    "useQuery",
    "useQueryClient",
    "runDaemonAutoswitchQuery",
    "daemonAutoswitchService.loadBootstrapState",
    "daemonAutoswitchService.loadPendingAutoSwitch",
  ]);
  assertNotMatches("src/features/daemon-autoswitch/hooks/query.ts", query, [
    [/\buseMutation\b/, "daemon-autoswitch query owner must not own mutation"],
    [/\buseEffect\b/, "daemon-autoswitch query owner must not own runtime subscriptions"],
    [/\buse(State|Reducer|Memo|Callback)\b/, "daemon-autoswitch query owner must not own page/controller UI state or view models"],
    [/\b(cancelDaemonAutoswitchQueries|writeDaemonAutoswitchMutationPayload|invalidateDaemonAutoswitchContractQueries|setQueryData|cancelQueries)\b/, "daemon-autoswitch query owner must delegate mutation writes, cancellation, and invalidation"],
    [/useTranslation|DaemonAutoswitchPageController|useDaemonAutoswitchModule|useDaemonAutoswitchPendingPrompt|metrics|panels|labelKey|envelopeData|readBoolean|readString/, "daemon-autoswitch query owner must not own page controller, locale, or view model parsing"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "daemon-autoswitch query owner must use daemon-autoswitch service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>|response\.data/, "daemon-autoswitch query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/daemon-autoswitch/hooks/mutation.ts", mutation, [
    "useMutation",
    "useQueryClient",
    "daemonAutoswitchService.runDaemonOnce",
    "daemonAutoswitchService.setAutoSwitch",
    "daemonAutoswitchService.dismissPendingAutoSwitch",
    "daemonAutoswitchService.confirmPendingAutoSwitchAndRestartCodex",
    "cancelDaemonAutoswitchQueries",
    "writeDaemonAutoswitchMutationPayload",
    "invalidateDaemonAutoswitchContractQueries",
  ]);
  assertNotMatches("src/features/daemon-autoswitch/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "daemon-autoswitch mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo|Callback)\b/, "daemon-autoswitch mutation owner must not own page/controller UI state"],
    [/\bsetQueryData\b/, "daemon-autoswitch mutation owner must delegate cache writes to cache helper"],
    [/useTranslation|DaemonAutoswitchPageController|useDaemonAutoswitchModule|useDaemonAutoswitchPendingPrompt|metrics|panels|labelKey|envelopeData|readBoolean|readString/, "daemon-autoswitch mutation owner must not own page controller, locale, or view model parsing"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "daemon-autoswitch mutation owner must use daemon-autoswitch service wrapper, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>|useMutation<unknown|Promise<unknown>|response\.data/, "daemon-autoswitch mutation owner must keep typed mutation payloads"],
  ]);

  assertIncludes("src/features/daemon-autoswitch/hooks/runtime.ts", runtime, [
    "useDaemonAutoswitchRuntimeSubscriptions",
    "useEffect",
    "useQueryClient",
    "daemonAutoswitchService.subscribePendingAutoSwitch",
    "invalidateQueries",
    "DAEMON_AUTOSWITCH_PENDING_QUERY_KEY",
  ]);
  assertNotMatches("src/features/daemon-autoswitch/hooks/runtime.ts", runtime, [
    [/\buse(Query|Mutation)\b/, "daemon-autoswitch runtime owner must not own query or mutation"],
    [/\buse(State|Reducer|Memo|Callback)\b/, "daemon-autoswitch runtime owner must not own page/controller UI state"],
    [/\bsetQueryData\b/, "daemon-autoswitch runtime owner must invalidate through cache/query helper only"],
    [/useTranslation|DaemonAutoswitchPageController|useDaemonAutoswitchModule|useDaemonAutoswitchPendingPrompt|metrics|panels|labelKey|envelopeData|readBoolean|readString/, "daemon-autoswitch runtime owner must not own page controller, locale, or view model parsing"],
    [/daemonAutoswitchService\.(?!subscribePendingAutoSwitch\b)\w+/, "daemon-autoswitch runtime owner must not call daemon-autoswitch service commands beyond pending subscription"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "daemon-autoswitch runtime owner must use service event facade, not IPC/API transport"],
  ]);

  assertIncludes("src/features/daemon-autoswitch/hooks/page.ts", page, [
    "useDaemonAutoswitchPendingPrompt",
    "useDaemonAutoswitchModule",
    "useDaemonAutoswitchPageController",
    "DaemonAutoswitchPageController",
    "metrics",
    "panels",
    "useDaemonAutoswitchPageQueries",
    "useDaemonAutoswitchPageMutations",
    "useDaemonAutoswitchRuntimeSubscriptions",
  ]);
  assertNotMatches("src/features/daemon-autoswitch/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "daemon-autoswitch page/controller may compose split owner hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeDaemonAutoswitch|DaemonAutoswitch[A-Za-z]*QueryKeys|DAEMON_AUTOSWITCH_[A-Z0-9_]+_QUERY_KEY)\b/, "daemon-autoswitch page/controller must not write cache, invalidate, cancel, or consume query keys"],
    [/@\/services\/daemon-autoswitch|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|daemonAutoswitchService\.|systemService\.|invokeIpc|invoke\(/, "daemon-autoswitch page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>|response\.data/, "daemon-autoswitch page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/daemon-autoswitch/types/index.ts", types, [
    "export type DaemonAutoswitchCachePayload",
    "export type DaemonAutoswitchMutationEnvelope",
    "export type DaemonAutoswitchMutationPayload",
    "export interface DaemonAutoswitchPageQueries",
    "export interface DaemonAutoswitchPageMutations",
    "export interface DaemonAutoswitchRuntime",
    "export interface DaemonAutoswitchPageController",
  ]);
  assertNotMatches("src/features/daemon-autoswitch/types/index.ts", types, [
    [/DaemonAutoswitch[A-Za-z]*(?:Controller|Queries|Mutations)\s*=\s*ReturnType|ReturnType<typeof useDaemonAutoswitch[A-Za-z]*/, "daemon-autoswitch controller/query/mutation/runtime contracts must be explicit, not hook ReturnType"],
    [/DaemonAutoswitchCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown|CoreEnvelope<unknown>/, "daemon-autoswitch types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/daemon-autoswitch/cache/index.ts", cache, [
    "createModuleCacheOwner<DaemonAutoswitchCachePayload>(\"daemon-autoswitch\")",
    "Omit<DaemonAutoswitchCacheEnvelope<TPayload>, \"moduleId\">",
    "writeDaemonAutoswitchAuthoritativePayload",
    "invalidateDaemonAutoswitchContractQueries",
  ]);
  assertNotMatches("src/features/daemon-autoswitch/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "daemon-autoswitch cache owner must not own React hooks"],
    [/@\/services\/daemon-autoswitch|@\/services\/system|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|daemonAutoswitchService\.|systemService\.|invokeIpc|invoke\(/, "daemon-autoswitch cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("daemon-autoswitch"\)|DaemonAutoswitchCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "daemon-autoswitch cache owner must keep typed payloads"],
  ]);

  if (controllerConsumerText.includes("ReturnType<typeof useDaemonAutoswitchPageController>")) {
    failures.push("src/features/daemon-autoswitch panels/dialogs/components must consume explicit DaemonAutoswitch controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+DaemonAutoswitch[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/daemon-autoswitch panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS daemon-autoswitch deep owner gate executed: hooks/index, query, mutation, runtime, page, cache, types, panels/dialogs/components");
}

function validateOverviewDeepOwnerBoundaries() {
  const overviewRoot = join(featuresRoot, "overview");
  const hooksIndexPath = join(overviewRoot, "hooks", "index.ts");
  const queryPath = join(overviewRoot, "hooks", "query.ts");
  const mutationPath = join(overviewRoot, "hooks", "mutation.ts");
  const pagePath = join(overviewRoot, "hooks", "page.ts");
  const cachePath = join(overviewRoot, "cache", "index.ts");
  const typesPath = join(overviewRoot, "types", "index.ts");
  const controllerConsumerPaths = [
    ...walkFiles(join(overviewRoot, "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(overviewRoot, "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(overviewRoot, "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];

  const hooksIndex = readRequired(hooksIndexPath);
  const query = readRequired(queryPath);
  const mutation = readRequired(mutationPath);
  const page = readRequired(pagePath);
  const cache = readRequired(cachePath);
  const types = readRequired(typesPath);
  const controllerConsumerText = controllerConsumerPaths
    .map((file) => readRequired(file))
    .join("\n");

  assertOnlyBarrelReExports("src/features/overview/hooks/index.ts", hooksIndex, [
    "query",
    "mutation",
    "page",
  ]);
  assertNotMatches("src/features/overview/hooks/index.ts", hooksIndex, [
    [/\b(useQuery|useMutation|useQueryClient|useState|useReducer|useEffect|useMemo|useCallback)\b/, "overview hooks/index can only re-export split owners"],
    [/\b(writeOverview|setQueryData|invalidateQueries|cancelQueries|Overview[A-Za-z]*QueryKeys|OVERVIEW_[A-Z0-9_]+_QUERY_KEY)\b/, "overview hooks/index must not own cache writes or query keys"],
    [/@\/services\/(?:accounts|analytics|mcp|skills|system)|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|(?:accounts|analytics|mcp|skills|system)Service\.|invokeIpc|invoke\(/, "overview hooks/index must not access service/API/IPC"],
  ]);

  assertIncludes("src/features/overview/hooks/query.ts", query, [
    "useOverviewCacheController",
    "useModuleCacheController(OverviewCache)",
    "useOverviewPageQueries",
    "useQuery",
    "useQueryClient",
    "accountsService.loadSnapshot(true)",
    "analyticsService.loadUsageAnalytics",
    "mcpService.loadServers",
    "skillsService.loadInstalled",
    "systemService.getDeviceId",
    "systemService.getNotificationClientState",
    "systemService.getMysteryUnlockGrants",
    "runOverviewQuery",
  ]);
  assertNotMatches("src/features/overview/hooks/query.ts", query, [
    [/\buseMutation\b/, "overview query owner must not own mutation"],
    [/\buse(State|Reducer|Memo)\b/, "overview query owner must not own page/controller UI state or view models"],
    [/\b(writeOverviewMutationPayload|writeOverviewMysteryGrantsPayload|invalidateOverviewContractQueries|setQueryData|cancelQueries)\b/, "overview query owner must delegate mutation writes and invalidation"],
    [/toast\(|useTranslation|OverviewPageController|setRemoteDeviceSecret|importRemoteSecret/, "overview query owner must not own page controller, locale formatting, or dialog state"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "overview query owner must use module service wrappers, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "overview query owner must keep typed authoritative payloads"],
  ]);

  assertIncludes("src/features/overview/hooks/mutation.ts", mutation, [
    "useOverviewPageMutations",
    "useMutation",
    "useQueryClient",
    "accountsService.refreshUsageSnapshot",
    "systemService.focusMainWindow",
    "systemService.getOrCreateRemoteDeviceSecret",
    "systemService.importRemoteDeviceSecretIfEmpty",
    "systemService.mergeMysteryUnlockGrants",
    "writeOverviewMutationPayload",
    "writeOverviewMysteryGrantsPayload",
    "prepareOverviewMutation",
    "invalidateOverviewUsageMutationQueries",
    "invalidateOverviewMysteryGrantsQueries",
  ]);
  assertNotMatches("src/features/overview/hooks/mutation.ts", mutation, [
    [/\buseQuery\b/, "overview mutation owner must not own query"],
    [/\buse(State|Reducer|Effect|Memo)\b/, "overview mutation owner must not own page/controller UI state"],
    [/\b(setQueryData|invalidateQueries)\b/, "overview mutation owner must delegate cache writes and invalidation to cache helper"],
    [/toast\(|useTranslation|OverviewPageController|setRemoteDeviceSecret|importRemoteSecret(?:Draft|Open|Dialog)/, "overview mutation owner must not own page controller, locale formatting, or dialog state"],
    [/@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "overview mutation owner must use module service wrappers, not IPC/API transport"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown|useMutation<unknown/, "overview mutation owner must keep typed mutation payloads"],
  ]);

  assertIncludes("src/features/overview/hooks/page.ts", page, [
    "useOverviewPageController",
    "OverviewPageController",
    "useOverviewPageQueries",
    "useOverviewPageMutations",
    "useState",
    "useTranslation",
    "envelopeData<CoreSnapshotPayload>",
    "readArray<DailyActivity>",
    "readArray<McpServerSummary>",
    "readArray<InstalledSkillSummary>",
  ]);
  assertNotMatches("src/features/overview/hooks/page.ts", page, [
    [/\buse(Query|Mutation|QueryClient)\b/, "overview page/controller may compose split owner hooks but must not call TanStack directly"],
    [/\b(setQueryData|invalidateQueries|cancelQueries|writeOverview|Overview[A-Za-z]*QueryKeys|OVERVIEW_[A-Z0-9_]+_QUERY_KEY)\b/, "overview page/controller must not write cache, invalidate, cancel, or consume query keys"],
    [/@\/services\/(?:accounts|analytics|mcp|skills|system)|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|(?:accounts|analytics|mcp|skills|system)Service\.|invokeIpc|invoke\(/, "overview page/controller must not access service/API/IPC directly"],
    [/ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "overview page/controller must not use generic authoritative payloads"],
  ]);

  assertIncludes("src/features/overview/types/index.ts", types, [
    "export type OverviewSnapshotEnvelope",
    "export type OverviewUsageEnvelope",
    "export type OverviewMcpEnvelope",
    "export type OverviewSkillsEnvelope",
    "export type OverviewNotificationEnvelope",
    "export type OverviewMysteryGrantsEnvelope",
    "export type OverviewCachePayload",
    "export interface OverviewPageController",
  ]);
  assertNotMatches("src/features/overview/types/index.ts", types, [
    [/OverviewPageController\s*=\s*ReturnType|ReturnType<typeof useOverviewPageController>/, "overview controller contract must be explicit, not ReturnType"],
    [/OverviewCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown|items:\s*unknown\[\]/, "overview types owner must keep typed cache payloads"],
  ]);

  assertIncludes("src/features/overview/cache/index.ts", cache, [
    "createModuleCacheOwner<OverviewCachePayload>(\"overview\")",
    "OverviewQueryKeys",
    "OVERVIEW_MYSTERY_GRANTS_QUERY_KEY",
    "writeOverviewAuthoritativePayload",
    "writeOverviewQueryPayload",
    "writeOverviewMutationPayload",
    "writeOverviewMysteryGrantsPayload",
    "invalidateOverviewContractQueries",
    "Omit<OverviewCacheEnvelope<TPayload>, \"moduleId\">",
  ]);
  assertNotMatches("src/features/overview/cache/index.ts", cache, [
    [/\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/, "overview cache owner must not own React hooks"],
    [/@\/services\/(?:accounts|analytics|mcp|skills|system)|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|(?:accounts|analytics|mcp|skills|system)Service\.|invokeIpc|invoke\(/, "overview cache owner must not access service/API/IPC"],
    [/createModuleCacheOwner\("overview"\)|OverviewCacheEnvelope<TPayload = unknown>|ModuleCacheEnvelope<unknown>|payload:\s*unknown/, "overview cache owner must keep typed payloads"],
  ]);

  if (controllerConsumerText.includes("ReturnType<typeof useOverviewPageController>")) {
    failures.push("src/features/overview panels/dialogs/components must consume explicit Overview controller types, not hook ReturnType");
  }
  if (
    /(?:import|export)\s+type[^;]*from\s+["']\.\.\/hooks["']/.test(controllerConsumerText) ||
    /import\s+\{[\s\S]*?\btype\s+Overview[A-Za-z]*(?:Controller|Props)\b[\s\S]*?\}\s+from\s+["']\.\.\/hooks["']/.test(controllerConsumerText)
  ) {
    failures.push("src/features/overview panels/dialogs/components must import controller/props types from ../types, not ../hooks");
  }

  console.log("PASS overview deep owner gate executed: hooks/index, query, mutation, page, cache, types, panels/dialogs/components");
}

function validateFeatureDeepOwners() {
  for (const moduleId of featureModules) {
    const moduleRoot = join(featuresRoot, moduleId);
    for (const requiredFile of requiredFeatureFiles) {
      readRequired(join(moduleRoot, requiredFile));
    }

    const provider = readRequired(join(moduleRoot, "Provider.tsx"));
    const updater = readRequired(join(moduleRoot, "StoreUpdater.tsx"));
    const content = readRequired(join(moduleRoot, "Content.tsx"));
    assertIncludes(`src/features/${moduleId}/Provider.tsx`, provider, ["Provider"]);
    assertIncludes(`src/features/${moduleId}/StoreUpdater.tsx`, updater, ["StoreUpdater"]);
    assertIncludes(`src/features/${moduleId}/Content.tsx`, content, ["Content"]);
  }

  console.log(`PASS feature 深层 owner 文件：${featureModules.length}/${featureModules.length}`);
}

function validateRouteShells() {
  for (const moduleId of featureModules) {
    const routeFile = join(routesRoot, moduleId, "page.tsx");
    const text = readRequired(routeFile);
    assertIncludes(`src/routes/desktop/main/${moduleId}/page.tsx`, text, [
      `@/features/${moduleId}`,
      "Route",
    ]);
    assertNotMatches(`src/routes/desktop/main/${moduleId}/page.tsx`, text, [
      [/\buse(State|Reducer|Effect|Memo|Callback)\b/, "route shell 不得持有页面私有业务状态"],
      [/\buse(Query|Mutation)\b/, "route shell 不得 owning TanStack 查询或 mutation"],
      [/@\/lib\/api|@\/services|invokeIpc/, "route shell 不得直接访问 API/service/IPC"],
    ]);
  }

  console.log(`PASS route shell 纯度：${featureModules.length}/${featureModules.length}`);
}

function validateFeaturePageShells() {
  for (const moduleId of strictFeaturePageShells) {
    const pageFile = join(featuresRoot, moduleId, "components", "page.tsx");
    const text = readRequired(pageFile);
    const label = `src/features/${moduleId}/components/page.tsx`;
    const declaredFunctions = [
      ...text.matchAll(/(?:^|\n)function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g),
    ].map((match) => match[1]);
    const expectedPageName = `${moduleId
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")}Page`;
    const unexpectedFunctions = declaredFunctions.filter((name) => name !== expectedPageName);

    if (providerContentPageShells.includes(moduleId)) {
      assertIncludes(label, text, ["../Provider", "../Content"]);
      assertNotMatches(label, text, [
        [/\.\.\/hooks/, "module page 必须只装配 Provider 和 Content，不得直接持有模块 hook"],
        [/\.\.\/panels/, "module page 必须只装配 Provider 和 Content，不得直接挂载面板"],
        [/\.\.\/dialogs/, "module page 必须只装配 Provider 和 Content，不得直接挂载弹窗"],
      ]);
    } else {
      assertIncludes(label, text, ["../hooks"]);
    }
    assertNotMatches(label, text, [
      [/\buse(State|Reducer|Effect|Memo|Callback)\b/, "module page 只能作为 shell，不得 owning 组件私有状态或复杂派生"],
      [/\buse(Query|Mutation)\b/, "module page 不得直接 owning TanStack query/mutation"],
      [/@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "module page 不得绕过 hook/service 直接访问 IPC"],
      [/\b(readString|readNumber|readPath|readArray|envelopeData|selectSessionRecords|selectSessionsEnvelopeData|buildSessionGroups|countOrphans|formatBytes|formatEpoch|formatPlan|quotaPercent|tokenStatusCode|accountEmail|accountKey)\b/, "module page 不得 owning 数据解析、筛选、统计或格式化 helper"],
    ]);

    if (unexpectedFunctions.length > 0) {
      failures.push(`${label} 仍声明页面内子组件或 helper：${unexpectedFunctions.join(", ")}`);
    }
  }

  console.log(`PASS module page shell 纯度：${strictFeaturePageShells.length}/${strictFeaturePageShells.length}`);
}

function validateServiceOwners() {
  const serviceIndex = readRequired(join(servicesRoot, "index.ts"));
  for (const moduleId of modulesWithService) {
    readRequired(join(servicesRoot, moduleId, "index.ts"));
    if (!serviceIndex.includes(`"./${moduleId}"`)) {
      failures.push(`src/services/index.ts 未聚合模块 service：${moduleId}`);
    }
  }

  console.log(`PASS service owner 聚合：${modulesWithService.length}/${modulesWithService.length}`);
}

function validateSystemServiceFacadeOwners() {
  const systemCommands = [
    "check_update_installability",
    "clean",
    "configure_auto_switch",
    "confirm_pending_auto_switch",
    "confirm_pending_auto_switch_and_restart_codex",
    "detect_api_proxy_config",
    "dismiss_pending_auto_switch",
    "diagnose",
    "force_kill_codex",
    "get_hotspot_enabled",
    "get_image_compat",
    "get_system_info",
    "get_usage_refresh_interval",
    "graceful_restart_for_update",
    "has_notch",
    "hotspot_ready",
    "load_snapshot",
    "load_pending_auto_switch",
    "open_path",
    "rebuild_registry",
    "reset_codex_config",
    "restart_codex",
    "run_daemon_once",
    "set_api_proxy_config",
    "set_auto_switch",
    "set_hotspot_enabled",
    "set_image_compat",
    "set_usage_refresh_interval",
    "test_api_proxy_config",
  ];

  const systemServiceText = readRequired(join(servicesRoot, "system", "index.ts"));
  for (const command of systemCommands) {
    if (!systemServiceText.includes(`"${command}"`)) {
      failures.push(`src/services/system/index.ts 缺少 system IPC wrapper：${command}`);
    }
  }

  for (const moduleId of ["maintenance", "settings", "daemon-autoswitch"]) {
    const servicePath = join(servicesRoot, moduleId, "index.ts");
    const text = readRequired(servicePath);
    if (!text.includes("@/services/system")) {
      failures.push(`${repoPath(servicePath)} 必须通过 systemService 承接 system IPC`);
    }
    for (const command of systemCommands) {
      if (text.includes(`"${command}"`) || text.includes(`'${command}'`)) {
        failures.push(`${repoPath(servicePath)} 不得直接包装 system IPC：${command}`);
      }
    }
  }

  console.log("PASS system service facade owner 收口");
}

function validateNoBypassIpcInComponents() {
  const componentFiles = walkFiles(featuresRoot, (file) => {
    const normalized = repoPath(file);
    return normalized.includes("/components/") && /\.(ts|tsx)$/.test(file);
  });

  for (const file of componentFiles) {
    const text = readRequired(file);
    assertNotMatches(repoPath(file), text, [
      [/@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "业务组件不得绕过模块 hook/service 直接拼 IPC"],
      [/@\/lib\/api/, "业务组件不得直接消费全局 API 门面"],
    ]);
  }

  console.log(`PASS 业务组件 IPC 边界：${componentFiles.length}/${componentFiles.length}`);
}

function validateNoGlobalApiInFeatureHooks() {
  const hookFiles = walkFiles(featuresRoot, (file) => {
    const normalized = repoPath(file);
    return normalized.endsWith("/hooks/index.ts") || normalized.endsWith("/hooks/index.tsx");
  });

  for (const file of hookFiles) {
    const text = readRequired(file);
    assertNotMatches(repoPath(file), text, [
      [/@\/lib\/api/, "模块 hook 不得直接消费全局 API 门面，必须经模块 service wrapper"],
      [/@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/, "模块 hook 不得绕过 service 直接拼 IPC"],
    ]);
  }

  console.log(`PASS 模块 hook service 边界：${hookFiles.length}/${hookFiles.length}`);
}

function validateTanStackOwners() {
  const ownerFiles = walkFiles(featuresRoot, (file) => {
    if (!/\.(ts|tsx)$/.test(file)) return false;
    const normalized = repoPath(file);
    if (normalized.includes("/_shared/")) return false;
    if (normalized.includes("/hooks/") || normalized.includes("/cache/")) return false;
    return (
      normalized.includes("/components/") ||
      normalized.includes("/panels/") ||
      normalized.includes("/dialogs/") ||
      normalized.endsWith("/Content.tsx") ||
      normalized.endsWith("/Provider.tsx") ||
      normalized.endsWith("/StoreUpdater.tsx")
    );
  });

  for (const file of ownerFiles) {
    const text = readRequired(file);
    assertNotMatches(repoPath(file), text, [
      [/\buse(Query|Mutation|QueryClient)\b/, "TanStack query/mutation 只能归 hooks/cache owner"],
      [/\b(setQueryData|invalidateQueries|cancelQueries)\b/, "TanStack cache 写入和失效只能归 hooks/cache owner"],
    ]);
  }

  console.log(`PASS TanStack owner 边界：${ownerFiles.length}/${ownerFiles.length}`);
}

function validateNoForbiddenReferenceNames() {
  const files = walkFiles(srcRoot, (file) => /\.(css|js|json|jsx|md|mjs|ts|tsx|txt)$/i.test(file));
  files.push(
    ...walkFiles(join(repoRoot, "scripts"), (file) => /\.(js|mjs)$/i.test(file)),
    join(repoRoot, "package.json"),
  );

  for (const file of files) {
    const lower = readRequired(file).toLowerCase();
    for (const forbiddenName of forbiddenReferenceNames) {
      if (lower.includes(forbiddenName.toLowerCase())) {
        failures.push(`${repoPath(file)} 出现外部参考项目名称`);
      }
    }
  }

  console.log("PASS 外部参考项目名未写入前端源码和脚本");
}

function validateNoDuplicatePublicCommonRoots() {
  const forbiddenDirectories = [
    join(srcRoot, "lib" + "s"),
    join(srcRoot, "shared"),
    join(srcRoot, "common"),
    join(srcRoot, "public"),
    join(srcRoot, "shared", "lib"),
  ];

  for (const directory of forbiddenDirectories) {
    if (existsSync(directory)) {
      failures.push(`${repoPath(directory)} 是重复公共库目录；前端公共门面只能归属 src/lib`);
    }
  }

  console.log("PASS 前端公共库目录唯一：src/lib");
}

function validateNoFeaturePublicCommonOwnerRoots() {
  const forbiddenFeatureOwnerNames = new Set(["shared", "common", "public", "lib", "libs"]);
  for (const moduleName of featureModules) {
    const modulePath = join(featuresRoot, moduleName);
    if (!existsSync(modulePath)) continue;
    for (const entry of readdirSync(modulePath, { withFileTypes: true })) {
      if (entry.isDirectory() && forbiddenFeatureOwnerNames.has(entry.name)) {
        failures.push(`${repoPath(join(modulePath, entry.name))} 是模块内重复公共 owner；复杂模块只能使用既定深层 owner`);
      }
    }
  }

  console.log("PASS 前端模块内无重复公共 owner");
}

validateSourceFileNames();
validateNoDuplicatePublicCommonRoots();
validateNoFeaturePublicCommonOwnerRoots();
validateFeatureDeepOwners();
validateAccountsDeepOwnerBoundaries();
validateSessionsDeepOwnerBoundaries();
validateAnalyticsDeepOwnerBoundaries();
validateCustomInstructionsDeepOwnerBoundaries();
validateMcpDeepOwnerBoundaries();
validatePluginsDeepOwnerBoundaries();
validateTrayShellDeepOwnerBoundaries();
validateSettingsDeepOwnerBoundaries();
validateSkillsDeepOwnerBoundaries();
validateRelayDeepOwnerBoundaries();
validateMaintenanceDeepOwnerBoundaries();
validateDaemonAutoswitchDeepOwnerBoundaries();
validateOverviewDeepOwnerBoundaries();
validateRouteShells();
validateFeaturePageShells();
validateServiceOwners();
validateSystemServiceFacadeOwners();
validateNoBypassIpcInComponents();
validateNoGlobalApiInFeatureHooks();
validateTanStackOwners();
validateNoForbiddenReferenceNames();

if (failures.length > 0) {
  console.error("前端 owner 分层验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("前端 owner 分层验证通过。");
