import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

// 中文职责说明：验证 dumped 前端还原的命令合同、service 门面和模块 owner 清单保持 127/127 覆盖。
const repoRoot = process.cwd();
const rawReportPath = join(
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
  "frontend-contract-report.md",
);
const ipcContractPath = join(repoRoot, "src", "contracts", "ipc", "commands.ts");
const servicesRoot = join(repoRoot, "src", "services");
const featuresRoot = join(repoRoot, "src", "features");

function readUtf8(path) {
  return readFileSync(path, "utf8");
}

function walkFiles(root, predicate) {
  const pending = [root];
  const files = [];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(next);
      } else if (!predicate || predicate(next)) {
        files.push(next);
      }
    }
  }

  return files;
}

function unique(values) {
  return [...new Set(values)].sort();
}

function extractRawCommands() {
  const report = readUtf8(rawReportPath);
  return unique([...report.matchAll(/^### `([^`]+)`/gm)].map((match) => match[1]));
}

function extractContractCommands() {
  const contract = readUtf8(ipcContractPath);
  return unique([...contract.matchAll(/"command": "([^"]+)"/g)].map((match) => match[1]));
}

function extractTextFromFiles(files) {
  return files.map((file) => readUtf8(file)).join("\n");
}

function diffCommands(expected, actual) {
  return {
    missing: expected.filter((command) => !actual.includes(command)),
    extra: actual.filter((command) => !expected.includes(command)),
  };
}

function assertExactCommands(name, expected, actual) {
  const diff = diffCommands(expected, actual);
  if (diff.missing.length === 0 && diff.extra.length === 0) {
    console.log(`PASS ${name}：${actual.length}/${expected.length}`);
    return 0;
  }

  console.log(`FAIL ${name}：${actual.length}/${expected.length}`);
  if (diff.missing.length > 0) {
    console.log(`  缺失：${diff.missing.join(", ")}`);
  }
  if (diff.extra.length > 0) {
    console.log(`  额外：${diff.extra.join(", ")}`);
  }
  return 1;
}

function assertCommandsMentioned(name, expected, text) {
  const missing = expected.filter((command) => !text.includes(command));
  if (missing.length === 0) {
    console.log(`PASS ${name}：${expected.length}/${expected.length}`);
    return 0;
  }

  console.log(`FAIL ${name}：${expected.length - missing.length}/${expected.length}`);
  console.log(`  缺失：${missing.join(", ")}`);
  return 1;
}

function featureIdFromContractPath(file) {
  return file.slice(featuresRoot.length + 1).split(sep)[0];
}

function extractDumpedCommandExport(file) {
  const text = readUtf8(file);
  const match = text.match(/export const (DUMPED_[A-Z0-9_]+_COMMANDS) = \[/);
  return match?.[1] ?? "";
}

function assertFeatureEntrypoints(contractFiles) {
  let failures = 0;

  for (const contractFile of contractFiles) {
    const featureId = featureIdFromContractPath(contractFile);
    const exportedName = extractDumpedCommandExport(contractFile);
    const contentPath = join(featuresRoot, featureId, "Content.tsx");

    if (!existsSync(contentPath)) {
      console.log(`FAIL 模块 Content 入口不存在：${featureId}`);
      failures += 1;
      continue;
    }

    const content = readUtf8(contentPath);
    const hasBoundary = content.includes("DumpedContractBoundary");
    const hasModuleId = content.includes(`moduleId="${featureId}"`);
    const hasCommands = exportedName.length > 0 && content.includes(exportedName);

    if (hasBoundary && hasModuleId && hasCommands) {
      console.log(`PASS 模块 Content 挂载 dumped owner：${featureId}`);
      continue;
    }

    console.log(`FAIL 模块 Content 未挂载 dumped owner：${featureId}`);
    if (!hasBoundary) console.log("  缺少 DumpedContractBoundary");
    if (!hasModuleId) console.log(`  缺少 moduleId="${featureId}"`);
    if (!hasCommands) console.log(`  缺少 ${exportedName || "dumped commands export"}`);
    failures += 1;
  }

  return failures;
}

function assertFeatureContracts(expected) {
  const files = walkFiles(featuresRoot, (file) => file.endsWith("dumped-contract.ts"));
  const text = extractTextFromFiles(files);
  let failures = assertCommandsMentioned("模块 dumped-contract 覆盖", expected, text);

  const expectedFeatureCount = 13;
  if (files.length === expectedFeatureCount) {
    console.log(`PASS 模块 dumped-contract 文件数：${files.length}/${expectedFeatureCount}`);
  } else {
    console.log(`FAIL 模块 dumped-contract 文件数：${files.length}/${expectedFeatureCount}`);
    failures += 1;
  }

  failures += assertFeatureEntrypoints(files);

  return failures;
}

if (!existsSync(rawReportPath)) {
  console.error(`FAIL raw 前端合同报告不存在：${rawReportPath}`);
  process.exit(1);
}
if (!existsSync(ipcContractPath)) {
  console.error(`FAIL IPC 合同文件不存在：${ipcContractPath}`);
  process.exit(1);
}

const rawCommands = extractRawCommands();
const contractCommands = extractContractCommands();
const serviceFiles = walkFiles(servicesRoot, (file) => /\.(ts|tsx)$/.test(file));
const serviceText = extractTextFromFiles(serviceFiles);

let failures = 0;
failures += assertExactCommands("IPC 合同覆盖 raw dumped 命令", rawCommands, contractCommands);
failures += assertCommandsMentioned("service wrapper 覆盖 raw dumped 命令", rawCommands, serviceText);
failures += assertFeatureContracts(rawCommands);

if (failures > 0) {
  console.error(`前端 dumped 还原验证失败：${failures} 项不通过。`);
  process.exit(1);
}

console.log("前端 dumped 还原验证通过。");
