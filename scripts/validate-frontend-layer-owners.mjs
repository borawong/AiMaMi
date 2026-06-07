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
validateMcpDeepOwnerBoundaries();
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
