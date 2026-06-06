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
  const contractPath = join(backendRoot, "contracts", "mcp.rs");
  const featureTypesPath = join(frontendRoot, "features", "mcp", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "mcp", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "mcp", "hooks", "index.ts");
  const serviceText = readUtf8(servicePath);
  const ipcText = readUtf8(ipcPath);
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const featureTypesText = readUtf8(featureTypesPath);
  const featureCacheText = readUtf8(featureCachePath);
  const featureHooksText = readUtf8(featureHooksPath);

  assertContains(servicePath, serviceText, [
    "export interface UpsertMcpServerInput",
    "McpServerConfigInput",
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

function validateMcpTypedPayloadContracts() {
  const servicePath = join(frontendRoot, "services", "mcp", "index.ts");
  const commandPath = join(backendRoot, "commands", "mcp.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "mcp.rs");
  const contractPath = join(backendRoot, "contracts", "mcp.rs");
  const featureTypesPath = join(frontendRoot, "features", "mcp", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "mcp", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "mcp", "hooks", "index.ts");
  const serviceText = readUtf8(servicePath);
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const featureTypesText = readUtf8(featureTypesPath);
  const featureCacheText = readUtf8(featureCachePath);
  const featureHooksText = readUtf8(featureHooksPath);

  assertContains(contractPath, contractText, [
    "pub(crate) struct McpServerConfigInput",
    "pub(crate) struct McpServerListPayload",
    "pub(crate) struct McpServerMutationPayload",
    "pub(crate) struct McpServerRemovePayload",
  ], "MCP 后端 typed DTO");

  assertContains(commandPath, commandText, [
    "config: Option<McpServerConfigInput>",
    "Result<CoreEnvelope<McpServerListPayload>, String>",
    "Result<CoreEnvelope<McpServerMutationPayload>, String>",
    "Result<CoreEnvelope<McpServerRemovePayload>, String>",
  ], "MCP command typed envelope");

  assertContains(usecasePath, usecaseText, [
    "pub config: Option<McpServerConfigInput>",
    "Result<CoreEnvelope<McpServerListPayload>, CoreError>",
    "Result<CoreEnvelope<McpServerMutationPayload>, CoreError>",
    "Result<CoreEnvelope<McpServerRemovePayload>, CoreError>",
  ], "MCP usecase typed payload");

  assertContains(servicePath, serviceText, [
    "McpServerConfigInput",
    "CoreEnvelope<McpServerListPayload>",
    "CoreEnvelope<McpServerMutationPayload>",
    "CoreEnvelope<McpServerRemovePayload>",
  ], "MCP service typed envelope");

  assertContains(featureTypesPath, featureTypesText, [
    "export type McpListEnvelope",
    "export type McpMutationEnvelope",
    "export type McpRemoveEnvelope",
    "export type McpCachePayload",
  ], "MCP 前端模块 typed cache payload");

  assertContains(featureHooksPath, featureHooksText, [
    "McpListEnvelope",
    "McpMutationEnvelope",
    "McpRemoveEnvelope",
    "writeMcpAuthoritativePayload",
    "writeMcpServersMutationPayload",
  ], "MCP hooks typed authoritative envelope");

  assertContains(featureCachePath, featureCacheText, [
    "Omit<McpCacheEnvelope, \"moduleId\">",
  ], "MCP cache helper typed envelope");

  assertNotContainsSnippet(commandPath, commandText, [
    "serde_json::Value",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "MCP command 不得回退泛型 payload");

  assertNotContainsSnippet(usecasePath, usecaseText, [
    "serde_json::Value",
    "config_string(",
    "config_bool(",
  ], "MCP usecase 不得回退泛型 JSON 配置读取");

  assertNotContainsSnippet(servicePath, serviceText, [
    "IpcEvidencePayload",
    "IpcJsonObject",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "MCP service 不得返回 generic evidence payload");

  assertNotContainsSnippet(featureTypesPath, featureTypesText, [
    "McpCacheEnvelope<TPayload = unknown>",
  ], "MCP feature cache payload 不得默认 unknown");

  assertNotContainsSnippet(featureHooksPath, featureHooksText, [
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
  ], "MCP hooks 不得用 unknown authoritative payload");
}

validateMcpUpsertArgumentChain();
validateMcpTypedPayloadContracts();

function validateSystemEnvelopeServiceTypes() {
  const systemServicePath = join(frontendRoot, "services", "system", "index.ts");
  const commandPath = join(backendRoot, "commands", "system.rs");
  const hotspotCommandPath = join(backendRoot, "commands", "hotspot.rs");
  const applicationServicePath = join(backendRoot, "application", "service.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "system.rs");
  const contractPath = join(backendRoot, "contracts", "system.rs");
  const systemServiceText = readUtf8(systemServicePath);
  const commandText = readUtf8(commandPath);
  const hotspotCommandText = readUtf8(hotspotCommandPath);
  const applicationServiceText = readUtf8(applicationServicePath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);

  assertContains(contractPath, contractText, [
    "pub(crate) struct BootstrapStatePayload",
    "pub(crate) struct NotificationClientStatePayload",
    "pub(crate) struct MysteryRouteGrant",
    "pub(crate) struct PendingAutoSwitchStatePayload",
    "pub(crate) struct SystemActionPayload",
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
    "Result<CoreEnvelope<SystemActionPayload>, String>",
    "grants: Option<Vec<MysteryRouteGrant>>",
  ], "system command 强类型 envelope");

  assertContains(hotspotCommandPath, hotspotCommandText, [
    "Result<CoreEnvelope<SystemActionPayload>, String>",
    "Result<CoreEnvelope<bool>, String>",
  ], "hotspot command 强类型 envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<String>, CoreError>",
    "Result<CoreEnvelope<()>, CoreError>",
    "Result<CoreEnvelope<BootstrapStatePayload>, CoreError>",
    "Result<CoreEnvelope<NotificationClientStatePayload>, CoreError>",
    "Result<CoreEnvelope<PendingAutoSwitchStatePayload>, CoreError>",
    "Result<CoreEnvelope<Vec<MysteryRouteGrant>>, CoreError>",
    "Result<CoreEnvelope<SystemActionPayload>, CoreError>",
    "NotificationClientStatePayload {",
    "PendingAutoSwitchStatePayload {",
    "clean_mystery_route_grants(",
    "system_action_payload(",
  ], "system usecase 强类型 payload 组装");

  assertContains(systemServicePath, systemServiceText, [
    "CoreEnvelope<BootstrapStatePayload>",
    "CoreEnvelope<NotificationClientStatePayload>",
    "CoreEnvelope<PendingAutoSwitchStatePayload>",
    "CoreEnvelope<SystemActionPayload>",
    "CoreEnvelope<boolean>>(\"hotspot_ready\")",
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
    "CoreEnvelope<unknown>",
    "IpcJsonObject",
  ], "system service 不得退回 generic evidence payload");

  assertNotContainsSnippet(commandPath, commandText, [
    "serde_json::Value",
    "CoreEnvelope<Value>",
  ], "system command 不得回退 serde_json::Value");

  assertNotContainsSnippet(hotspotCommandPath, hotspotCommandText, [
    "serde_json::Value",
    "CoreEnvelope<Value>",
  ], "hotspot command 不得回退 serde_json::Value");

  assertNotContainsSnippet(applicationServicePath, applicationServiceText, [
    "serde_json::Value",
    "CoreEnvelope<Value>",
  ], "application service 不得回退 system action generic payload");

  assertNotContainsSnippet(usecasePath, usecaseText, [
    "serde_json::Value",
    "json!",
    "parse_mystery_route_grants(",
    "clean_json_value(",
  ], "system usecase 不得回退泛型 JSON payload");
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

function validateSessionsTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "sessions.rs");
  const analyticsCommandPath = join(backendRoot, "commands", "analytics.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "sessions.rs");
  const analyticsUsecasePath = join(backendRoot, "application", "usecase", "analytics.rs");
  const contractPath = join(backendRoot, "contracts", "sessions.rs");
  const analyticsContractPath = join(backendRoot, "contracts", "analytics.rs");
  const servicePath = join(frontendRoot, "services", "sessions", "index.ts");
  const analyticsServicePath = join(frontendRoot, "services", "analytics", "index.ts");
  const featureTypesPath = join(frontendRoot, "features", "sessions", "types", "index.ts");
  const commandText = readUtf8(commandPath);
  const analyticsCommandText = readUtf8(analyticsCommandPath);
  const usecaseText = readUtf8(usecasePath);
  const analyticsUsecaseText = readUtf8(analyticsUsecasePath);
  const contractText = readUtf8(contractPath);
  const analyticsContractText = readUtf8(analyticsContractPath);
  const serviceText = readUtf8(servicePath);
  const analyticsServiceText = readUtf8(analyticsServicePath);
  const featureTypesText = readUtf8(featureTypesPath);

  assertContains(contractPath, contractText, [
    "pub(crate) struct SessionRecordPayload",
    "pub(crate) struct SessionsListPayload",
    "pub(crate) struct SessionsDeletePayload",
    "pub backend_status: BackendSkeletonStatus",
    "pub items: Vec<SessionRecordPayload>",
    "pub deleted_ids: Vec<String>",
  ], "sessions 后端 typed DTO");

  assertContains(analyticsContractPath, analyticsContractText, [
    "pub(crate) struct SessionAnalyticsPayload",
    "pub(crate) struct SessionAnalyticsSeriesPoint",
    "pub backend_status: BackendSkeletonStatus",
    "pub series: Vec<SessionAnalyticsSeriesPoint>",
  ], "session analytics 后端 typed DTO");

  assertContains(commandPath, commandText, [
    "Result<CoreEnvelope<SessionsListPayload>, String>",
    "Result<CoreEnvelope<SessionsDeletePayload>, String>",
  ], "sessions command typed envelope");

  assertContains(analyticsCommandPath, analyticsCommandText, [
    "Result<CoreEnvelope<SessionAnalyticsPayload>, String>",
    "load_session_analytics(range)",
  ], "load_session_analytics command typed envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<SessionsListPayload>, CoreError>",
    "Result<CoreEnvelope<SessionsDeletePayload>, CoreError>",
    "BackendOperationPlan::pending",
    "BackendOperationPlan::no_op",
    "BackendBoundaryProbe::from_repository_source",
  ], "sessions usecase 六边形 typed payload");

  assertContains(analyticsUsecasePath, analyticsUsecaseText, [
    "Result<CoreEnvelope<SessionAnalyticsPayload>, CoreError>",
    "SessionAnalyticsPayload {",
    "BackendOperationPlan::no_op",
  ], "session analytics usecase typed payload");

  assertContains(servicePath, serviceText, [
    "CoreEnvelope<SessionsListPayload>",
    "CoreEnvelope<SessionsDeletePayload>",
    "CoreEnvelope<SessionAnalyticsPayload>",
  ], "sessions service typed envelope");

  assertContains(analyticsServicePath, analyticsServiceText, [
    "CoreEnvelope<SessionAnalyticsPayload>",
  ], "analytics service session payload typed envelope");

  assertContains(featureTypesPath, featureTypesText, [
    "export type SessionsListEnvelope",
    "export type SessionsDeleteEnvelope",
    "export type SessionsMutationPayload",
    "export type SessionsCachePayload",
  ], "sessions 前端模块 typed cache payload");

  assertNotContainsSnippet(contractPath, contractText, [
    "SessionsPayload",
    "serde_json::Value",
  ], "sessions 合同不得退回单一泛型 payload");

  assertNotContainsSnippet(commandPath, commandText, [
    "SessionsPayload",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "sessions command 不得退回泛型 payload");

  assertNotContainsSnippet(servicePath, serviceText, [
    "IpcEvidencePayload",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "sessions service 不得退回 generic evidence payload");
}

validateSessionsTypedPayloadContracts();

function validateAnalyticsTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "analytics.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "analytics.rs");
  const contractPath = join(backendRoot, "contracts", "analytics.rs");
  const systemContractPath = join(backendRoot, "contracts", "system.rs");
  const servicePath = join(frontendRoot, "services", "analytics", "index.ts");
  const featureTypesPath = join(frontendRoot, "features", "analytics", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "analytics", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "analytics", "hooks", "index.ts");
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const systemContractText = readUtf8(systemContractPath);
  const serviceText = readUtf8(servicePath);
  const featureTypesText = readUtf8(featureTypesPath);
  const featureCacheText = readUtf8(featureCachePath);
  const featureHooksText = readUtf8(featureHooksPath);

  assertContains(contractPath, contractText, [
    "pub(crate) struct SessionAnalyticsPayload",
    "pub(crate) struct TokenAnalyticsPayload",
    "pub(crate) struct ToolAnalyticsPayload",
    "pub(crate) struct ChangeAnalyticsPayload",
    "pub backend_status: BackendSkeletonStatus",
  ], "analytics 后端 typed DTO");

  assertContains(systemContractPath, systemContractText, [
    "pub(crate) struct UsageAnalyticsPayload",
    "pub(crate) struct QuotaHistoryPayload",
    "pub backend_status: BackendSkeletonStatus",
  ], "usage/quota analytics 后端 typed DTO");

  assertContains(commandPath, commandText, [
    "Result<CoreEnvelope<UsageAnalyticsPayload>, String>",
    "Result<CoreEnvelope<QuotaHistoryPayload>, String>",
    "Result<CoreEnvelope<SessionAnalyticsPayload>, String>",
    "Result<CoreEnvelope<TokenAnalyticsPayload>, String>",
    "Result<CoreEnvelope<ToolAnalyticsPayload>, String>",
    "Result<CoreEnvelope<ChangeAnalyticsPayload>, String>",
  ], "analytics command typed envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<UsageAnalyticsPayload>, CoreError>",
    "Result<CoreEnvelope<QuotaHistoryPayload>, CoreError>",
    "Result<CoreEnvelope<SessionAnalyticsPayload>, CoreError>",
    "Result<CoreEnvelope<TokenAnalyticsPayload>, CoreError>",
    "Result<CoreEnvelope<ToolAnalyticsPayload>, CoreError>",
    "Result<CoreEnvelope<ChangeAnalyticsPayload>, CoreError>",
    "BackendOperationPlan::pending",
    "BackendOperationPlan::no_op",
    "BackendBoundaryProbe::from_repository_source",
  ], "analytics usecase 六边形 typed payload");

  assertContains(servicePath, serviceText, [
    "CoreEnvelope<UsageAnalyticsPayload>",
    "CoreEnvelope<QuotaHistoryPayload>",
    "CoreEnvelope<SessionAnalyticsPayload>",
    "CoreEnvelope<TokenAnalyticsPayload>",
    "CoreEnvelope<ToolAnalyticsPayload>",
    "CoreEnvelope<ChangeAnalyticsPayload>",
  ], "analytics service typed envelope");

  assertContains(featureTypesPath, featureTypesText, [
    "export type AnalyticsUsageEnvelope",
    "export type AnalyticsSessionEnvelope",
    "export type AnalyticsTokenEnvelope",
    "export type AnalyticsToolEnvelope",
    "export type AnalyticsChangeEnvelope",
    "export type AnalyticsQuotaEnvelope",
    "export type AnalyticsCachePayload",
  ], "analytics 前端模块 typed cache payload");

  assertContains(featureHooksPath, featureHooksText, [
    "AnalyticsCacheEnvelope<AnalyticsUsageEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsSessionEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsTokenEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsToolEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsChangeEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsQuotaEnvelope>",
  ], "analytics hooks typed authoritative envelope");

  assertNotContainsSnippet(contractPath, contractText, [
    "pub(crate) struct AnalyticsPayload",
    "serde_json::Value",
  ], "analytics 合同不得退回泛型 AnalyticsPayload");

  assertNotContainsSnippet(commandPath, commandText, [
    "CoreEnvelope<AnalyticsPayload>",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "analytics command 不得退回泛型 payload");

  assertNotContainsSnippet(featureCachePath, featureCacheText, [
    "ModuleCacheEnvelope<unknown>",
  ], "analytics cache helper 不得使用 unknown authoritative envelope");
}

validateAnalyticsTypedPayloadContracts();

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
    "pub(crate) enum RelayExtraHeaders",
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
    "RelayExtraHeaders",
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
    "fn empty_headers() -> Option<RelayExtraHeaders>",
    "fn diagnostic_payload(",
  ], "relay usecase 寮虹被鍨?payload 缁勮");

  assertContains(servicePath, serviceText, [
    "RelayExtraHeaders",
    "toRelayProviderDraftArgs(input)",
    "toRelayExtraHeadersArg(input.extraHeaders)",
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
    "serde_json::Value",
    "Option<Value>",
  ], "relay contract 涓嶅緱閫€鍥炲ぇ妗?payload");
  assertNotContainsSnippet(commandPath, commandText, [
    "RelayActionPayload",
    "Option<Value>",
    "serde_json::Value",
  ], "relay command 涓嶅緱閫€鍥炴垨閫忎紶 generic payload");
  assertNotContainsSnippet(usecasePath, usecaseText, [
    "RelayActionPayload",
    "pub(crate) fn provider_action(",
    "pub(crate) fn empty_action(",
    "serde_json::Value",
    "Option<Value>",
  ], "relay usecase 涓嶅緱澶嶇敤 generic action owner");
  assertNotContainsSnippet(servicePath, serviceText, [
    "IpcEvidencePayload",
    "IpcJsonObject",
    "restart_codex",
    "extends IpcJsonObject",
  ], "relay service 涓嶅緱閫€鍥?generic evidence payload 鎴栫洿鎺ヨ皟 system command");
}

validateRelayTypedPayloadContracts();

function validateRuntimeExtensionsTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "runtime_extensions.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "runtime_extensions.rs");
  const contractPath = join(backendRoot, "contracts", "runtime_extensions.rs");
  const servicePath = join(frontendRoot, "services", "runtime-extensions", "index.ts");
  const pluginsServicePath = join(frontendRoot, "services", "plugins", "index.ts");
  const featureTypesPath = join(frontendRoot, "features", "plugins", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "plugins", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "plugins", "hooks", "index.ts");
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const serviceText = readUtf8(servicePath);
  const pluginsServiceText = readUtf8(pluginsServicePath);
  const featureTypesText = readUtf8(featureTypesPath);
  const featureCacheText = readUtf8(featureCachePath);
  const featureHooksText = readUtf8(featureHooksPath);

  assertContains(contractPath, contractText, [
    "pub(crate) enum RuntimeExtensionSettingsValue",
    "pub(crate) struct RuntimeExtensionPluginPayload",
    "pub(crate) struct RuntimeExtensionListPayload",
    "pub(crate) struct RuntimeExtensionTogglePayload",
    "pub(crate) struct RuntimeExtensionConfigPayload",
    "pub backend_status: BackendSkeletonStatus",
  ], "runtime-extensions 后端 typed DTO");

  assertContains(commandPath, commandText, [
    "Result<CoreEnvelope<RuntimeExtensionListPayload>, String>",
    "Result<CoreEnvelope<RuntimeExtensionTogglePayload>, String>",
    "Result<CoreEnvelope<RuntimeExtensionConfigPayload>, String>",
    "settings: Option<RuntimeExtensionSettingsValue>",
  ], "runtime-extensions command typed envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<RuntimeExtensionListPayload>, CoreError>",
    "Result<CoreEnvelope<RuntimeExtensionTogglePayload>, CoreError>",
    "Result<CoreEnvelope<RuntimeExtensionConfigPayload>, CoreError>",
    "RuntimeExtensionPluginPayload {",
    "BackendOperationPlan::pending",
    "BackendOperationPlan::no_op",
    "BackendBoundaryProbe::from_repository_source",
  ], "runtime-extensions usecase typed 骨架");

  assertContains(servicePath, serviceText, [
    "CoreEnvelope<RuntimeExtensionListPayload>",
    "CoreEnvelope<RuntimeExtensionTogglePayload>",
    "CoreEnvelope<RuntimeExtensionConfigPayload>",
    "RuntimeExtensionSettingsValue",
  ], "runtime-extensions service typed envelope");

  assertContains(pluginsServicePath, pluginsServiceText, [
    "CoreEnvelope<RuntimeExtensionListPayload>",
    "CoreEnvelope<RuntimeExtensionTogglePayload>",
    "CoreEnvelope<RuntimeExtensionConfigPayload>",
  ], "plugins service typed envelope");

  assertContains(featureTypesPath, featureTypesText, [
    "export type PluginsCachePayload",
    "export type PluginsListEnvelope",
    "export type PluginsToggleEnvelope",
    "export type PluginsConfigEnvelope",
  ], "plugins 前端模块 typed cache payload");

  assertContains(featureHooksPath, featureHooksText, [
    "PluginsListEnvelope",
    "PluginsToggleEnvelope",
    "writePluginsAuthoritativePayload",
    "toPluginsListEnvelope",
  ], "plugins hooks typed authoritative envelope");

  assertContains(featureCachePath, featureCacheText, [
    "Omit<PluginsCacheEnvelope, \"moduleId\">",
  ], "plugins cache helper typed envelope");

  assertNotContainsSnippet(contractPath, contractText, [
    "pub(crate) struct RuntimeExtensionPayload",
    "serde_json::Value",
  ], "runtime-extensions 合同不得回退泛型 payload");

  assertNotContainsSnippet(commandPath, commandText, [
    "RuntimeExtensionPayload",
    "serde_json::Value",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "runtime-extensions command 不得返回泛型 payload");

  assertNotContainsSnippet(servicePath, serviceText, [
    "IpcEvidencePayload",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "runtime-extensions service 不得返回 generic evidence payload");

  assertNotContainsSnippet(pluginsServicePath, pluginsServiceText, [
    "IpcEvidencePayload",
    "CoreEnvelope<IpcEvidencePayload>",
  ], "plugins service 不得返回 generic evidence payload");
}

validateRuntimeExtensionsTypedPayloadContracts();

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
