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
  const systemServiceText = readUtf8(systemServicePath);
  for (const command of [
    "get_notification_client_state",
    "get_mystery_unlock_grants",
    "merge_mystery_unlock_grants",
  ]) {
    assertContains(systemServicePath, systemServiceText, [
      `invokeIpc<CoreEnvelope<IpcEvidencePayload>>("${command}"`,
    ], "system service 必须按后端 envelope 类型消费");
  }
}

validateSystemEnvelopeServiceTypes();

if (failures.length > 0) {
  console.error("后端六边形静态验证失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("后端六边形静态验证通过：commands、usecase、core、platform、repository 边界满足当前骨架规则。");
