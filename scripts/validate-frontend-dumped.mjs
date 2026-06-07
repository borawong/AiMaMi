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
  routerHits: join(evidenceRoot, "router-hits.jsonl"),
  queryHits: join(evidenceRoot, "query-hits.jsonl"),
  controlFlow: join(evidenceRoot, "frontend-control-flow.jsonl"),
  ipcContracts: join(evidenceRoot, "ipc-contracts.jsonl"),
  contractReport: join(evidenceRoot, "frontend-contract-report.md"),
};

const internalGapFiles = {
  exportsGap: join(
    repoRoot,
    "evidence",
    "full-chain",
    "internal",
    "logic",
    "logic",
    "AIMAMI-109-EXPORTS-FULL-ENUM-GAP.md",
  ),
};

const ipcContractPath = join(repoRoot, "src", "contracts", "ipc", "commands.ts");
const servicesRoot = join(repoRoot, "src", "services");
const featuresRoot = join(repoRoot, "src", "features");
const routesRoot = join(repoRoot, "src", "routes");
const localesRoot = join(repoRoot, "src", "locales");
const backendRoot = join(repoRoot, "src-tauri", "src");
const frontendManifestPath = join(repoRoot, "src", "restoration", "frontend-manifest", "index.ts");

const appShellDesktopMessageQueryContract = {
  source: "assets/index-CL22l5v8.js",
  queryKey: "desktop-message",
  manifestConst: "FRONTEND_DUMPED_APP_SHELL_DESKTOP_MESSAGE_QUERY_MATRIX",
  runtimeOwnerPath: "src/app/runtime/message.ts",
  surfacePath: "src/app/runtime/popover.tsx",
};

const appShellIndexQueryContracts = [
  {
    source: "assets/index-CL22l5v8.js",
    queryKey: "quota-history",
    hitCount: 2,
    module: "accounts",
    status: "owner-closed",
    ownerCachePath: "src/features/accounts/cache/index.ts",
    ownerHookPath: "src/features/accounts/hooks/mutation.ts",
    consumerPath: "src/features/overview/hooks/mutation.ts",
    commands: ["load_snapshot", "refresh_usage_snapshot"],
    ownerFragments: ["AccountsDumpedQueryKeys", "quotaHistory"],
    hookFragments: ["refreshUsageSnapshotMutation", "invalidateAccountsDumpedQueries"],
    consumerFragments: ["refreshUsageMutation", "invalidateOverviewUsageMutationQueries"],
  },
  {
    source: "assets/index-CL22l5v8.js",
    queryKey: "usage-analytics",
    hitCount: 1,
    module: "analytics",
    status: "owner-closed",
    ownerCachePath: "src/features/analytics/cache/index.ts",
    ownerHookPath: "src/features/analytics/hooks/query.ts",
    consumerPath: "src/features/overview/hooks/query.ts",
    commands: ["load_usage_analytics"],
    ownerFragments: ["AnalyticsDumpedQueryKeys", "usage"],
    hookFragments: ["AnalyticsDumpedQueryKeys.usage", "loadUsageAnalytics"],
    consumerFragments: ["usageQuery", "loadUsageAnalytics"],
  },
  {
    source: "assets/index-CL22l5v8.js",
    queryKey: "mcp-servers",
    hitCount: 1,
    module: "mcp",
    status: "owner-closed",
    ownerCachePath: "src/features/mcp/cache/index.ts",
    ownerHookPath: "src/features/mcp/hooks/query.ts",
    consumerPath: "src/features/overview/hooks/query.ts",
    commands: ["load_mcp_servers"],
    ownerFragments: ["MCP_SERVERS_QUERY_KEY", "mcp-servers"],
    hookFragments: ["MCP_SERVERS_QUERY_KEY", "loadServers"],
    consumerFragments: ["mcpQuery", "loadServers"],
  },
  {
    source: "assets/index-CL22l5v8.js",
    queryKey: "installed-skills",
    hitCount: 1,
    module: "skills",
    status: "owner-closed",
    ownerCachePath: "src/features/skills/cache/index.ts",
    ownerHookPath: "src/features/skills/hooks/query.ts",
    consumerPath: "src/features/overview/hooks/query.ts",
    commands: ["load_installed_skills"],
    ownerFragments: ["SKILLS_INSTALLED_QUERY_KEY", "installed-skills"],
    hookFragments: ["SKILLS_INSTALLED_QUERY_KEY", "loadInstalled"],
    consumerFragments: ["skillsQuery", "loadInstalled"],
  },
];

const failures = [];

