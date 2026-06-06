import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

// 中文职责说明：从 1.0.9 dumped 前端 raw evidence 验证当前源码的 query、页面 chunk、route 和静态 locale key 覆盖。
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
      `${moduleId}-page.tsx`,
    );
    const featureIndexPath = join(repoRoot, "src", "features", moduleId, "index.ts");
    const featureContentPath = join(repoRoot, "src", "features", moduleId, "Content.tsx");
    const featurePagePath = join(
      repoRoot,
      "src",
      "features",
      moduleId,
      "components",
      `${moduleId}-page.tsx`,
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
  const routeRegistryPath = join(repoRoot, "src", "routes", "registry", "route-registry.tsx");
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
  assertSameArray("route registry visible routes 与 ALL_APP_ROUTES", allAppRoutes, visibleRoutes);
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
