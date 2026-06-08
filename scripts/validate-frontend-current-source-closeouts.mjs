import { existsSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..");
const closeoutPath = join(repoRoot, "docs", "reconstruction", "frontend-current-source-closeouts.json");
const failures = [];

function repoPath(path) {
  return join(repoRoot, ...path.split("/"));
}

function toRepoPath(file) {
  return relative(repoRoot, file).split(sep).join("/");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function requireIncludes(file, snippets) {
  const path = repoPath(file);
  if (!existsSync(path)) {
    failures.push(`缺少 closeout 源码文件：${file}`);
    return;
  }
  const text = readFileSync(path, "utf8");
  for (const snippet of snippets) {
    if (!text.includes(snippet)) {
      failures.push(`${file} 缺少 closeout 片段：${snippet}`);
    }
  }
}

function validatePluginsCloseout(closeout) {
  const rawPath = repoPath(closeout.rawAcceptance);
  if (!existsSync(rawPath)) {
    failures.push(`缺少 plugins raw acceptance：${closeout.rawAcceptance}`);
    return;
  }

  const raw = readJson(rawPath);
  const commands = new Map((raw.commands ?? []).map((command) => [command.command, command]));

  for (const commandName of closeout.closedCommands ?? []) {
    const command = commands.get(commandName);
    if (!command) {
      failures.push(`plugins closeout raw acceptance 缺少 ${commandName}`);
      continue;
    }
    if (command.uiTriggerObserved !== true || command.blocked !== false) {
      failures.push(`plugins closeout ${commandName} 不能关闭：uiTriggerObserved=${command.uiTriggerObserved} blocked=${command.blocked}`);
    }
  }

  for (const commandName of closeout.notClosedCommands ?? []) {
    const command = commands.get(commandName);
    if (!command) {
      failures.push(`plugins closeout raw acceptance 缺少 ${commandName}`);
      continue;
    }
    if (command.uiTriggerObserved !== false || command.blocked !== true) {
      failures.push(`plugins closeout ${commandName} 不得标为未关闭以外状态：uiTriggerObserved=${command.uiTriggerObserved} blocked=${command.blocked}`);
    }
  }

  for (const doc of closeout.closedFrontendDocs ?? []) {
    if (!existsSync(repoPath(doc))) {
      failures.push(`plugins closeout 缺少旧 frontend 文档：${doc}`);
    }
  }

  for (const signal of closeout.requiredSourceSignals ?? []) {
    requireIncludes(signal.file, signal.includes ?? []);
  }
}

const closeouts = readJson(closeoutPath);
if (closeouts.schema !== "open-aimami.frontend_current_source_closeouts.v1") {
  failures.push(`${toRepoPath(closeoutPath)} schema 不匹配`);
}

for (const closeout of closeouts.closeouts ?? []) {
  if (closeout.id === "plugins-current-route-api-command-mock-chain") {
    validatePluginsCloseout(closeout);
  } else {
    failures.push(`未知 closeout id：${closeout.id}`);
  }
}

if (failures.length > 0) {
  console.error("前端当前源码 closeout 验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`前端当前源码 closeout 验证通过：${(closeouts.closeouts ?? []).length} 项。`);
