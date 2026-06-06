import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const repoRoot = process.cwd();
const backendRoot = join(repoRoot, "src-tauri", "src");
const frontendRoot = join(repoRoot, "src");
const failures = [];
const mcpUpsertArgKeys = [
  "args",
  "command",
  "config",
  "enabled",
  "environment",
  "headers",
  "name",
  "transport",
  "url",
];

const requiredFiles = [
  "commands/mod.rs",
  "application/mod.rs",
  "application/service.rs",
  "application/ports.rs",
  "core/mod.rs",
  "core/error.rs",
  "contracts/mod.rs",
  "contracts/envelope.rs",
  "platform/mod.rs",
  "repository/mod.rs",
  "repository/adapter/mod.rs",
  "adapters/mod.rs",
  "adapters/tauri/state.rs",
];

const requiredDirectories = [
  "commands",
  "application/usecase",
  "core/dto",
  "core/model",
  "core/parser",
  "core/migration",
  "core/state_machine",
  "platform",
  "repository",
  "repository/adapter",
  "contracts",
  "adapters/tauri",
];

function toRelative(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

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

  return files.sort();
}

function assertExists(path, description) {
  if (!existsSync(path)) {
    failures.push(`缺少${description}：${toRelative(path)}`);
  }
}

function assertNotContains(file, content, patterns, rule) {
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      failures.push(`${toRelative(file)} 违反 ${rule}：${pattern}`);
    }
  }
}

function assertContains(file, content, snippets, rule) {
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      failures.push(`${toRelative(file)} 缺少 ${rule}：${snippet}`);
    }
  }
}

function assertNotContainsSnippet(file, content, snippets, rule) {
  for (const snippet of snippets) {
    if (content.includes(snippet)) {
      failures.push(`${toRelative(file)} 违反 ${rule}：${snippet}`);
    }
  }
}

function rustFiles(relativeDirectory) {
  return walkFiles(join(backendRoot, relativeDirectory), (file) => file.endsWith(".rs"));
}

for (const file of requiredFiles) {
  assertExists(join(backendRoot, file), "后端六边形文件");
}
for (const directory of requiredDirectories) {
  assertExists(join(backendRoot, directory), "后端六边形目录");
}

const commandFiles = rustFiles("commands").filter((file) => !file.endsWith("mod.rs"));
const usecaseFiles = rustFiles("application/usecase").filter((file) => !file.endsWith("mod.rs"));
const coreFiles = rustFiles("core");
const platformFiles = rustFiles("platform").filter((file) => !file.endsWith("mod.rs"));
const repositoryFiles = rustFiles("repository").filter((file) => !file.includes(`${join("repository", "adapter")}`));
const adapterFiles = rustFiles("repository/adapter");

