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

    assertIncludes(label, text, ["../hooks"]);
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

validateSourceFileNames();
validateFeatureDeepOwners();
validateRouteShells();
validateFeaturePageShells();
validateServiceOwners();
validateNoBypassIpcInComponents();
validateNoGlobalApiInFeatureHooks();
validateNoForbiddenReferenceNames();

if (failures.length > 0) {
  console.error("前端 owner 分层验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("前端 owner 分层验证通过。");
