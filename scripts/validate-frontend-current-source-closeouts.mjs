import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
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

function validateClosedDocs(moduleName, docs) {
  for (const doc of docs ?? []) {
    if (!existsSync(repoPath(doc))) {
      failures.push(`${moduleName} closeout 缺少旧 frontend 文档：${doc}`);
    }
  }
}

function validateRequiredSignals(closeout) {
  for (const signal of closeout.requiredSourceSignals ?? []) {
    requireIncludes(signal.file, signal.includes ?? []);
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
      failures.push(
        `plugins closeout ${commandName} 不能关闭：uiTriggerObserved=${command.uiTriggerObserved} blocked=${command.blocked}`,
      );
    }
  }

  for (const commandName of closeout.notClosedCommands ?? []) {
    const command = commands.get(commandName);
    if (!command) {
      failures.push(`plugins closeout raw acceptance 缺少 ${commandName}`);
      continue;
    }
    if (command.uiTriggerObserved !== false || command.blocked !== true) {
      failures.push(
        `plugins closeout ${commandName} 不得标为未关闭以外状态：uiTriggerObserved=${command.uiTriggerObserved} blocked=${command.blocked}`,
      );
    }
  }

  const expectedManifestStatuses = [
    {
      arrayName: "FRONTEND_DUMPED_MODULE_RESTORATION_MATRIX",
      module: "plugins",
      command: "get_plugin_config",
      source: "assets/index-CL22l5v8.js",
      status: "contract-service-only",
    },
    {
      arrayName: "FRONTEND_DUMPED_MODULE_RESTORATION_MATRIX",
      module: "plugins",
      command: "update_plugin_config",
      source: "assets/index-CL22l5v8.js",
      status: "contract-service-only",
    },
  ];
  const expectedKeys = new Set(expectedManifestStatuses.map(manifestCloseoutKey));
  const actualKeys = new Set((closeout.closedManifestStatuses ?? []).map(manifestCloseoutKey));
  for (const entry of closeout.closedManifestStatuses ?? []) {
    if (!expectedKeys.has(manifestCloseoutKey(entry))) {
      failures.push(`plugins closeout 不允许关闭未验证 manifest 状态：${JSON.stringify(entry)}`);
    }
    if (entry.status !== "contract-service-only") {
      failures.push(`plugins closeout 不得把 config manifest 状态提升为 ${String(entry.status)}`);
    }
  }
  for (const expectedEntry of expectedManifestStatuses) {
    if (!actualKeys.has(manifestCloseoutKey(expectedEntry))) {
      failures.push(`plugins closeout 缺少 config manifest closeout：${expectedEntry.command}`);
    }
  }

  validateClosedDocs("plugins", closeout.closedFrontendDocs);
  validateRequiredSignals(closeout);
}

function validateRelayCloseout(closeout) {
  validateClosedDocs("relay", closeout.closedFrontendDocs);

  const expectedCommands = new Set([
    "set_block_official_passthrough",
    "get_passthrough_audit_log",
  ]);

  for (const commandName of closeout.closedCommands ?? []) {
    if (!expectedCommands.has(commandName)) {
      failures.push(`relay closeout 不允许关闭未验证命令：${commandName}`);
    }
  }
  for (const commandName of expectedCommands) {
    if (!(closeout.closedCommands ?? []).includes(commandName)) {
      failures.push(`relay closeout 缺少命令：${commandName}`);
    }
  }

  validateRequiredSignals(closeout);
}

function manifestCloseoutKey(record) {
  return [
    record.arrayName ?? "",
    record.module ?? record.owner ?? "",
    record.queryKey ?? "",
    record.command ?? "",
    record.source ?? "",
    record.status ?? "",
  ].join("\u0000");
}