for (const file of commandFiles) {
  const content = readUtf8(file);
  assertContains(file, content, ["#[tauri::command]", "State<'_, TauriAppState>", "respond("], "IPC adapter 基本结构");
  assertNotContains(
    file,
    content,
    [
      /\bstd::fs\b/,
      /\btokio::fs\b/,
      /\breqwest::/,
      /\bstd::process\b/,
      /\bCommand::new\b/,
      /\bwindows_sys::/,
      /\bdirs::/,
      /\btauri::AppHandle\b/,
      /\btauri::Window\b/,
      /\bManager\b/,
      /\.emit\(/,
    ],
    "commands 只做 Tauri 参数反序列化、state 获取、usecase 调用和 envelope 返回",
  );
}

for (const file of usecaseFiles) {
  const content = readUtf8(file);
  assertNotContains(
    file,
    content,
    [
      /\btauri::/,
      /\bstd::fs\b/,
      /\btokio::fs\b/,
      /\breqwest::/,
      /\bstd::process\b/,
      /\bCommand::new\b/,
      /\bwindows_sys::/,
    ],
    "application/usecase 不依赖 Tauri UI、真实 FS、HTTP 或进程细节",
  );
}

for (const file of coreFiles) {
  const content = readUtf8(file);
  assertNotContains(
    file,
    content,
    [/\btauri::/, /\bAppHandle\b/, /\bWindow\b/, /\.emit\(/],
    "core 不依赖 Tauri UI 对象",
  );
}

for (const file of platformFiles) {
  const content = readUtf8(file);
  assertNotContains(
    file,
    content,
    [
      /\bAccount[A-Z]\w+/,
      /\bRelay[A-Z]\w+/,
      /\bMcp[A-Z]\w+/,
      /\bSkill[A-Z]\w+/,
      /\bCustomInstruction[A-Z]\w+/,
    ],
    "platform 只封装 OS 能力，不保存业务状态",
  );
}

for (const file of repositoryFiles) {
  const content = readUtf8(file);
  assertNotContains(
    file,
    content,
    [/\btauri::/, /\bAppHandle\b/, /\bWindow\b/, /\.emit\(/, /\breqwest::/],
    "repository 不依赖 Tauri UI 或出站 HTTP",
  );
}

for (const file of adapterFiles) {
  const content = readUtf8(file);
  assertNotContains(
    file,
    content,
    [/\btauri::/, /\bAppHandle\b/, /\bWindow\b/, /\.emit\(/, /\breqwest::/],
    "repository adapter 只封装可替换文件系统能力",
  );
}

const ports = readUtf8(join(backendRoot, "application", "ports.rs"));
assertContains(
  join(backendRoot, "application", "ports.rs"),
  ports,
  ["trait ProcessPort", "trait ShellPort", "trait PermissionsPort", "trait WindowPort", "trait SystemInfoPort"],
  "窄平台端口",
);

const service = readUtf8(join(backendRoot, "application", "service.rs"));
assertContains(
  join(backendRoot, "application", "service.rs"),
  service,
  ["RepositoryBundle", "SingleFlight", "pub(crate) fn accounts(&self)", "pub(crate) fn system(&self)"],
  "application service 聚合 usecase 依赖",
);

function validateMcpUpsertArgumentChain() {
  const servicePath = join(frontendRoot, "services", "mcp", "index.ts");
  const ipcPath = join(frontendRoot, "contracts", "ipc", "commands.ts");
  const commandPath = join(backendRoot, "commands", "mcp.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "mcp.rs");
  const serviceText = readUtf8(servicePath);
  const ipcText = readUtf8(ipcPath);
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);

  assertContains(servicePath, serviceText, [
    "export interface UpsertMcpServerInput",
    "...input",
    "args: input.args ?? []",
    "headers: input.headers ?? {}",
    "environment: input.environment ?? {}",
  ], "MCP upsert 前端参数门面");

  for (const key of mcpUpsertArgKeys) {
    assertContains(servicePath, serviceText, [key], "MCP upsert service 参数");
    assertContains(ipcPath, ipcText, [`"${key}"`], "MCP upsert IPC argKeys");
    assertContains(commandPath, commandText, [`${key}: Option<`], "MCP upsert command Option 参数");
    assertContains(commandPath, commandText, [`${key},`], "MCP upsert command 到 usecase 传参");
  }

  assertContains(usecasePath, usecaseText, [
    "pub name: Option<String>",
    "normalize_mcp_name(",
    "input.name.as_ref()",
    "fn server_from_input(input: McpUpsertInput, name: String)",
  ], "MCP upsert usecase owning 输入校验和归一化");
  assertNotContainsSnippet(commandPath, commandText, [
    "..McpUpsertInput::default()",
    "unwrap_or_default()",
  ], "MCP upsert command 不得吞掉缺参或补默认业务值");
}

validateMcpUpsertArgumentChain();

function validateSystemEnvelopeServiceTypes() {
  const systemServicePath = join(frontendRoot, "services", "system", "index.ts");
  const commandPath = join(backendRoot, "commands", "system.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "system.rs");
  const contractPath = join(backendRoot, "contracts", "system.rs");
  const systemServiceText = readUtf8(systemServicePath);
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);

  assertContains(contractPath, contractText, [
    "pub(crate) struct BootstrapStatePayload",
    "pub(crate) struct NotificationClientStatePayload",
    "pub(crate) struct MysteryRouteGrant",
    "pub(crate) struct PendingAutoSwitchStatePayload",
    "pub executed_at: Option<String>",
    "pub pending_switch_account_key: Option<String>",
  ], "system DTO 合同");

  assertContains(commandPath, commandText, [
    "Result<CoreEnvelope<String>, String>",
    "Result<CoreEnvelope<()>, String>",
    "Result<CoreEnvelope<BootstrapStatePayload>, String>",
    "Result<CoreEnvelope<NotificationClientStatePayload>, String>",
    "Result<CoreEnvelope<PendingAutoSwitchStatePayload>, String>",
    "Result<CoreEnvelope<Vec<MysteryRouteGrant>>, String>",
  ], "system command 强类型 envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<String>, CoreError>",
    "Result<CoreEnvelope<()>, CoreError>",
    "Result<CoreEnvelope<BootstrapStatePayload>, CoreError>",
    "Result<CoreEnvelope<NotificationClientStatePayload>, CoreError>",
    "Result<CoreEnvelope<PendingAutoSwitchStatePayload>, CoreError>",
    "Result<CoreEnvelope<Vec<MysteryRouteGrant>>, CoreError>",
    "NotificationClientStatePayload {",
    "PendingAutoSwitchStatePayload {",
    "parse_mystery_route_grants(",
  ], "system usecase 强类型 payload 组装");

  assertContains(systemServicePath, systemServiceText, [
    "CoreEnvelope<BootstrapStatePayload>",
    "CoreEnvelope<NotificationClientStatePayload>",
    "CoreEnvelope<PendingAutoSwitchStatePayload>",
    "CoreEnvelope<MysteryRouteGrant[]>",
    "CoreEnvelope<string>>(\"get_or_create_remote_device_secret\")",
    "CoreEnvelope<null>>(\"import_remote_device_secret_if_empty\"",
    "confirmPendingAutoSwitchAndRestartCodex",
    "toMysteryRouteGrantArgs(grants)",
  ], "system service 强类型 envelope");

  assertNotContainsSnippet(systemServicePath, systemServiceText, [
    "CoreEnvelope<IpcEvidencePayload>>(\"get_notification_client_state\"",
    "CoreEnvelope<IpcEvidencePayload>>(\"get_mystery_unlock_grants\"",
    "CoreEnvelope<IpcEvidencePayload>>(\"merge_mystery_unlock_grants\"",
  ], "system service 不得退回 generic evidence payload");
}

validateSystemEnvelopeServiceTypes();

function validateAccountsTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "accounts.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "accounts.rs");
  const contractPath = join(backendRoot, "contracts", "accounts.rs");
  const servicePath = join(frontendRoot, "services", "accounts", "index.ts");
  const featureTypesPath = join(frontendRoot, "features", "accounts", "types", "index.ts");
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const serviceText = readUtf8(servicePath);
  const featureTypesText = readUtf8(featureTypesPath);

  assertContains(contractPath, contractText, [
    "pub(crate) struct AccountMonitorPayload",
    "pub(crate) struct SwitchPayload",
    "pub(crate) struct LogoutPayload",
    "pub(crate) struct RemovePayload",
    "pub(crate) struct AccountImportPayload",
    "pub(crate) struct AccountSessionImportPayload",
    "pub(crate) struct AccountExportPayload",
    "pub(crate) struct AccountImportPreviewPayload",
    "pub backend_status: BackendSkeletonStatus",
  ], "accounts 后端 typed DTO");

  assertContains(commandPath, commandText, [
    "Result<CoreEnvelope<AccountMonitorPayload>, String>",
    "Result<CoreEnvelope<SwitchPayload>, String>",
    "Result<CoreEnvelope<RemovePayload>, String>",
    "Result<CoreEnvelope<LogoutPayload>, String>",
    "Result<CoreEnvelope<AccountImportPayload>, String>",
    "Result<CoreEnvelope<AccountSessionImportPayload>, String>",
    "Result<CoreEnvelope<AccountExportPayload>, String>",
    "Result<CoreEnvelope<AccountImportPreviewPayload>, String>",
  ], "accounts command 强类型 envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<AccountMonitorPayload>, CoreError>",
    "Result<CoreEnvelope<SwitchPayload>, CoreError>",
    "Result<CoreEnvelope<RemovePayload>, CoreError>",
    "Result<CoreEnvelope<LogoutPayload>, CoreError>",
    "Result<CoreEnvelope<AccountImportPayload>, CoreError>",
    "Result<CoreEnvelope<AccountSessionImportPayload>, CoreError>",
    "Result<CoreEnvelope<AccountExportPayload>, CoreError>",
    "Result<CoreEnvelope<AccountImportPreviewPayload>, CoreError>",
    "BackendOperationPlan::pending",
    "BackendOperationPlan::no_op",
    "BackendBoundaryProbe::from_repository_source",
  ], "accounts usecase 六边形 typed payload");

  assertContains(servicePath, serviceText, [
    "CoreEnvelope<AccountMonitorPayload>",
    "CoreEnvelope<SwitchPayload>",
    "CoreEnvelope<RemovePayload>",
    "CoreEnvelope<LogoutPayload>",
    "CoreEnvelope<AccountImportPayload>",
    "CoreEnvelope<AccountSessionImportPayload>",
    "CoreEnvelope<AccountExportPayload>",
    "CoreEnvelope<AccountImportPreviewPayload>",
  ], "accounts service 强类型 envelope");

  assertContains(featureTypesPath, featureTypesText, [
    "export type AccountsMutationPayload",
    "export type AccountsMutationEnvelope",
    "export type AccountsSnapshotEnvelope",
    "export type AccountsCachePayload",
  ], "accounts 前端模块 typed cache payload");

  assertNotContainsSnippet(contractPath, contractText, [
    "AccountActionPayload",
    "serde_json::Value",
  ], "accounts 后端合同不得退回单一泛型动作 payload");

  assertNotContainsSnippet(commandPath, commandText, [
    "AccountActionPayload",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "accounts command 不得退回泛型 payload");

  assertNotContainsSnippet(servicePath, serviceText, [
    "IpcEvidencePayload",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "accounts service 不得退回 generic evidence payload");
}

validateAccountsTypedPayloadContracts();

function validateRelayTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "relay.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "relay.rs");
  const contractPath = join(backendRoot, "contracts", "relay.rs");
  const servicePath = join(frontendRoot, "services", "relay", "index.ts");
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const serviceText = readUtf8(servicePath);

  assertContains(contractPath, contractText, [
    "pub(crate) struct RelayProviderDraftInput",
    "pub(crate) struct RelayProviderPayload",
    "pub(crate) struct RelayStatePayload",
    "pub(crate) struct RelayActivePayload",
    "pub(crate) struct RelayProxyPayload",
    "pub(crate) struct RelayRouterTogglePayload",
    "pub(crate) struct RelayTestPayload",
    "pub(crate) struct RelayExportPayload",
    "pub(crate) struct RelayImportPayload",
    "pub(crate) struct RelayDiagnosticPayload",
    "pub(crate) struct RelayRouterIssueFixPayload",
  ], "relay DTO 鍚堝悓");

  assertContains(commandPath, commandText, [
    "Result<CoreEnvelope<RelayStatePayload>, String>",
    "Result<CoreEnvelope<RelayProviderPayload>, String>",
    "Result<CoreEnvelope<RelayTestPayload>, String>",
    "Result<CoreEnvelope<Vec<String>>, String>",
    "Result<CoreEnvelope<RelayActivePayload>, String>",
    "Result<CoreEnvelope<RelayProxyPayload>, String>",
    "Result<CoreEnvelope<RelayRouterTogglePayload>, String>",
    "Result<CoreEnvelope<RelayExportPayload>, String>",
    "Result<CoreEnvelope<RelayImportPayload>, String>",
    "Result<CoreEnvelope<Vec<RelayPassthroughAuditEntry>>, String>",
    "Result<CoreEnvelope<RelayDiagnosticPayload>, String>",
    "Result<CoreEnvelope<RelayRouterIssueFixPayload>, String>",
  ], "relay command 寮虹被鍨?envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<RelayStatePayload>, CoreError>",
    "Result<CoreEnvelope<RelayProviderPayload>, CoreError>",
    "Result<CoreEnvelope<RelayTestPayload>, CoreError>",
    "Result<CoreEnvelope<Vec<String>>, CoreError>",
    "Result<CoreEnvelope<RelayActivePayload>, CoreError>",
    "Result<CoreEnvelope<RelayProxyPayload>, CoreError>",
    "Result<CoreEnvelope<RelayRouterTogglePayload>, CoreError>",
    "Result<CoreEnvelope<RelayExportPayload>, CoreError>",
    "Result<CoreEnvelope<RelayImportPayload>, CoreError>",
    "Result<CoreEnvelope<Vec<RelayPassthroughAuditEntry>>, CoreError>",
    "Result<CoreEnvelope<RelayDiagnosticPayload>, CoreError>",
    "Result<CoreEnvelope<RelayRouterIssueFixPayload>, CoreError>",
    "fn state_payload(",
    "fn provider_payload(",
    "fn diagnostic_payload(",
  ], "relay usecase 寮虹被鍨?payload 缁勮");

  assertContains(servicePath, serviceText, [
    "CoreEnvelope<RelayStatePayload>",
    "CoreEnvelope<RelayProviderPayload>",
    "CoreEnvelope<RelayTestPayload>",
    "CoreEnvelope<string[]>",
    "CoreEnvelope<RelayActivePayload>",
    "CoreEnvelope<RelayProxyPayload>",
    "CoreEnvelope<RelayRouterTogglePayload>",
    "CoreEnvelope<RelayExportPayload>",
    "CoreEnvelope<RelayImportPayload>",
    "CoreEnvelope<RelayPassthroughAuditEntry[]>",
    "CoreEnvelope<RelayDiagnosticPayload>",
    "CoreEnvelope<RelayRouterIssueFixPayload>",
    "systemService.restartCodex()",
  ], "relay service 寮虹被鍨?envelope");

  assertNotContainsSnippet(contractPath, contractText, [
    "RelayActionPayload",
    "pub input: Option<Value>",
  ], "relay contract 涓嶅緱閫€鍥炲ぇ妗?payload");
  assertNotContainsSnippet(commandPath, commandText, [
    "RelayActionPayload",
    "Option<Value>",
  ], "relay command 涓嶅緱閫€鍥炴垨閫忎紶 generic payload");
  assertNotContainsSnippet(usecasePath, usecaseText, [
    "RelayActionPayload",
    "pub(crate) fn provider_action(",
    "pub(crate) fn empty_action(",
  ], "relay usecase 涓嶅緱澶嶇敤 generic action owner");
  assertNotContainsSnippet(servicePath, serviceText, [
    "IpcEvidencePayload",
    "restart_codex",
  ], "relay service 涓嶅緱閫€鍥?generic evidence payload 鎴栫洿鎺ヨ皟 system command");
}

validateRelayTypedPayloadContracts();

function validateVoiceMutationPayloadContracts() {
  {
    const commandPath = join(backendRoot, "commands", "voice.rs");
    const usecasePath = join(backendRoot, "application", "usecase", "voice.rs");
    const servicePath = join(frontendRoot, "services", "voice", "index.ts");
    const commandText = readUtf8(commandPath);
    const usecaseText = readUtf8(usecasePath);
    const serviceText = readUtf8(servicePath);

    assertContains(commandPath, commandText, [
      "pub(crate) fn load_voice_workspace",
      "pub(crate) fn generate_voice_prompt",
      "pub(crate) fn start_voice_capture",
      "pub(crate) fn stop_voice_capture",
    ], "voice command 空骨架 adapter");

    assertContains(usecasePath, usecaseText, [
      "BackendOperationPlan::unsupported",
      "VoiceUseCase",
      "workspace_payload",
      "runtime_payload",
    ], "voice usecase 空骨架边界");

    assertNotContainsSnippet(usecasePath, usecaseText, [
      "required_option_text",
      "parse_voice_vocabulary_kind",
      "self.no_op_plan",
      "VoicePromptTemplate {",
      "VoiceVocabularyEntry {",
      "global_shortcut: shortcut",
    ], "voice usecase 不得保留真实业务组装");

    assertNotContainsSnippet(servicePath, serviceText, [
      "invokeIpc",
      "load_voice_",
      "upsert_voice_",
      "start_voice_capture",
    ], "voice service 不得保留真实 IPC wrapper");
    return;
  }

}

validateVoiceMutationPayloadContracts();

if (failures.length > 0) {
  console.error("后端六边形静态验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("后端六边形静态验证通过：commands、usecase、core、platform、repository 边界满足当前骨架规则。");