function toRepoPath(path) {
  return relative(repoRoot, path).replaceAll(sep, "/");
}

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function readRequired(path) {
  if (!existsSync(path)) {
    failures.push(`缺少必需文件：${toRepoPath(path)}`);
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
  if (!existsSync(root)) return [];

  const ignoredDirectories = new Set([".git", "node_modules", "dist", "target"]);
  const pending = [root];
  const files = [];

  while (pending.length > 0) {
    const current = pending.pop();
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

function pascalCase(moduleId) {
  return moduleId
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join("");
}

function camelCase(moduleId) {
  return moduleId.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

function readTextFromFiles(files) {
  return files.map((file) => readRequired(file)).join("\n");
}

function logPass(name, detail) {
  console.log(`PASS ${name}${detail ? `：${detail}` : ""}`);
}

function logFail(name, detail) {
  console.log(`FAIL ${name}${detail ? `：${detail}` : ""}`);
}

function extractRawCommands(contractReport) {
  return unique([...contractReport.matchAll(/^### `([^`]+)`/gm)].map((match) => match[1]));
}

function extractContractCommands(ipcContract) {
  return unique([...ipcContract.matchAll(/"command": "([^"]+)"/g)].map((match) => match[1]));
}

function diffValues(expected, actual) {
  return {
    missing: expected.filter((item) => !actual.includes(item)),
    extra: actual.filter((item) => !expected.includes(item)),
  };
}

function assertExactSet(name, expected, actual) {
  const before = failures.length;
  const diff = diffValues(expected, actual);

  if (diff.missing.length > 0) {
    failures.push(`${name} 缺少：${diff.missing.join(", ")}`);
  }
  if (diff.extra.length > 0) {
    failures.push(`${name} 出现 raw 未登记项：${diff.extra.join(", ")}`);
  }

  if (failures.length === before) {
    logPass(name, `${actual.length}/${expected.length}`);
  } else {
    logFail(name, `${actual.length}/${expected.length}`);
  }
}

function assertCommandsMentioned(name, expected, text) {
  const missing = expected.filter((command) => !text.includes(command));
  if (missing.length === 0) {
    logPass(name, `${expected.length}/${expected.length}`);
    return;
  }

  logFail(name, `${expected.length - missing.length}/${expected.length}`);
  failures.push(`${name} 缺少：${missing.join(", ")}`);
}

function featureIdFromContractPath(file) {
  return file.slice(featuresRoot.length + 1).split(sep)[0];
}

function extractDumpedCommandExport(file) {
  const text = readRequired(file);
  const match = text.match(/export const (DUMPED_[A-Z0-9_]+_COMMANDS) = \[/);
  return match?.[1] ?? "";
}

function assertEvidenceInputs(raw) {
  const before = failures.length;
  const contractReport = readRequired(evidenceFiles.contractReport);

  if (raw.frontendFiles.length === 0) failures.push("frontend-files.txt 为空，无法建立 page chunk 覆盖门禁");
  if (raw.routerHits.length === 0) failures.push("router-hits.jsonl 为空，无法读取 dumped router 证据");
  if (raw.queryHits.length === 0) failures.push("query-hits.jsonl 为空，无法读取 dumped queryKey 证据");
  if (raw.controlFlow.length === 0) failures.push("frontend-control-flow.jsonl 为空，无法读取 dumped UI 控制流证据");
  if (raw.ipcContracts.length === 0) failures.push("ipc-contracts.jsonl 为空，无法校验 assets/index 命令来源登记");
  if (!contractReport.trim()) failures.push("frontend-contract-report.md 为空，无法读取 dumped IPC 合同");

  if (failures.length === before) {
    logPass(
      "raw frontend evidence 输入",
      `frontend-files ${raw.frontendFiles.length}，router-hits ${raw.routerHits.length}，query-hits ${raw.queryHits.length}，control-flow ${raw.controlFlow.length}，ipc-contracts ${raw.ipcContracts.length}`,
    );
  } else {
    logFail("raw frontend evidence 输入", "存在缺失或空文件");
  }
}

function collectRawPageModules(frontendFiles, controlFlowRows) {
  const moduleByChunk = new Map();
  const pageChunkPattern = /^assets\/([a-z0-9-]+)-(?:page|panel)-[^/]+\.js$/;

  for (const file of frontendFiles.map(normalizePath)) {
    const match = file.match(pageChunkPattern);
    if (match) moduleByChunk.set(file, match[1]);
  }

  for (const row of controlFlowRows) {
    const file = normalizePath(String(row.component_file ?? ""));
    const match = file.match(pageChunkPattern);
    if (match) moduleByChunk.set(file, match[1]);
  }

  return [...moduleByChunk.entries()]
    .map(([chunk, id]) => ({ id, chunk }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function controlFlowCommandsByModule(controlFlowRows, rawModules) {
  const moduleByChunk = new Map(rawModules.map((moduleInfo) => [moduleInfo.chunk, moduleInfo.id]));
  const result = new Map(rawModules.map((moduleInfo) => [moduleInfo.id, new Set()]));

  for (const row of controlFlowRows) {
    const file = normalizePath(String(row.component_file ?? ""));
    const moduleId = moduleByChunk.get(file);
    const command = row.terminal_call?.command;
    if (moduleId && typeof command === "string" && command.length > 0) {
      result.get(moduleId)?.add(command);
    }
  }

  return new Map([...result.entries()].map(([moduleId, commands]) => [moduleId, [...commands].sort()]));
}

function assertFeatureEntrypoints(contractFiles) {
  const before = failures.length;

  for (const contractFile of contractFiles) {
    const featureId = featureIdFromContractPath(contractFile);
    const exportedName = extractDumpedCommandExport(contractFile);
    const contentPath = join(featuresRoot, featureId, "Content.tsx");

    if (!existsSync(contentPath)) {
      failures.push(`模块 Content 入口不存在：${featureId}`);
      continue;
    }

    const content = readRequired(contentPath);
    const hasBoundary = content.includes("DumpedContractBoundary");
    const hasModuleId = content.includes(`moduleId="${featureId}"`);
    const hasCommands = exportedName.length > 0 && content.includes(exportedName);

    if (!hasBoundary) failures.push(`${featureId} Content 缺少 DumpedContractBoundary 合同边界`);
    if (!hasModuleId) failures.push(`${featureId} Content 缺少 moduleId="${featureId}"`);
    if (!hasCommands) failures.push(`${featureId} Content 缺少 ${exportedName || "dumped commands export"}`);
  }

  if (failures.length === before) {
    logPass("模块 Content 合同边界", `${contractFiles.length}/${contractFiles.length}`);
  } else {
    logFail("模块 Content 合同边界", `${contractFiles.length - (failures.length - before)}/${contractFiles.length}`);
  }
}

function assertFeatureContracts(rawCommands) {
  const contractFiles = walkFiles(featuresRoot, (file) => file.endsWith("contract.ts"));
  const text = readTextFromFiles(contractFiles);
  assertCommandsMentioned("模块 contract 命令覆盖", rawCommands, text);
  assertFeatureEntrypoints(contractFiles);
}

function extractCommandBlocks(source) {
  const blocks = new Map();
  const pattern = /\{\s*"command":\s*"([^"]+)"([\s\S]*?)\n\s*\}/g;
  for (const match of source.matchAll(pattern)) {
    blocks.set(match[1], match[0]);
  }
  return blocks;
}

function extractStringArray(block, field) {
  const match = block.match(new RegExp(`"${field}"\\s*:\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]).sort();
}

function extractTsConstArrayBlocks(source, constName) {
  const marker = `export const ${constName} = [`;
  const start = source.indexOf(marker);
  if (start === -1) {
    failures.push(`frontend manifest 缺少 ${constName} 显式清单`);
    return [];
  }

  const arrayStart = source.indexOf("[", start);
  const arrayEnd = source.indexOf("] as const", arrayStart);
  if (arrayStart === -1 || arrayEnd === -1) {
    failures.push(`frontend manifest ${constName} 清单边界无法解析`);
    return [];
  }

  const blocks = [];
  const body = source.slice(arrayStart + 1, arrayEnd);
  let depth = 0;
  let blockStart = -1;
  let inString = false;
  let escaping = false;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") {
      if (depth === 0) blockStart = index;
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0 && blockStart !== -1) {
        blocks.push(body.slice(blockStart, index + 1));
        blockStart = -1;
      }
    }
  }

  if (depth !== 0) {
    failures.push(`frontend manifest ${constName} 清单对象括号不闭合`);
  }

  return blocks;
}

function extractTsStringField(block, field) {
  return block.match(new RegExp(`${field}:\\s*"([^"]*)"`))?.[1] ?? "";
}

function extractTsNumberField(block, field) {
  const value = block.match(new RegExp(`${field}:\\s*(\\d+)`))?.[1];
  return value ? Number(value) : NaN;
}

function extractTsStringArrayField(block, field) {
  const match = block.match(new RegExp(`${field}:\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]).sort();
}

function resolveRepoPath(repoPath) {
  return join(repoRoot, ...repoPath.split("/"));
}

function hasAnyFragment(text, fragments) {
  const lowerText = text.toLowerCase();
  return fragments.some((fragment) => lowerText.includes(fragment.toLowerCase()));
}

function rawQueryHitText(hit) {
  return `${hit.match ?? ""}\n${hit.snippet ?? ""}`;
}

function rawQueryHitHasKey(hit, queryKey) {
  return new RegExp(`queryKey\\s*:\\s*\\[\\s*["']${queryKey}["']\\s*\\]`).test(
    rawQueryHitText(hit),
  );
}

function rawQueryHitMatchHasKey(hit, queryKey) {
  return new RegExp(`queryKey\\s*:\\s*\\[\\s*["']${queryKey}["']\\s*\\]`).test(
    String(hit.match ?? ""),
  );
}

function isAppShellDesktopMessageQueryHit(hit) {
  return (
    normalizePath(String(hit.file ?? "")) === appShellDesktopMessageQueryContract.source &&
    rawQueryHitMatchHasKey(hit, appShellDesktopMessageQueryContract.queryKey)
  );
}

function appShellIndexQueryContractForHit(hit) {
  const file = normalizePath(String(hit.file ?? ""));
  return appShellIndexQueryContracts.find(
    (contract) => file === contract.source && rawQueryHitMatchHasKey(hit, contract.queryKey),
  );
}

function unexplainedReturnNullLines(text) {
  const lines = text.split(/\r?\n/);
  return lines
    .map((line, index) => {
      if (!/\breturn\s+null\s*;/.test(line)) return null;
      const context = lines
        .slice(Math.max(0, index - 2), Math.min(lines.length, index + 3))
        .join("\n")
        .toLowerCase();
      const explained =
        context.includes("source-only") ||
        context.includes("endpoint") ||
        context.includes("证据") ||
        context.includes("边界") ||
        context.includes("空 payload");
      return explained ? null : index + 1;
    })
    .filter(Boolean);
}

function extractArgKeysForCommand(source, command) {
  const commandIndex = source.indexOf(`"command": "${command}"`);
  if (commandIndex === -1) return [];
  const nextCommandIndex = source.indexOf('"command": "', commandIndex + command.length + 12);
  const block = source.slice(
    commandIndex,
    nextCommandIndex === -1 ? source.length : nextCommandIndex,
  );
  return extractStringArray(block, "argKeys");
}

function extractVoiceGapCommands() {
  const text = readRequired(internalGapFiles.exportsGap);
  const voiceSection = text.match(/### Voice\n([\s\S]*?)(?:\n## |\n### |$)/)?.[1] ?? "";
  const commands = unique([...voiceSection.matchAll(/- `([^`]+)`/g)].map((match) => match[1]));
  if (commands.length !== 34) {
    failures.push(`internal voice gap 命令数量必须为 34，当前解析到 ${commands.length}`);
  }
  return commands;
}

function validatePluginsDumpedContract() {
  const before = failures.length;
  const pluginsContractPath = join(featuresRoot, "plugins", "contract.ts");
  const pluginsServicePath = join(servicesRoot, "plugins", "index.ts");
  const pluginsContentPath = join(featuresRoot, "plugins", "Content.tsx");
  const contract = readRequired(pluginsContractPath);
  const service = readRequired(pluginsServicePath);
  const content = readRequired(pluginsContentPath);
  const commandBlocks = extractCommandBlocks(contract);
  const expected = [
    { command: "list_plugins", argKeys: [], controlFlowCount: 1, serviceArgs: [] },
    {
      command: "toggle_plugin",
      argKeys: ["enabled", "id"],
      controlFlowCount: 1,
      serviceArgs: ["id", "enabled"],
    },
    {
      command: "get_plugin_config",
      argKeys: ["id"],
      controlFlowCount: 0,
      serviceArgs: ["id"],
    },
    {
      command: "update_plugin_config",
      argKeys: ["id", "settings"],
      controlFlowCount: 0,
      serviceArgs: ["id", "settings"],
    },
  ];

  const actualCommands = [...commandBlocks.keys()].sort();
  const expectedCommands = expected.map((item) => item.command).sort();
  const commandDiff = diffValues(expectedCommands, actualCommands);
  if (commandDiff.missing.length > 0 || commandDiff.extra.length > 0) {
    failures.push(
      `plugins dumped contract 命令集合不匹配：missing=${commandDiff.missing.join(", ")} extra=${commandDiff.extra.join(", ")}`,
    );
  }

  for (const item of expected) {
    const block = commandBlocks.get(item.command) ?? "";
    const argKeys = extractStringArray(block, "argKeys");
    const argDiff = diffValues(item.argKeys, argKeys);
    if (argDiff.missing.length > 0 || argDiff.extra.length > 0) {
      failures.push(
        `plugins ${item.command} argKeys 不匹配：missing=${argDiff.missing.join(", ")} extra=${argDiff.extra.join(", ")}`,
      );
    }
    if (!block.includes(`"controlFlowCount": ${item.controlFlowCount}`)) {
      failures.push(`plugins ${item.command} controlFlowCount 必须为 ${item.controlFlowCount}`);
    }
    if (!service.includes(`"${item.command}"`)) {
      failures.push(`plugins service 缺少 raw wrapper：${item.command}`);
    }
    for (const arg of item.serviceArgs) {
      if (!service.includes(arg)) {
        failures.push(`plugins service ${item.command} 缺少参数：${arg}`);
      }
    }
  }

  if (
    !content.includes("DumpedContractBoundary") ||
    !content.includes('moduleId="plugins"') ||
    !content.includes("DUMPED_PLUGINS_COMMANDS")
  ) {
    failures.push("plugins Content 必须挂载 DumpedContractBoundary 和 DUMPED_PLUGINS_COMMANDS");
  }

  if (failures.length === before) {
    logPass("plugins dumped contract 精确门禁", "4/4");
  } else {
    logFail("plugins dumped contract 精确门禁", "存在缺失");
  }
}

function collectIndexAssetCommands(raw) {
  const result = new Map();

  const add = (file, command) => {
    const normalizedFile = normalizePath(String(file ?? ""));
    if (!/^assets\/index-[^/]+\.js$/.test(normalizedFile)) return;
    if (typeof command !== "string" || command.length === 0) return;
    const commands = result.get(normalizedFile) ?? new Set();
    commands.add(command);
    result.set(normalizedFile, commands);
  };

  for (const row of raw.ipcContracts) {
    add(row.file, row.command);
  }
  for (const row of raw.controlFlow) {
    add(row.component_file, row.terminal_call?.command);
  }

  return new Map(
    [...result.entries()].map(([file, commands]) => [file, [...commands].sort()]),
  );
}

function validateIndexAssetSourceManifest(raw, manifest) {
  const before = failures.length;
  const indexFiles = raw.frontendFiles
    .map(normalizePath)
    .filter((file) => /^assets\/index-[^/]+\.js$/.test(file));
  const indexCommandsByFile = collectIndexAssetCommands(raw);
  const blocks = extractTsConstArrayBlocks(
    manifest,
    "FRONTEND_DUMPED_INDEX_ASSET_SOURCES",
  );
  const requiredOwners = [
    { owner: "app-shell", status: "source-only" },
    { owner: "overview", status: "covered" },
    { owner: "custom-instructions", status: "covered" },
    { owner: "daemon-autoswitch", status: "covered" },
    { owner: "tray-shell", status: "covered" },
    { owner: "voice", status: "boundary-only" },
  ];
  const entries = blocks.map((block) => ({
    owner: extractTsStringField(block, "owner"),
    source: extractTsStringField(block, "source"),
    status: extractTsStringField(block, "status"),
    commands: extractTsStringArrayField(block, "commands"),
    feature: extractTsStringField(block, "feature"),
    cache: extractTsStringField(block, "cache"),
    surface: extractTsStringField(block, "surface"),
    note: extractTsStringField(block, "note"),
  }));

  for (const expected of requiredOwners) {
    const entry = entries.find((item) => item.owner === expected.owner);
    if (!entry) {
      failures.push(`assets/index 来源登记缺少归属项：${expected.owner}`);
      continue;
    }
    if (entry.status !== expected.status) {
      failures.push(
        `assets/index 来源登记 ${expected.owner} 状态必须为 ${expected.status}，当前为 ${entry.status || "空"}`,
      );
    }
  }

  for (const entry of entries) {
    if (!/^assets\/index-[^/]+\.js$/.test(entry.source)) {
      failures.push(`assets/index 来源登记 ${entry.owner || "未知归属"} 来源不是 index chunk：${entry.source || "空"}`);
    }
    if (!indexFiles.includes(entry.source)) {
      failures.push(`assets/index 来源登记 ${entry.owner || "未知归属"} 来源不在 frontend-files：${entry.source || "空"}`);
    }
    if (entry.commands.length === 0) {
      failures.push(`assets/index 来源登记 ${entry.owner || "未知归属"} 缺少命令清单`);
    }

    const rawCommands = indexCommandsByFile.get(entry.source) ?? [];
    const missingCommands = entry.commands.filter((command) => !rawCommands.includes(command));
    if (missingCommands.length > 0) {
      failures.push(
        `assets/index 来源登记 ${entry.owner || "未知归属"} 包含 raw 未命中的命令：${missingCommands.join(", ")}`,
      );
    }

    for (const repoPath of [entry.feature, entry.cache, entry.surface].filter(Boolean)) {
      if (!existsSync(resolveRepoPath(repoPath))) {
        failures.push(`assets/index 来源登记 ${entry.owner || "未知归属"} 指向的归属文件不存在：${repoPath}`);
      }
    }

    if (entry.owner === "voice") {
      if (entry.status !== "boundary-only") {
        failures.push("voice assets/index 来源登记必须是 boundary-only");
      }
      if (!entry.note.includes("用户要求的空骨架例外")) {
        failures.push("voice assets/index 来源登记必须写明用户要求的空骨架例外");
      }
    }
  }

  if (failures.length === before) {
    logPass("assets/index 来源显式登记", `${entries.length}/${requiredOwners.length}`);
  } else {
    logFail("assets/index 来源显式登记", "存在缺失或越界登记");
  }
}

function validatePluginsRestorationMatrix(manifest) {
  const before = failures.length;
  const blocks = extractTsConstArrayBlocks(
    manifest,
    "FRONTEND_DUMPED_MODULE_RESTORATION_MATRIX",
  );
  const matrixByCommand = new Map(
    blocks.map((block) => [extractTsStringField(block, "command"), block]),
  );
  const rules = [
    {
      command: "get_plugin_config",
      source: "assets/index-CL22l5v8.js",
      status: "contract-service-only",
      service: "src/services/plugins/index.ts",
      contract: "src/features/plugins/contract.ts",
      types: "src/features/plugins/types/index.ts",
      serviceFragments: ['"get_plugin_config"', "PluginsConfigEnvelope", "{ id }"],
      contractFragments: ['"command": "get_plugin_config"', '"controlFlowCount": 0'],
    },
    {
      command: "update_plugin_config",
      source: "assets/index-CL22l5v8.js",
      status: "contract-service-only",
      service: "src/services/plugins/index.ts",
      contract: "src/features/plugins/contract.ts",
      types: "src/features/plugins/types/index.ts",
      serviceFragments: [
        '"update_plugin_config"',
        "PluginsConfigEnvelope",
        "{ id, settings }",
      ],
      contractFragments: ['"command": "update_plugin_config"', '"controlFlowCount": 0'],
    },
  ];
  const pluginsOwnerPaths = [
    "src/features/plugins/hooks/index.ts",
    "src/features/plugins/hooks/query.ts",
    "src/features/plugins/hooks/refresh.ts",
    "src/features/plugins/hooks/mutation.ts",
    "src/features/plugins/hooks/page.ts",
    "src/features/plugins/components/page.tsx",
    "src/features/plugins/panels/page.tsx",
    "src/features/plugins/dialogs/index.ts",
  ];
  const forbiddenUiConsumptionSignals = [
    "PluginConfigDialog",
    "configDialog",
    "openForPlugin",
    "loadConfigMutation",
    "updatePluginConfigMutation",
    "usePluginConfigQuery",
    "usePluginsConfigMutation",
    "pluginsService.getConfig",
    "pluginsService.updateConfig",
    "getPluginsConfigQueryKey",
    "writePluginsConfigQueryPayload",
    "beginPluginsConfigMutation",
    "rollbackPluginsConfig",
    "PluginsConfigSection",
    "getPluginConfig",
    "updatePluginConfig",
    "pluginConfigQueryKey",
  ];

  for (const rule of rules) {
    const block = matrixByCommand.get(rule.command);
    if (!block) {
      failures.push(`plugins 模块还原矩阵缺少命令：${rule.command}`);
      continue;
    }

    for (const field of ["source", "status", "service", "contract", "types"]) {
      const actual = extractTsStringField(block, field);
      if (actual !== rule[field]) {
        failures.push(
          `plugins 模块还原矩阵 ${rule.command} 的 ${field} 必须为 ${rule[field]}，当前为 ${actual || "空"}`,
        );
      }
    }

    const service = readRequired(resolveRepoPath(rule.service));
    const contract = readRequired(resolveRepoPath(rule.contract));
    const types = readRequired(resolveRepoPath(rule.types));

    for (const fragment of rule.serviceFragments) {
      if (!service.includes(fragment)) {
        failures.push(`plugins ${rule.command} service wrapper 缺少：${fragment}`);
      }
    }
    for (const fragment of rule.contractFragments) {
      if (!contract.includes(fragment)) {
        failures.push(`plugins ${rule.command} dumped contract 缺少：${fragment}`);
      }
    }
    if (
      !types.includes("export type PluginsConfigEnvelope = ServicePluginsConfigEnvelope") ||
      !types.includes("RuntimeExtensionConfigPayload")
    ) {
      failures.push("plugins typed config envelope 必须保留在模块 types 合同层");
    }
  }

  for (const ownerPath of pluginsOwnerPaths) {
    const ownerText = readRequired(resolveRepoPath(ownerPath));
    for (const signal of forbiddenUiConsumptionSignals) {
      if (ownerText.includes(signal)) {
        failures.push(`plugins 缺少可见配置 UI caller，${ownerPath} 不得消费 ${signal}`);
      }
    }
  }
  if (existsSync(resolveRepoPath("src/features/plugins/dialogs/config.tsx"))) {
    failures.push("plugins 缺少可见配置 UI caller，不得保留 src/features/plugins/dialogs/config.tsx");
  }

  if (failures.length === before) {
    logPass("plugins raw asset 到模块还原矩阵", `${rules.length}/${rules.length}`);
  } else {
    logFail("plugins raw asset 到模块还原矩阵", "存在 config 合同缺失或 UI owner 越界");
  }
}

function validateAppShellRemoteSecretRestorationMatrix(raw, manifest) {
  const before = failures.length;
  const source = "assets/index-CL22l5v8.js";
  const servicePath = "src/services/system/index.ts";
  const runtimeOwnerPath = "src/app/runtime/secret.ts";
  const initializerPath = "src/app/runtime/initializer.tsx";
  const rules = [
    {
      command: "import_remote_device_secret_if_empty",
      serviceWrapper: "importRemoteDeviceSecretIfEmpty",
    },
    {
      command: "get_or_create_remote_device_secret",
      serviceWrapper: "getOrCreateRemoteDeviceSecret",
    },
  ];
  const blocks = extractTsConstArrayBlocks(
    manifest,
    "FRONTEND_DUMPED_APP_SHELL_REMOTE_SECRET_RESTORATION_MATRIX",
  );
  const matrixByCommand = new Map(
    blocks.map((block) => [extractTsStringField(block, "command"), block]),
  );
  const indexCommands = collectIndexAssetCommands(raw).get(source) ?? [];

  for (const rule of rules) {
    const hasIndexIpcContract = raw.ipcContracts.some(
      (row) => normalizePath(String(row.file ?? "")) === source && row.command === rule.command,
    );
    const hasIndexControlFlow = raw.controlFlow.some(
      (row) =>
        normalizePath(String(row.component_file ?? "")) === source &&
        row.terminal_call?.command === rule.command,
    );

    if (!indexCommands.includes(rule.command)) {
      failures.push(`app-shell remote secret 命令必须来自 index chunk：${rule.command}`);
    }
    if (!hasIndexIpcContract) {
      failures.push(`ipc-contracts 缺少来自 ${source} 的 app-shell remote secret 命令：${rule.command}`);
    }
    if (!hasIndexControlFlow) {
      failures.push(`frontend-control-flow 缺少来自 ${source} 的 app-shell remote secret 命令：${rule.command}`);
    }

    const block = matrixByCommand.get(rule.command);
    if (!block) {
      failures.push(`app-shell remote secret 还原矩阵缺少命令：${rule.command}`);
      continue;
    }

    const expectedFields = {
      module: "app-shell",
      source,
      status: "covered",
      service: servicePath,
      runtimeOwner: runtimeOwnerPath,
      initializer: initializerPath,
    };
    for (const [field, expected] of Object.entries(expectedFields)) {
      const actual = extractTsStringField(block, field);
      if (actual !== expected) {
        failures.push(
          `app-shell remote secret 还原矩阵 ${rule.command} 的 ${field} 必须为 ${expected}，当前为 ${actual || "空"}`,
        );
      }
    }
  }

  for (const repoPath of [servicePath, runtimeOwnerPath, initializerPath]) {
    if (!existsSync(resolveRepoPath(repoPath))) {
      failures.push(`app-shell remote secret 还原落点不存在：${repoPath}`);
    }
  }

  const service = readRequired(resolveRepoPath(servicePath));
  if (service.trim()) {
    for (const rule of rules) {
      if (!service.includes(`"${rule.command}"`)) {
        failures.push(`system service 缺少 app-shell remote secret IPC 命令：${rule.command}`);
      }
      if (!service.includes(rule.serviceWrapper)) {
        failures.push(`system service 缺少 app-shell remote secret wrapper：${rule.serviceWrapper}`);
      }
    }
  }

  const runtimeOwner = readRequired(resolveRepoPath(runtimeOwnerPath));
  if (runtimeOwner.trim()) {
    const runtimeRequirements = [
      {
        name: "localStorage 读取旧 secret",
        ok: runtimeOwner.includes("localStorage") && /\bgetItem\s*\(/.test(runtimeOwner),
      },
      {
        name: "导入后移除旧 secret",
        ok: runtimeOwner.includes("localStorage") && /\bremoveItem\s*\(/.test(runtimeOwner),
      },
      {
        name: "调用 importRemoteDeviceSecretIfEmpty",
        ok: runtimeOwner.includes("systemService.importRemoteDeviceSecretIfEmpty"),
      },
      {
        name: "调用 getOrCreateRemoteDeviceSecret",
        ok: runtimeOwner.includes("systemService.getOrCreateRemoteDeviceSecret"),
      },
      {
        name: "写入 QueryClient 缓存",
        ok: /\.setQueryData(?:<[^>]+>)?\s*\(/.test(runtimeOwner),
      },
    ];

    for (const requirement of runtimeRequirements) {
      if (!requirement.ok) {
        failures.push(`app-shell remote secret runtime owner 缺少：${requirement.name}`);
      }
    }
  }

  const initializer = readRequired(resolveRepoPath(initializerPath));
  if (initializer.trim() && runtimeOwner.trim()) {
    const importsRuntimeOwner = hasAnyFragment(initializer, [
      "@/app/runtime/secret",
      "./secret",
    ]);
    const exportedOwnerNames = unique([
      ...[...runtimeOwner.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)].map(
        (match) => match[1],
      ),
      ...[...runtimeOwner.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=/g)].map(
        (match) => match[1],
      ),
    ]);
    const callsRuntimeOwner = exportedOwnerNames.some((name) =>
      new RegExp(`\\b${name}\\s*\\(`).test(initializer),
    );

    if (!importsRuntimeOwner) {
      failures.push("RuntimeInitializer 必须导入 app-shell remote secret runtime owner");
    }
    if (exportedOwnerNames.length === 0) {
      failures.push("app-shell remote secret runtime owner 必须导出 initializer 可调用的函数");
    } else if (!callsRuntimeOwner) {
      failures.push(
        `RuntimeInitializer 必须调用 app-shell remote secret runtime owner 导出函数：${exportedOwnerNames.join(", ")}`,
      );
    }
  }

  if (failures.length === before) {
    logPass("app-shell remote secret index chunk 还原矩阵", `${rules.length}/${rules.length}`);
  } else {
    logFail("app-shell remote secret index chunk 还原矩阵", "存在 raw、落点或启动链路缺失");
  }
}

function validateAppShellDesktopMessageQueryMatrix(raw, manifest) {
  const before = failures.length;
  const contract = appShellDesktopMessageQueryContract;
  const hits = raw.queryHits.filter(isAppShellDesktopMessageQueryHit);

  if (hits.length === 0) {
    failures.push(
      `${contract.source} 必须在 query-hits.jsonl 中命中 queryKey:["${contract.queryKey}"]，不能只把 app-shell query 计为跳过。`,
    );
  }

  const blocks = extractTsConstArrayBlocks(manifest, contract.manifestConst);
  const entries = blocks.map((block) => ({
    module: extractTsStringField(block, "module"),
    source: extractTsStringField(block, "source"),
    queryKey: extractTsStringField(block, "queryKey"),
    status: extractTsStringField(block, "status"),
    runtimeOwner: extractTsStringField(block, "runtimeOwner"),
    surface: extractTsStringField(block, "surface"),
    reason: extractTsStringField(block, "reason"),
  }));
  const entry = entries.find((item) => item.queryKey === contract.queryKey);

  if (!entry) {
    failures.push(
      `frontend manifest 缺少 ${contract.queryKey} app-shell query closure 显式登记。`,
    );
  } else {
    const expectedFields = {
      module: "app-shell",
      source: contract.source,
      status: "source-only",
      runtimeOwner: contract.runtimeOwnerPath,
      surface: contract.surfacePath,
    };
    for (const [field, expected] of Object.entries(expectedFields)) {
      const actual = entry[field];
      if (actual !== expected) {
        failures.push(
          `desktop-message query matrix 的 ${field} 必须为 ${expected}，当前为 ${actual || "空"}。`,
        );
      }
    }
    if (
      !entry.reason.includes("source-only") ||
      !hasAnyFragment(entry.reason, ["endpoint", "端点", "证据"])
    ) {
      failures.push(
        "desktop-message query matrix 必须写明 source-only 原因，且说明 evidence 没有可审计 endpoint。",
      );
    }
  }

  for (const repoPath of [contract.runtimeOwnerPath, contract.surfacePath]) {
    if (!existsSync(resolveRepoPath(repoPath))) {
      failures.push(`desktop-message query closure 指向的文件不存在：${repoPath}`);
    }
  }

  const runtimeOwner = readRequired(resolveRepoPath(contract.runtimeOwnerPath));
  if (runtimeOwner.trim()) {
    const runtimeRequirements = [
      {
        name: "DESKTOP_MESSAGE_QUERY_KEY",
        ok: runtimeOwner.includes("DESKTOP_MESSAGE_QUERY_KEY"),
      },
      {
        name: "DESKTOP_MESSAGE_STALE_TIME",
        ok: runtimeOwner.includes("DESKTOP_MESSAGE_STALE_TIME"),
      },
      {
        name: "显式 source-only 状态",
        ok:
          runtimeOwner.includes("DESKTOP_MESSAGE_SOURCE_STATUS") &&
          runtimeOwner.includes('"source-only"'),
      },
      {
        name: "显式 source-only 原因",
        ok:
          runtimeOwner.includes("DESKTOP_MESSAGE_SOURCE_REASON") &&
          hasAnyFragment(runtimeOwner, ["missingAuditableEndpoint", "endpoint", "端点"]),
      },
    ];

    for (const requirement of runtimeRequirements) {
      if (!requirement.ok) {
        failures.push(`desktop-message runtime owner 缺少：${requirement.name}`);
      }
    }

    const hasCacheWrite =
      runtimeOwner.includes("QueryClient") &&
      runtimeOwner.includes("DESKTOP_MESSAGE_QUERY_KEY") &&
      /\.setQueryData(?:<[^>]+>)?\s*\(/.test(runtimeOwner);
    const hasOwnerHook =
      /\buseQuery\s*\(/.test(runtimeOwner) &&
      /queryKey:\s*DESKTOP_MESSAGE_QUERY_KEY/.test(runtimeOwner);
    if (!hasCacheWrite && !hasOwnerHook) {
      failures.push(
        "desktop-message runtime owner 必须包含 QueryClient cache write 或 useQuery owner hook。",
      );
    }

    const returnNullLines = unexplainedReturnNullLines(runtimeOwner);
    if (returnNullLines.length > 0) {
      failures.push(
        `desktop-message runtime owner 禁止无说明的 return null stub：${contract.runtimeOwnerPath}:${returnNullLines.join(", ")}`,
      );
    }
  }

  const surface = readRequired(resolveRepoPath(contract.surfacePath));
  if (surface.trim()) {
    const importsOwnerHook =
      /\buseDesktopMessageQuery\b/.test(surface) &&
      /from\s+["'](?:\.\/message|@\/app\/runtime\/message)["']/.test(surface);
    if (!importsOwnerHook) {
      failures.push(
        "desktop-message popover 必须通过 message runtime owner hook 消费查询结果。",
      );
    }
    if (/\buseQuery\s*\(/.test(surface) || /@tanstack\/react-query/.test(surface)) {
      failures.push(
        "desktop-message popover 不得直接 import 或调用 useQuery，查询归属必须留在 message owner。",
      );
    }
    if (
      /\bqueryKey\s*:/.test(surface) ||
      surface.includes('["desktop-message"]') ||
      surface.includes("['desktop-message']") ||
      surface.includes("DESKTOP_MESSAGE_QUERY_KEY")
    ) {
      failures.push("desktop-message popover 不得直接拼 queryKey 或消费 query key 常量。");
    }
  }

  if (failures.length === before) {
    logPass("app-shell desktop-message query closure", `${hits.length}/${hits.length}`);
  } else {
    logFail("app-shell desktop-message query closure", "存在 evidence、manifest 或 runtime owner 缺口");
  }
}

function validateAppShellIndexQueryMatrix(raw, manifest) {
  const before = failures.length;
  const blocks = extractTsConstArrayBlocks(
    manifest,
    "FRONTEND_DUMPED_APP_SHELL_INDEX_QUERY_MATRIX",
  );
  const entries = blocks.map((block) => ({
    module: extractTsStringField(block, "module"),
    source: extractTsStringField(block, "source"),
    queryKey: extractTsStringField(block, "queryKey"),
    hitCount: extractTsNumberField(block, "hitCount"),
    status: extractTsStringField(block, "status"),
    ownerCache: extractTsStringField(block, "ownerCache"),
    ownerHook: extractTsStringField(block, "ownerHook"),
    consumer: extractTsStringField(block, "consumer"),
    commands: extractTsStringArrayField(block, "commands"),
    reason: extractTsStringField(block, "reason"),
  }));

  const uniqueKeys = new Set(entries.map((entry) => entry.queryKey));
  if (uniqueKeys.size !== entries.length) {
    failures.push("app-shell index query matrix 不允许重复登记同一个 queryKey。");
  }

  for (const contract of appShellIndexQueryContracts) {
    const hits = raw.queryHits.filter(
      (hit) =>
        normalizePath(String(hit.file ?? "")) === contract.source &&
        rawQueryHitMatchHasKey(hit, contract.queryKey),
    );
    if (hits.length !== contract.hitCount) {
      failures.push(
        `${contract.queryKey} app-shell/index raw hit 数量必须为 ${contract.hitCount}，当前为 ${hits.length}。`,
      );
    }

    const entry = entries.find((item) => item.queryKey === contract.queryKey);
    if (!entry) {
      failures.push(`app-shell index query matrix 缺少 ${contract.queryKey}。`);
      continue;
    }

    const expectedFields = {
      module: contract.module,
      source: contract.source,
      status: contract.status,
      ownerCache: contract.ownerCachePath,
      ownerHook: contract.ownerHookPath,
      consumer: contract.consumerPath,
    };
    for (const [field, expected] of Object.entries(expectedFields)) {
      const actual = entry[field];
      if (actual !== expected) {
        failures.push(
          `${contract.queryKey} app-shell index query matrix 的 ${field} 必须为 ${expected}，当前为 ${actual || "空"}。`,
        );
      }
    }

    if (entry.hitCount !== contract.hitCount) {
      failures.push(
        `${contract.queryKey} app-shell index query matrix 的 hitCount 必须为 ${contract.hitCount}，当前为 ${Number.isNaN(entry.hitCount) ? "空" : entry.hitCount}。`,
      );
    }

    for (const command of contract.commands) {
      if (!entry.commands.includes(command)) {
        failures.push(`${contract.queryKey} app-shell index query matrix 缺少命令 ${command}。`);
      }
    }

    if (!hasAnyFragment(entry.reason, ["归属", "owner", "app-shell", "index"])) {
      failures.push(`${contract.queryKey} app-shell index query matrix 必须写明 index 命中如何回到模块归属。`);
    }

    const ownerCache = readRequired(resolveRepoPath(contract.ownerCachePath));
    const ownerHook = readRequired(resolveRepoPath(contract.ownerHookPath));
    const consumer = readRequired(resolveRepoPath(contract.consumerPath));

    for (const fragment of [contract.queryKey, ...contract.ownerFragments]) {
      if (!ownerCache.includes(fragment)) {
        failures.push(`${contract.queryKey} owner cache 缺少 ${fragment}：${contract.ownerCachePath}`);
      }
    }
    for (const fragment of contract.hookFragments) {
      if (!ownerHook.includes(fragment)) {
        failures.push(`${contract.queryKey} owner hook 缺少 ${fragment}：${contract.ownerHookPath}`);
      }
    }
    for (const fragment of contract.consumerFragments) {
      if (!consumer.includes(fragment)) {
        failures.push(`${contract.queryKey} consumer 缺少 ${fragment}：${contract.consumerPath}`);
      }
    }
  }

  const closedCount = raw.queryHits.filter(appShellIndexQueryContractForHit).length;
  const expectedCount = appShellIndexQueryContracts.reduce(
    (total, contract) => total + contract.hitCount,
    0,
  );
  if (closedCount !== expectedCount) {
    failures.push(
      `app-shell index query closure raw hit 数量必须为 ${expectedCount}，当前为 ${closedCount}。`,
    );
  }

  if (failures.length === before) {
    logPass("app-shell index query closure", `${closedCount}/${expectedCount}`);
  } else {
    logFail("app-shell index query closure", "存在 evidence、manifest 或模块 owner 缺口");
  }
}

function validateVoiceManifestBoundary(expectedCommands) {
  const before = failures.length;
  const manifest = readRequired(frontendManifestPath);
  const allVoiceBlocks = [...manifest.matchAll(/  \{\s+module: "voice",[\s\S]*?\n  \},/g)].map(
    (match) => match[0],
  );
  const voiceBlocks = allVoiceBlocks.filter((block) => /command: "[^"]+"/.test(block));
  const manifestCommands = unique(
    voiceBlocks
      .map((block) => block.match(/command: "([^"]+)"/)?.[1])
      .filter(Boolean),
  );
  const diff = diffValues(expectedCommands, manifestCommands);
  const forbiddenFragments = [
    "已覆盖",
    "读取",
    "保存",
    "开始捕获",
    "停止捕获",
    "文本注入",
    "动作已覆盖",
  ];
  const exceptionBlocks = extractTsConstArrayBlocks(
    manifest,
    "FRONTEND_DUMPED_BOUNDARY_EXCEPTIONS",
  );
  const voiceException = exceptionBlocks.find((block) => extractTsStringField(block, "module") === "voice");

  if (diff.missing.length > 0 || diff.extra.length > 0) {
    failures.push(
      `voice manifest 命令集合必须只登记空骨架边界：missing=${diff.missing.join(", ")} extra=${diff.extra.join(", ")}`,
    );
  }

  if (!voiceException) {
    failures.push("voice manifest 缺少用户要求的 boundary-only 空骨架例外登记");
  } else {
    const status = extractTsStringField(voiceException, "status");
    const source = extractTsStringField(voiceException, "source");
    const reason = extractTsStringField(voiceException, "reason");
    if (status !== "boundary-only") {
      failures.push(`voice boundary-only 例外状态必须为 boundary-only，当前为 ${status || "空"}`);
    }
    if (source !== "用户要求") {
      failures.push(`voice boundary-only 例外来源必须标为用户要求，当前为 ${source || "空"}`);
    }
    if (!reason.includes("空骨架") || !reason.includes("不得标为")) {
      failures.push("voice boundary-only 例外原因必须说明空骨架且不得标为已还原");
    }
  }

  for (const block of voiceBlocks) {
    const command = block.match(/command: "([^"]+)"/)?.[1] ?? "未知命令";
    if (/status: "covered"/.test(block)) {
      failures.push(`voice manifest 不得将命令标记为 covered：${command}`);
    }
    if (block.includes("voice-page")) {
      failures.push(`voice manifest 不得指向旧业务页面 voice-page：${command}`);
    }
    if (block.includes("src/features/voice/hooks")) {
      failures.push(`voice manifest 不得指向旧 Hook：${command}`);
    }
    for (const fragment of forbiddenFragments) {
      if (block.includes(fragment)) {
        failures.push(`voice manifest 不得包含业务完成语义“${fragment}”：${command}`);
      }
    }
  }

  if (failures.length === before) {
    logPass("voice manifest 空骨架公开清单", `${voiceBlocks.length}/${expectedCommands.length}`);
  } else {
    logFail("voice manifest 空骨架公开清单", "存在越界语义");
  }
}

function validateVoiceReopenedContract() {
  {
    const before = failures.length;
    const expectedCommands = extractVoiceGapCommands();
    validateVoiceManifestBoundary(expectedCommands);
    const voiceContractPath = join(featuresRoot, "voice", "contract.ts");
    const voiceServicePath = join(servicesRoot, "voice", "index.ts");
    const voiceContentPath = join(featuresRoot, "voice", "Content.tsx");
    const voiceHooksPath = join(featuresRoot, "voice", "hooks", "index.ts");
    const voicePanelsPath = join(featuresRoot, "voice", "panels", "panels.tsx");
    const voiceCommandPath = join(backendRoot, "commands", "voice.rs");
    const lifecyclePath = join(backendRoot, "adapters", "tauri", "lifecycle.rs");
    const contract = readRequired(voiceContractPath);
    const service = readRequired(voiceServicePath);
    const content = readRequired(voiceContentPath);
    const hooks = readRequired(voiceHooksPath);
    const commandFile = readRequired(voiceCommandPath);
    const lifecycle = readRequired(lifecyclePath);
    const contractBlocks = extractCommandBlocks(contract);
    const actualCommands = [...contractBlocks.keys()].sort();
    const diff = diffValues(expectedCommands, actualCommands);

    if (diff.missing.length > 0 || diff.extra.length > 0) {
      failures.push(
        `voice 空骨架合同命令集合不匹配：missing=${diff.missing.join(", ")} extra=${diff.extra.join(", ")}`,
      );
    }

    for (const snippet of ["#[tauri::command]", "state.services().voice()", "respond("]) {
      if (commandFile.includes(snippet)) {
        failures.push(`voice Rust command 空骨架不得注册真实 IPC 语义：${snippet}`);
      }
    }

    if (lifecycle.includes("commands::voice::")) {
      failures.push("voice Tauri lifecycle 不得注册 commands::voice:: handler");
    }

    if (
      !content.includes("DumpedContractBoundary") ||
      !content.includes('moduleId="voice"') ||
      !content.includes("DUMPED_VOICE_COMMANDS") ||
      !content.includes("skeletonTitle")
    ) {
      failures.push("voice Content 必须只挂载合同边界和空骨架说明");
    }

    for (const snippet of ["invokeIpc", "load_voice_", "upsert_voice_", "start_voice_capture"]) {
      if (service.includes(snippet)) {
        failures.push(`voice service 空骨架不得包含真实 IPC wrapper：${snippet}`);
      }
    }

    for (const command of expectedCommands) {
      if (service.includes(command)) {
        failures.push(`voice service 空骨架不得包含真实 IPC 命令字符串：${command}`);
      }
    }

    for (const snippet of ["useQuery", "useMutation", "voiceService", "writeVoiceMutationPayload"]) {
      if (hooks.includes(snippet)) {
        failures.push(`voice hooks 空骨架不得包含真实查询或 mutation：${snippet}`);
      }
    }

    if (existsSync(voicePanelsPath)) {
      failures.push("voice 空骨架不得保留可操作业务面板 panels.tsx");
    }

    if (failures.length === before) {
      logPass("voice empty skeleton boundary", `${expectedCommands.length}/${expectedCommands.length}`);
    } else {
      logFail("voice empty skeleton boundary", "存在缺失");
    }
    return;
  }

}

function validateRawPageRouteAndContent(rawModules) {
  const before = failures.length;

  for (const moduleInfo of rawModules) {
    const moduleId = moduleInfo.id;
    const pascal = pascalCase(moduleId);
    const routeShellPath = join(routesRoot, "desktop", "main", moduleId, "page.tsx");
    const featureIndexPath = join(featuresRoot, moduleId, "index.ts");
    const featureContentPath = join(featuresRoot, moduleId, "Content.tsx");
    const featurePagePath = join(featuresRoot, moduleId, "components", "page.tsx");

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
      featureIndex.includes(`${pascal}Content`);
    const contentOk =
      featureContent.includes("DumpedContractBoundary") &&
      featureContent.includes(`moduleId="${moduleId}"`);
    const pageOk = featurePage.includes(`export function ${pascal}Page`);

    if (!routeOk) failures.push(`${moduleId} raw page chunk 已存在，但 route shell 未正确挂载 ${pascal}Feature`);
    if (!featureOk) failures.push(`${moduleId} raw page chunk 已存在，但 feature index 未建立 Provider/Content 公共入口`);
    if (!contentOk) failures.push(`${moduleId} raw page chunk 已存在，但 Content 未同时挂载真实 ${pascal}Page 和 dumped 合同边界`);
    if (!pageOk) failures.push(`${moduleId} raw page chunk 已存在，但 components/page.tsx 未导出 ${pascal}Page`);
  }

  if (failures.length === before) {
    logPass("raw page chunk 到 route/Content/page 闭环", `${rawModules.length}/${rawModules.length}`);
  } else {
    logFail("raw page chunk 到 route/Content/page 闭环", `${rawModules.length - (failures.length - before)}/${rawModules.length}`);
  }
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
    const evidence = keyToEvidence.get(key) ?? [];
    evidence.push(`${hit.file}:${hit.line}`);
    keyToEvidence.set(key, evidence);
  }
  return keyToEvidence;
}

function validateRawQueryKeys(queryHits, rawModules) {
  const before = failures.length;
  const querySourceFiles = [
    ...walkFiles(featuresRoot, (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(routesRoot, (file) => /\.(ts|tsx)$/.test(file)),
  ];
  const sourceText = readTextFromFiles(querySourceFiles);
  const moduleChunks = new Set(rawModules.map((moduleInfo) => moduleInfo.chunk));
  const moduleQueryHits = queryHits.filter((hit) =>
    moduleChunks.has(normalizePath(String(hit.file ?? ""))),
  );
  const appShellQueryHits = queryHits.filter(
    (hit) => !moduleChunks.has(normalizePath(String(hit.file ?? ""))),
  );
  const closedAppShellQueryHits = appShellQueryHits.filter(
    (hit) => isAppShellDesktopMessageQueryHit(hit) || appShellIndexQueryContractForHit(hit),
  );
  const unclosedAppShellQueryHits = appShellQueryHits.filter(
    (hit) => !isAppShellDesktopMessageQueryHit(hit) && !appShellIndexQueryContractForHit(hit),
  );
  const keyToEvidence = extractRawQueryKeys(moduleQueryHits);

  let covered = 0;
  for (const [key, evidence] of keyToEvidence.entries()) {
    const found =
      sourceText.includes(`"${key}"`) ||
      sourceText.includes(`'${key}'`) ||
      sourceText.includes(`\`${key}\``);

    if (found) {
      covered += 1;
    } else {
      failures.push(`raw queryKey 未落到 src/features 或 src/routes：${key}（raw：${evidence.join(", ")}）`);
    }
  }

  const total = keyToEvidence.size;
  const detail = `${covered}/${total}${closedAppShellQueryHits.length > 0 ? `，app-shell closure ${closedAppShellQueryHits.length}` : ""}${unclosedAppShellQueryHits.length > 0 ? `，app-shell/index 其他命中 ${unclosedAppShellQueryHits.length}` : ""}`;
  if (failures.length === before) {
    logPass("raw queryKey 到模块 query/cache 覆盖", detail);
  } else {
    logFail("raw queryKey 到模块 query/cache 覆盖", detail);
  }
}

function validateControlFlowOwners(commandsByModule) {
  const before = failures.length;
  let total = 0;
  let covered = 0;

  for (const [moduleId, commands] of commandsByModule.entries()) {
    total += commands.length;
    if (commands.length === 0) {
      failures.push(`${moduleId} raw page chunk 没有 control-flow 命令证据，无法证明 UI action 还原`);
      continue;
    }

    const moduleServiceText = readTextFromFiles(
      walkFiles(join(servicesRoot, moduleId), (file) => /\.(ts|tsx)$/.test(file)),
    );
    const featureOwnerText = readTextFromFiles(
      walkFiles(join(featuresRoot, moduleId), (file) => {
        if (!/\.(ts|tsx)$/.test(file)) return false;
        const normalized = normalizePath(file);
        return !normalized.endsWith("/contract.ts") && !normalized.endsWith("/Content.tsx");
      }),
    );
    const serviceName = `${camelCase(moduleId)}Service`;

    for (const command of commands) {
      const serviceHasCommand =
        moduleServiceText.includes(`"${command}"`) ||
        moduleServiceText.includes(`'${command}'`) ||
        serviceText.includes(`"${command}"`) ||
        serviceText.includes(`'${command}'`);
      const featureUsesService =
        featureOwnerText.includes(serviceName) ||
        featureOwnerText.includes("useQuery") ||
        featureOwnerText.includes("useMutation");

      if (serviceHasCommand && featureUsesService) {
        covered += 1;
      } else {
        if (!serviceHasCommand) {
          failures.push(`${moduleId} control-flow 命令未落到模块 service wrapper：${command}`);
        }
        if (!featureUsesService) {
          failures.push(`${moduleId} control-flow 命令缺少模块 hook/component owner 承接：${command}`);
        }
      }
    }
  }

  if (failures.length === before) {
    logPass("raw control-flow 命令到 service/hook owner 覆盖", `${covered}/${total}`);
  } else {
    logFail("raw control-flow 命令到 service/hook owner 覆盖", `${covered}/${total}`);
  }
}

function validateNoEvidenceUiPlaceholders(rawModules) {
  const before = failures.length;
  const forbiddenSourcePatterns = [
    {
      pattern: /@\/features\/_shared\/panels/,
      reason: "引用 _shared/panels 通用面板，不能证明真实 dumped UI 还原",
    },
    {
      pattern: /@\/features\/_shared\/data/,
      reason: "引用 _shared/data 通用读数器，容易把未知 payload 渲染成占位列表",
    },
    {
      pattern: /\bEvidence(PageHeader|StatusLine|QueryState|Action)\b/,
      reason: "使用 Evidence* 占位组件",
    },
    {
      pattern: /\b(QueryPanel|RecordList|RecordSummary)\b/,
      reason: "使用通用 QueryPanel/RecordList/RecordSummary 代替 dumped 页面结构",
    },
  ];

  for (const moduleInfo of rawModules) {
    const moduleRoot = join(featuresRoot, moduleInfo.id);
    const sourceFiles = walkFiles(moduleRoot, (file) => {
      if (!/\.(ts|tsx)$/.test(file)) return false;
      const normalized = normalizePath(file);
      return (
        !normalized.endsWith("/contract.ts") &&
        !normalized.includes("/__tests__/") &&
        !normalized.endsWith("/AGENTS.md") &&
        !normalized.endsWith("/CLAUDE.md")
      );
    });

    for (const file of sourceFiles) {
      const text = readRequired(file);
      for (const check of forbiddenSourcePatterns) {
        if (check.pattern.test(text)) {
          failures.push(`${moduleInfo.id} 存在 evidence/占位 UI：${toRepoPath(file)}；${check.reason}`);
          break;
        }
      }
    }
  }

  const zh = parseJsonFile(join(localesRoot, "zh.json")) ?? {};
  const en = parseJsonFile(join(localesRoot, "en.json")) ?? {};
  const forbiddenLocaleFragments = [
    "待补全",
    "缺少足够证据",
    "暂不编造",
    "current evidence payload",
    "not have enough evidence",
    "Waiting for path evidence",
  ];

  for (const moduleInfo of rawModules) {
    const localeKey = camelCase(moduleInfo.id);
    for (const [localeName, locale] of [
      ["zh", zh],
      ["en", en],
    ]) {
      const text = JSON.stringify(locale?.[localeKey] ?? {});
      for (const fragment of forbiddenLocaleFragments) {
        if (text.includes(fragment)) {
          failures.push(`${moduleInfo.id} ${localeName} locale 仍包含 evidence/占位文案片段：${fragment}`);
        }
      }
    }
  }

  if (failures.length === before) {
    logPass("raw 模块无 evidence 面板/占位文案", `${rawModules.length}/${rawModules.length}`);
  } else {
    logFail("raw 模块无 evidence 面板/占位文案", `发现 ${failures.length - before} 个占位信号`);
  }
}

function validateRouterEvidence(rawModules, routerHits) {
  const routeRegistryPath = join(routesRoot, "registry", "registry.tsx");
  const routeObjectsPath = join(routesRoot, "registry", "objects.tsx");
  const routeRegistry = readRequired(routeRegistryPath);
  const routeObjects = readRequired(routeObjectsPath);
  const before = failures.length;

  for (const moduleInfo of rawModules) {
    const route = moduleInfo.id;
    const pascal = pascalCase(moduleInfo.id);
    const hasRegistry =
      routeRegistry.includes(`route: "${route}"`) &&
      routeRegistry.includes(`import("@/routes/desktop/main/${route}/page")`) &&
      routeRegistry.includes(`<${pascal}Route`);
    const hasRouteObject = routeObjects.includes("routeDefinitions.map") && routeObjects.includes("RegistryRouteElement");

    if (!hasRegistry) failures.push(`${route} 未在 route registry 中集中声明 route/preload/render`);
    if (!hasRouteObject) failures.push("objects 未通过 routeDefinitions 统一生成 React Router 对象");
  }

  const routerHitText = routerHits
    .map((row) => `${row.match ?? ""}\n${row.snippet ?? ""}`)
    .join("\n");
  if (!routerHitText.trim()) {
    failures.push("router-hits.jsonl 没有可用于 route 交叉验证的命中文本");
  }

  if (failures.length === before) {
    logPass("raw route 证据到 route registry 覆盖", `${rawModules.length}/${rawModules.length}`);
  } else {
    logFail("raw route 证据到 route registry 覆盖", `${rawModules.length - (failures.length - before)}/${rawModules.length}`);
  }
}

const raw = {
  frontendFiles: readRequired(evidenceFiles.frontendFiles)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean),
  routerHits: parseJsonlFile(evidenceFiles.routerHits),
  queryHits: parseJsonlFile(evidenceFiles.queryHits),
  controlFlow: parseJsonlFile(evidenceFiles.controlFlow),
  ipcContracts: parseJsonlFile(evidenceFiles.ipcContracts),
};

assertEvidenceInputs(raw);

const frontendManifest = readRequired(frontendManifestPath);
const contractReport = readRequired(evidenceFiles.contractReport);
const rawCommands = extractRawCommands(contractReport);
const contractCommands = extractContractCommands(readRequired(ipcContractPath));
const serviceFiles = walkFiles(servicesRoot, (file) => /\.(ts|tsx)$/.test(file));
const serviceText = readTextFromFiles(serviceFiles);
const rawModules = collectRawPageModules(raw.frontendFiles, raw.controlFlow);
const commandsByModule = controlFlowCommandsByModule(raw.controlFlow, rawModules);
const voiceSkeletonCommands = extractVoiceGapCommands();
const serviceRequiredCommands = rawCommands.filter(
  (command) => !voiceSkeletonCommands.includes(command),
);

assertExactSet("IPC 合同覆盖 raw dumped 命令", rawCommands, contractCommands);
assertCommandsMentioned("service wrapper 覆盖 raw dumped 命令", serviceRequiredCommands, serviceText);
assertFeatureContracts(rawCommands);
validatePluginsDumpedContract();
validatePluginsRestorationMatrix(frontendManifest);
validateAppShellRemoteSecretRestorationMatrix(raw, frontendManifest);
validateIndexAssetSourceManifest(raw, frontendManifest);
validateAppShellDesktopMessageQueryMatrix(raw, frontendManifest);
validateAppShellIndexQueryMatrix(raw, frontendManifest);
validateVoiceReopenedContract();
validateRawPageRouteAndContent(rawModules);
validateRouterEvidence(rawModules, raw.routerHits);
validateRawQueryKeys(raw.queryHits, rawModules);
validateControlFlowOwners(commandsByModule);
validateNoEvidenceUiPlaceholders(rawModules);

if (failures.length > 0) {
  console.error("前端 dumped 还原验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("前端 dumped 还原验证通过。");