function validateGateReports(closeout, options = {}) {
  const reports = closeout.gateReports ?? [];
  if (reports.length === 0) {
    failures.push(`${closeout.id} 缺少 gate-report 证据`);
    return;
  }

  for (const report of reports) {
    const path = repoPath(report);
    if (!existsSync(path)) {
      failures.push(`${closeout.id} 缺少 gate-report：${report}`);
      continue;
    }
    const gate = readJson(path);
    for (const field of ["readyToImplement", "implementation_use", "gate_accepted", "full_leaf_100"]) {
      if (gate[field] !== true) {
        failures.push(`${report} ${field}=${String(gate[field])}`);
      }
    }
    const status = String(gate.status ?? "");
    const acceptedStatus = status === "PASS" || status.startsWith("accepted_full_leaf_100");
    if (options.requirePassStatus === true && gate.status !== "PASS") {
      failures.push(`${report} status=${String(gate.status)}`);
    }
    if (options.requirePassStatus !== true && !acceptedStatus) {
      failures.push(`${report} status=${String(gate.status)}`);
    }
    if (
      options.requireFrontendConsumerHandoff === true &&
      gate.frontendConsumerHandoff?.status !== "complete_current_source_frontend_chain"
    ) {
      failures.push(`${report} frontendConsumerHandoff.status=${String(gate.frontendConsumerHandoff?.status)}`);
    }
  }
}

function validateMcpSkillsCloseout(closeout) {
  validateClosedDocs("mcp-skills", closeout.closedFrontendDocs);
  validateGateReports(closeout, {
    requirePassStatus: true,
    requireFrontendConsumerHandoff: true,
  });

  const expected = [
    {
      arrayName: "FRONTEND_DUMPED_APP_SHELL_INDEX_QUERY_MATRIX",
      module: "mcp",
      queryKey: "mcp-servers",
      source: "assets/index-CL22l5v8.js",
      status: "owner-closed",
    },
    {
      arrayName: "FRONTEND_DUMPED_APP_SHELL_INDEX_QUERY_MATRIX",
      module: "skills",
      queryKey: "installed-skills",
      source: "assets/index-CL22l5v8.js",
      status: "owner-closed",
    },
  ];
  const expectedKeys = new Set(expected.map(manifestCloseoutKey));
  const actualKeys = new Set((closeout.closedManifestStatuses ?? []).map(manifestCloseoutKey));

  for (const entry of closeout.closedManifestStatuses ?? []) {
    if (!expectedKeys.has(manifestCloseoutKey(entry))) {
      failures.push(`${closeout.id} 不允许关闭未验证 manifest 状态：${JSON.stringify(entry)}`);
    }
    if (entry.status !== "owner-closed") {
      failures.push(`${closeout.id} 不得把 manifest 状态提升为 ${String(entry.status)}`);
    }
  }
  for (const expectedEntry of expected) {
    if (!actualKeys.has(manifestCloseoutKey(expectedEntry))) {
      failures.push(`${closeout.id} 缺少 manifest closeout：${expectedEntry.module}/${expectedEntry.queryKey}`);
    }
  }

  validateRequiredSignals(closeout);
}

function validateAccountsAnalyticsCloseout(closeout) {
  validateClosedDocs("accounts-analytics", closeout.closedFrontendDocs);
  validateGateReports(closeout);

  const expected = [
    {
      arrayName: "FRONTEND_DUMPED_APP_SHELL_INDEX_QUERY_MATRIX",
      module: "accounts",
      queryKey: "quota-history",
      source: "assets/index-CL22l5v8.js",
      status: "owner-closed",
    },
    {
      arrayName: "FRONTEND_DUMPED_APP_SHELL_INDEX_QUERY_MATRIX",
      module: "analytics",
      queryKey: "usage-analytics",
      source: "assets/index-CL22l5v8.js",
      status: "owner-closed",
    },
  ];
  const expectedKeys = new Set(expected.map(manifestCloseoutKey));
  const actualKeys = new Set((closeout.closedManifestStatuses ?? []).map(manifestCloseoutKey));

  for (const entry of closeout.closedManifestStatuses ?? []) {
    if (!expectedKeys.has(manifestCloseoutKey(entry))) {
      failures.push(`${closeout.id} 不允许关闭未验证 manifest 状态：${JSON.stringify(entry)}`);
    }
    if (entry.status !== "owner-closed") {
      failures.push(`${closeout.id} 不得把 manifest 状态提升为 ${String(entry.status)}`);
    }
  }
  for (const expectedEntry of expected) {
    if (!actualKeys.has(manifestCloseoutKey(expectedEntry))) {
      failures.push(`${closeout.id} 缺少 manifest closeout：${expectedEntry.module}/${expectedEntry.queryKey}`);
    }
  }

  const boundaryNotes = closeout.backendBoundaryNotes ?? [];
  if (!boundaryNotes.some((note) => note.includes("Rust analytics 后端仍是边界占位"))) {
    failures.push(`${closeout.id} 必须声明 analytics Rust 后端仍是边界占位`);
  }
  const nonClaims = closeout.nonClaims ?? [];
  for (const required of [
    "不把 accounts 或 analytics 的 manifest 状态改成 covered。",
    "不声明全文案验收完成。",
    "不声明 MAC/WIN 100% leaf 已完成。",
    "不声明 analytics Rust command/usecase/repository 已可调用闭合。",
  ]) {
    if (!nonClaims.includes(required)) {
      failures.push(`${closeout.id} 缺少 nonClaims：${required}`);
    }
  }

  validateRequiredSignals(closeout);
}

