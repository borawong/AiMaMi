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
  if (!contractReport.trim()) failures.push("frontend-contract-report.md 为空，无法读取 dumped IPC 合同");

  if (failures.length === before) {
    logPass(
      "raw frontend evidence 输入",
      `frontend-files ${raw.frontendFiles.length}，router-hits ${raw.routerHits.length}，query-hits ${raw.queryHits.length}，control-flow ${raw.controlFlow.length}`,
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

function validateVoiceReopenedContract() {
  {
    const before = failures.length;
    const expectedCommands = extractVoiceGapCommands();
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

    for (const command of expectedCommands) {
      if (!commandFile.includes(`fn ${command}`)) {
        failures.push(`voice 空骨架 Rust command 缺少 handler：${command}`);
      }
      if (!lifecycle.includes(`commands::voice::${command}`)) {
        failures.push(`voice 空骨架 Tauri lifecycle 未注册 handler：${command}`);
      }
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
  const appShellQueryHits = queryHits.length - moduleQueryHits.length;
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
  const detail = `${covered}/${total}${appShellQueryHits > 0 ? `，跳过 app shell/index 命中 ${appShellQueryHits} 条` : ""}`;
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
};

assertEvidenceInputs(raw);

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