function validateAppShellSourceOnlyCloseout(closeout) {
  validateClosedDocs("app-shell", closeout.closedFrontendDocs);

  const expected = [
    {
      arrayName: "FRONTEND_DUMPED_INDEX_ASSET_SOURCES",
      owner: "app-shell",
      source: "assets/index-CL22l5v8.js",
      status: "source-only",
    },
    {
      arrayName: "FRONTEND_DUMPED_APP_SHELL_DESKTOP_MESSAGE_QUERY_MATRIX",
      module: "app-shell",
      queryKey: "desktop-message",
      source: "assets/index-CL22l5v8.js",
      status: "source-only",
    },
  ];
  const expectedKeys = new Set(expected.map(manifestCloseoutKey));
  const actualKeys = new Set((closeout.closedManifestStatuses ?? []).map(manifestCloseoutKey));

  for (const entry of closeout.closedManifestStatuses ?? []) {
    if (!expectedKeys.has(manifestCloseoutKey(entry))) {
      failures.push(`${closeout.id} 不允许关闭未验证 manifest 状态：${JSON.stringify(entry)}`);
    }
    if (entry.status !== "source-only") {
      failures.push(`${closeout.id} 不得把 manifest 状态提升为 ${String(entry.status)}`);
    }
  }
  for (const expectedEntry of expected) {
    if (!actualKeys.has(manifestCloseoutKey(expectedEntry))) {
      failures.push(`${closeout.id} 缺少 manifest closeout：${expectedEntry.owner ?? expectedEntry.module}`);
    }
  }

  const nonClaims = closeout.nonClaims ?? [];
  for (const required of [
    "不把 app-shell 的 source-only manifest 状态改成 covered。",
    "不声明 update/restart/window-path 后端完整恢复。",
    "不声明 desktop-message 存在可审计 endpoint。",
    "不声明全文案验收完成。",
    "不声明 MAC/WIN 100% leaf 已完成。",
  ]) {
    if (!nonClaims.includes(required)) {
      failures.push(`${closeout.id} 缺少 nonClaims：${required}`);
    }
  }

  validateRequiredSignals(closeout);
}

const closeouts = readJson(closeoutPath);
if (closeouts.schema !== "open-aimami.frontend_current_source_closeouts.v1") {
  failures.push(`${toRepoPath(closeoutPath)} schema 不匹配`);
}

for (const closeout of closeouts.closeouts ?? []) {
  if (closeout.id === "plugins-current-route-api-command-mock-chain") {
    validatePluginsCloseout(closeout);
  } else if (closeout.id === "mcp-skills-index-query-owner-closed-chain") {
    validateMcpSkillsCloseout(closeout);
  } else if (closeout.id === "accounts-analytics-index-query-owner-closed-chain") {
    validateAccountsAnalyticsCloseout(closeout);
  } else if (closeout.id === "app-shell-source-only-index-and-desktop-message-boundary") {
    validateAppShellSourceOnlyCloseout(closeout);
  } else if (closeout.id === "relay-passthrough-audit-backend-skeleton-chain") {
    validateRelayCloseout(closeout);
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
