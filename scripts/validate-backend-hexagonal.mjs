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

function readRequiredUtf8(path, description) {
  if (!existsSync(path)) {
    failures.push(`missing ${description}: ${toRelative(path)}`);
    return "";
  }

  return readUtf8(path);
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

function assertMatches(file, content, patterns, rule) {
  for (const pattern of patterns) {
    if (!pattern.test(content)) {
      failures.push(`${toRelative(file)} missing ${rule}: ${pattern}`);
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

function findMatchingBrace(content, openBraceIndex) {
  let depth = 0;
  for (let index = openBraceIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function extractFunctionBody(content, functionName) {
  const match = new RegExp(`fn\\s+${functionName}(?:\\s*<[^>]+>)?\\s*\\([^)]*\\)\\s*(?:->\\s*[^\\{]+)?\\{`, "m").exec(content);
  if (!match) {
    return "";
  }

  const openBraceIndex = match.index + match[0].lastIndexOf("{");
  const closeBraceIndex = findMatchingBrace(content, openBraceIndex);
  if (closeBraceIndex === -1) {
    return content.slice(openBraceIndex);
  }

  return content.slice(openBraceIndex, closeBraceIndex + 1);
}

function assertCommandRequiredEnvelope(commandPath, commandText, functionName, argumentName) {
  const body = extractFunctionBody(commandText, functionName);
  if (!body) {
    failures.push(`${toRelative(commandPath)} missing skills command required boundary function: ${functionName}`);
    return;
  }
  const requiredHelperBody = extractFunctionBody(commandText, "required_command_text");
  const boundaryText = `${body}\n${requiredHelperBody}`;

  assertNotContainsSnippet(commandPath, body, [
    "unwrap_or_default()",
  ], `skills ${functionName} command must not swallow missing ${argumentName}`);

  assertMatches(commandPath, boundaryText, [
    new RegExp(`(?:required_command_text::<[\\s\\S]*?\\(\\s*${argumentName}\\s*,|\\b${argumentName}\\b[\\s\\S]*\\.trim\\s*\\()`),
    /\.trim\s*\(/,
    /CoreError::domain\s*\(/,
    /CoreEnvelope::failure\s*\(|failure_envelope\s*\(/,
    /[\u4e00-\u9fff]|\\u\{[0-9a-fA-F]+\}/,
  ], `skills ${functionName} command required/trim/CoreError::domain/failure envelope Chinese missing-argument boundary`);
}

function extractPortImpls(content, portName) {
  const implPattern = new RegExp(`impl\\s+${portName}\\s+for\\s+([A-Za-z0-9_]+)\\s*\\{`, "g");
  const impls = [];
  let match;

  while ((match = implPattern.exec(content)) !== null) {
    const openBraceIndex = match.index + match[0].lastIndexOf("{");
    const closeBraceIndex = findMatchingBrace(content, openBraceIndex);
    impls.push({
      typeName: match[1],
      body: closeBraceIndex === -1 ? content.slice(openBraceIndex) : content.slice(openBraceIndex, closeBraceIndex + 1),
    });
  }

  return impls;
}

function validateSystemPlatformPorts() {
  const portsPath = join(backendRoot, "application", "ports.rs");
  const servicePath = join(backendRoot, "application", "service.rs");
  const portsText = readRequiredUtf8(portsPath, "system/platform port contract");
  const serviceText = readRequiredUtf8(servicePath, "BackendServices platform injection contract");
  const platformContracts = [
    {
      field: "shell",
      port: "ShellPort",
      noop: "NoopShell",
      file: join(backendRoot, "platform", "shell.rs"),
      description: "shell",
    },
    {
      field: "process",
      port: "ProcessPort",
      noop: "NoopProcess",
      file: join(backendRoot, "platform", "process.rs"),
      description: "process",
    },
    {
      field: "permissions",
      port: "PermissionsPort",
      noop: "NoopPermissions",
      file: join(backendRoot, "platform", "permissions.rs"),
      description: "permissions",
    },
    {
      field: "hotspot",
      port: "HotspotRuntimePort",
      noop: "NoopHotspotRuntime",
      file: join(backendRoot, "platform", "hotspot.rs"),
      description: "hotspot",
    },
  ];

  for (const contract of platformContracts) {
    const traitPattern = new RegExp(`trait\\s+${contract.port}\\s*:\\s*Send\\s*\\+\\s*Sync\\b`);
    if (!traitPattern.test(portsText)) {
      failures.push(`${toRelative(portsPath)} 缺少 system/platform port 线程安全边界：${contract.port}: Send + Sync`);
    }

    const fixedNoopFieldPattern = new RegExp(`\\b${contract.field}\\s*:\\s*${contract.noop}\\b`);
    if (fixedNoopFieldPattern.test(serviceText)) {
      failures.push(`${toRelative(servicePath)} 违反 BackendServices platform 注入边界：${contract.field} 字段不得固定为 ${contract.noop}`);
    }

    const portFieldPattern = new RegExp(`\\b${contract.field}\\s*:\\s*Box\\s*<\\s*dyn\\s+${contract.port}\\s*>`);
    if (!portFieldPattern.test(serviceText)) {
      failures.push(`${toRelative(servicePath)} 缺少 BackendServices platform port 注入：${contract.field}: Box<dyn ${contract.port}>`);
    }

    const defaultInjectionSnippets = [
      `${contract.noop}::default()`,
      `${contract.noop}::new()`,
      `Box::new(${contract.noop}`,
      `${contract.field}: ${contract.noop}`,
    ];
    const defaultBodies = `${extractFunctionBody(serviceText, "default")}\n${extractFunctionBody(serviceText, "with_window")}`;
    for (const snippet of defaultInjectionSnippets) {
      if (defaultBodies.includes(snippet)) {
        failures.push(`${toRelative(servicePath)} 违反 BackendServices runtime 注入边界：default/with_window 不得默认注入 ${contract.noop}`);
      }
    }

    const platformText = readRequiredUtf8(contract.file, `${contract.description} platform adapter`);
    assertContains(contract.file, platformText, [`struct ${contract.noop}`, `impl ${contract.port} for ${contract.noop}`], `${contract.description} Noop adapter 仅作 fallback/test 骨架`);

    const impls = extractPortImpls(platformText, contract.port);
    const realImpls = impls.filter((impl) => impl.typeName !== contract.noop);
    if (realImpls.length === 0) {
      failures.push(`${toRelative(contract.file)} 缺少真实 system/platform adapter：需要非 ${contract.noop} 的 ${contract.port} 实现`);
    }

    for (const impl of realImpls) {
      const structPattern = new RegExp(`\\bstruct\\s+${impl.typeName}\\b`);
      if (!structPattern.test(platformText)) {
        failures.push(`${toRelative(contract.file)} 缺少真实 adapter struct 声明：${impl.typeName}`);
      }

      if (/Ok\s*\(\s*\(\s*\)\s*\)/.test(impl.body) || /Ok\s*\(\s*None\s*\)/.test(impl.body)) {
        failures.push(`${toRelative(contract.file)} 违反真实 adapter 结果语义：${impl.typeName} 不得静默 Ok(())/Ok(None) 伪成功，应调用平台能力或返回明确“不支持”的平台错误`);
      }
    }
  }
}

validateSystemPlatformPorts();

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
  const featureCacheSequencePath = join(frontendRoot, "features", "mcp", "cache", "sequence.ts");
  const featureHooksPath = join(frontendRoot, "features", "mcp", "hooks", "index.ts");
  const featureQueryHookPath = join(frontendRoot, "features", "mcp", "hooks", "query.ts");
  const featureMutationHookPath = join(frontendRoot, "features", "mcp", "hooks", "mutation.ts");
  const serviceText = readUtf8(servicePath);
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const featureTypesText = readUtf8(featureTypesPath);
  const featureCacheText = readUtf8(featureCachePath);
  const featureCacheSequenceText = readUtf8(featureCacheSequencePath);
  const featureHooksText = readUtf8(featureHooksPath);
  const featureQueryHookText = readUtf8(featureQueryHookPath);
  const featureMutationHookText = readUtf8(featureMutationHookPath);

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
    'from "./query"',
    'from "./mutation"',
    'from "./page"',
  ], "MCP hooks barrel owner");

  assertNotContainsSnippet(featureHooksPath, featureHooksText, [
    "useQuery",
    "useMutation",
    "writeMcpAuthoritativePayload",
    "writeMcpMutationPayload",
    "mcpService.",
  ], "MCP hooks/index 不得继续承载 typed payload 或 service 逻辑");

  assertContains(featureQueryHookPath, featureQueryHookText, [
    "McpListEnvelope",
    "mcpService.loadServers",
    "writeMcpCachePayload",
  ], "MCP query hooks typed authoritative envelope");

  assertContains(featureMutationHookPath, featureMutationHookText, [
    "mcpService.setServerEnabled",
    "mcpService.removeServer",
    "mcpService.upsertServer",
    "writeMcpMutationPayload",
    "cancelQueries",
  ], "MCP mutation hooks typed authoritative envelope");

  assertContains(featureCachePath, featureCacheText, [
    "McpMutationEnvelope",
    "McpRemoveEnvelope",
    "writeMcpAuthoritativePayload",
    "writeMcpServersMutationPayload",
    "setQueryData<McpListEnvelope>",
  ], "MCP cache typed authoritative envelope");

  assertContains(featureCacheSequencePath, featureCacheSequenceText, [
    "nextMcpCacheSequence",
    "acceptMcpCacheSequence",
    "sequence < mcpLatestAcceptedSequence",
  ], "MCP cache sequence stale/delayed 防护");

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
  assertNotContainsSnippet(featureQueryHookPath, featureQueryHookText, [
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
  ], "MCP query hooks 不得用 unknown authoritative payload");

  assertNotContainsSnippet(featureMutationHookPath, featureMutationHookText, [
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
  ], "MCP mutation hooks 不得用 unknown authoritative payload");

  assertNotContainsSnippet(featureCachePath, featureCacheText, [
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
  ], "MCP cache 不得用 unknown authoritative payload");
}

validateMcpUpsertArgumentChain();
validateMcpTypedPayloadContracts();

function validateCustomInstructionsTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "custom_instructions.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "custom_instructions.rs");
  const contractPath = join(backendRoot, "contracts", "custom_instructions.rs");
  const repositoryPath = join(backendRoot, "repository", "custom_instructions.rs");
  const servicePath = join(frontendRoot, "services", "custom-instructions", "index.ts");
  const ipcPath = join(frontendRoot, "contracts", "ipc", "commands.ts");
  const featureTypesPath = join(frontendRoot, "features", "custom-instructions", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "custom-instructions", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "custom-instructions", "hooks", "index.ts");
  const featureQueryHookPath = join(frontendRoot, "features", "custom-instructions", "hooks", "query.ts");
  const featureMutationHookPath = join(frontendRoot, "features", "custom-instructions", "hooks", "mutation.ts");
  const featureActionHookPath = join(frontendRoot, "features", "custom-instructions", "hooks", "action.ts");
  const featurePageHookPath = join(frontendRoot, "features", "custom-instructions", "hooks", "page.ts");
  const commandText = readRequiredUtf8(commandPath, "custom-instructions command adapter");
  const usecaseText = readRequiredUtf8(usecasePath, "custom-instructions usecase");
  const contractText = readRequiredUtf8(contractPath, "custom-instructions backend contract");
  const repositoryText = readRequiredUtf8(repositoryPath, "custom-instructions repository");
  const serviceText = readRequiredUtf8(servicePath, "custom-instructions service wrapper");
  const ipcText = readRequiredUtf8(ipcPath, "custom-instructions IPC contract");
  const featureTypesText = readRequiredUtf8(featureTypesPath, "custom-instructions feature types");
  const featureCacheText = readRequiredUtf8(featureCachePath, "custom-instructions feature cache");
  const featureHooksText = readRequiredUtf8(featureHooksPath, "custom-instructions hooks barrel");
  const featureQueryHookText = readRequiredUtf8(featureQueryHookPath, "custom-instructions query hook");
  const featureMutationHookText = readRequiredUtf8(featureMutationHookPath, "custom-instructions mutation hook");
  const featureActionHookText = readRequiredUtf8(featureActionHookPath, "custom-instructions action hook");
  const featurePageHookText = readRequiredUtf8(featurePageHookPath, "custom-instructions page hook");

  assertContains(contractPath, contractText, [
    "pub(crate) enum CustomInstructionProtectionState",
    "pub(crate) enum CustomInstructionHistoryAction",
    "pub(crate) struct CustomInstructionCurrentState",
    "pub(crate) struct CustomInstructionHistoryEntry",
    "pub(crate) struct CustomInstructionStatePayload",
    "pub(crate) struct CustomInstructionPreviewPayload",
    "pub status: BackendSkeletonStatus",
    "pub history: Vec<CustomInstructionHistoryEntry>",
  ], "custom-instructions backend typed DTO");

  assertContains(commandPath, commandText, [
    "Result<CoreEnvelope<CustomInstructionStatePayload>, String>",
    "Result<CoreEnvelope<CustomInstructionPreviewPayload>, String>",
    "content: Option<String>",
    "source: Option<String>",
    "template_code: Option<String>",
    "template_title: Option<String>",
    "history_id: Option<String>",
    "state.services().custom_instructions().load_state()",
    "state.services().custom_instructions()",
    ".preview_apply(content)",
    "state.services().custom_instructions().apply(",
    "state.services().custom_instructions().clear_block()",
    "state.services().custom_instructions().rollback(history_id)",
  ], "custom-instructions command typed envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<CustomInstructionStatePayload>, CoreError>",
    "Result<CoreEnvelope<CustomInstructionPreviewPayload>, CoreError>",
    "BackendOperationPlan::pending",
    "BackendOperationPlan::no_op",
    "BackendBoundaryProbe::from_repository_source",
    "CustomInstructionStatePayload {",
    "CustomInstructionCurrentState {",
    "CustomInstructionPreviewPayload {",
    "required_text(",
    "clean_optional_text(",
  ], "custom-instructions usecase typed transaction");

  assertContains(repositoryPath, repositoryText, [
    "pub(crate) struct CustomInstructionsRepository",
    "FileSystemAdapter",
    "RepositoryPathContext",
    "RepositoryPath::CustomInstructionsSource",
    "source_path(&self) -> String",
  ], "custom-instructions repository path boundary");

  assertContains(servicePath, serviceText, [
    "readEnvelopeData(",
    "CoreEnvelope<CustomInstructionStatePayload>",
    "CoreEnvelope<CustomInstructionPreviewPayload>",
    '"load_custom_instruction_state"',
    '"preview_custom_instruction_apply"',
    '"apply_custom_instruction"',
    '"clear_custom_instruction_block"',
    '"rollback_custom_instruction"',
    "systemService.openPath",
  ], "custom-instructions service typed envelope");

  assertContains(ipcPath, ipcText, [
    '"load_custom_instruction_state"',
    '"preview_custom_instruction_apply"',
    '"apply_custom_instruction"',
    '"clear_custom_instruction_block"',
    '"rollback_custom_instruction"',
  ], "custom-instructions IPC command contract");

  assertContains(featureTypesPath, featureTypesText, [
    "export type CustomInstructionsStateQueryKey",
    "export type CustomInstructionsTemplatesQueryKey",
    "export type CustomInstructionsCachePayload",
    "export type CustomInstructionsCacheEnvelope",
    "export interface CustomInstructionsPageController",
  ], "custom-instructions frontend typed cache/controller contract");

  assertContains(featureHooksPath, featureHooksText, [
    'from "./query"',
    'from "./mutation"',
    'from "./action"',
    'from "./page"',
  ], "custom-instructions hooks barrel owner");

  assertContains(featureQueryHookPath, featureQueryHookText, [
    "CUSTOM_INSTRUCTION_STATE_QUERY_KEY",
    "CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY",
    "customInstructionsService.loadState",
    "runCustomInstructionsStateQuery",
    "mergeCustomInstructionTemplates",
  ], "custom-instructions query hook typed payload owner");

  assertContains(featureMutationHookPath, featureMutationHookText, [
    "customInstructionsService.previewApply",
    "customInstructionsService.apply",
    "customInstructionsService.clearBlock",
    "customInstructionsService.rollback",
    "writeCustomInstructionsStateMutationPayload",
    "cancelQueries",
  ], "custom-instructions mutation hook typed payload owner");

  assertContains(featureActionHookPath, featureActionHookText, [
    "useCustomInstructionPathActions",
    "customInstructionsService.openPath",
  ], "custom-instructions action hook owner");

  assertContains(featurePageHookPath, featurePageHookText, [
    "useCustomInstructionsPageController",
    "CustomInstructionsPageController",
    "useCustomInstructionQueries",
    "useCustomInstructionMutations",
    "useCustomInstructionPathActions",
    "stateQuery.isError",
    "templatesQuery.isError",
    "loadErrorPanel",
  ], "custom-instructions page controller owner");

  assertContains(featureCachePath, featureCacheText, [
    "createModuleCacheOwner<CustomInstructionsCachePayload>(\"custom-instructions\")",
    "Omit<CustomInstructionsCacheEnvelope<TPayload>, \"moduleId\">",
    "writeCustomInstructionsStatePayload",
    "runCustomInstructionsStateQuery",
    "writeCustomInstructionsStateMutationPayload",
    "invalidateCustomInstructionsContractQueries",
    "setQueryData<CustomInstructionStatePayload>",
    "nextCustomInstructionsCacheSequence",
  ], "custom-instructions cache typed authoritative envelope");

  assertNotContains(commandPath, commandText, [
    /\bserde_json::Value\b/,
    /\bCoreEnvelope<IpcEvidencePayload>\b/,
    /\bCoreEnvelope<unknown>\b/,
  ], "custom-instructions command must not return generic payload");

  assertNotContains(usecasePath, usecaseText, [
    /\bserde_json::Value\b/,
    /\bCoreEnvelope<IpcEvidencePayload>\b/,
    /\bCoreEnvelope<unknown>\b/,
  ], "custom-instructions usecase must not return generic payload");

  assertNotContains(servicePath, serviceText, [
    /\bIpcEvidencePayload\b/,
    /\bIpcJsonObject\b/,
    /\bCoreEnvelope<unknown>\b/,
  ], "custom-instructions service must not return generic evidence payload");

  assertNotContains(featureHooksPath, featureHooksText, [
    /\buse(Query|Mutation|QueryClient|State|Reducer|Effect|Memo|Callback)\b/,
    /@\/services\/custom-instructions|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|customInstructionsService\.|invokeIpc|invoke\(/,
  ], "custom-instructions hooks/index must stay split barrel");

  assertNotContains(featureActionHookPath, featureActionHookText, [
    /\buse(Query|Mutation|QueryClient)\b/,
    /\bsetQueryData|invalidateQueries|cancelQueries|CUSTOM_INSTRUCTION_[A-Z0-9_]+_QUERY_KEY|writeCustomInstructions\b/,
    /@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|invokeIpc|invoke\(/,
  ], "custom-instructions action hook must not own TanStack, cache, or IPC");

  assertNotContains(featurePageHookPath, featurePageHookText, [
    /\buse(Query|Mutation|QueryClient)\b/,
    /\bsetQueryData|invalidateQueries|cancelQueries|CUSTOM_INSTRUCTION_[A-Z0-9_]+_QUERY_KEY|runCustomInstructionsStateQuery|writeCustomInstructions\b/,
    /@\/services\/custom-instructions|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|customInstructionsService\.|invokeIpc|invoke\(/,
    /\bModuleCacheEnvelope<unknown>|payload:\s*unknown|response\.data\b/,
  ], "custom-instructions page controller must not own TanStack, service/API/IPC, query keys, or cache writes");

  assertNotContainsSnippet(featureTypesPath, featureTypesText, [
    "CustomInstructionsCacheEnvelope<TPayload = unknown>",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "ReturnType<typeof useCustomInstructionsPageController>",
  ], "custom-instructions feature types must keep explicit typed payloads and controller contracts");

  assertNotContainsSnippet(featureCachePath, featureCacheText, [
    "createModuleCacheOwner(\"custom-instructions\")",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "customInstructionsService.",
    "invokeIpc",
  ], "custom-instructions cache must keep typed authoritative payloads");

  assertNotContainsSnippet(featureQueryHookPath, featureQueryHookText, [
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "useMutation",
  ], "custom-instructions query hook must keep typed authoritative payloads");

  assertNotContainsSnippet(featureMutationHookPath, featureMutationHookText, [
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "useMutation<unknown",
  ], "custom-instructions mutation hook must keep typed authoritative payloads");
}

validateCustomInstructionsTypedPayloadContracts();

function validateSkillsTypedPayloadContracts() {
  const servicePath = join(frontendRoot, "services", "skills", "index.ts");
  const commandPath = join(backendRoot, "commands", "skills.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "skills.rs");
  const contractPath = join(backendRoot, "contracts", "skills.rs");
  const ipcPath = join(frontendRoot, "contracts", "ipc", "commands.ts");
  const featureTypesPath = join(frontendRoot, "features", "skills", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "skills", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "skills", "hooks", "index.ts");
  const featureQueryHookPath = join(frontendRoot, "features", "skills", "hooks", "query.ts");
  const featureMutationHookPath = join(frontendRoot, "features", "skills", "hooks", "mutation.ts");
  const featurePageHookPath = join(frontendRoot, "features", "skills", "hooks", "page.ts");
  const serviceText = readRequiredUtf8(servicePath, "skills service wrapper");
  const commandText = readRequiredUtf8(commandPath, "skills command adapter");
  const usecaseText = readRequiredUtf8(usecasePath, "skills usecase");
  const contractText = readRequiredUtf8(contractPath, "skills backend contract");
  const ipcText = readRequiredUtf8(ipcPath, "skills IPC contract");
  const featureTypesText = readRequiredUtf8(featureTypesPath, "skills feature types");
  const featureCacheText = readRequiredUtf8(featureCachePath, "skills feature cache");
  const featureHooksText = readRequiredUtf8(featureHooksPath, "skills hooks barrel");
  const featureQueryHookText = readRequiredUtf8(featureQueryHookPath, "skills query hook");
  const featureMutationHookText = readRequiredUtf8(featureMutationHookPath, "skills mutation hook");
  const featurePageHookText = readRequiredUtf8(featurePageHookPath, "skills page hook");

  assertContains(contractPath, contractText, [
    "pub(crate) struct SkillListPayload",
    "pub(crate) struct SkillBackupListPayload",
    "pub(crate) struct SkillImportPayload",
    "pub(crate) struct SkillRemovePayload",
    "pub(crate) struct SkillRestorePayload",
    "pub(crate) struct SkillDeleteBackupPayload",
  ], "skills backend typed DTO");

  assertContains(commandPath, commandText, [
    "Result<CoreEnvelope<SkillListPayload>, String>",
    "Result<CoreEnvelope<SkillBackupListPayload>, String>",
    "Result<CoreEnvelope<SkillImportPayload>, String>",
    "Result<CoreEnvelope<SkillRemovePayload>, String>",
    "Result<CoreEnvelope<SkillRestorePayload>, String>",
    "Result<CoreEnvelope<SkillDeleteBackupPayload>, String>",
  ], "skills command typed envelope");

  assertNotContainsSnippet(commandPath, commandText, [
    "unwrap_or_default()",
  ], "skills command 不得用 unwrap_or_default() 吞掉必填 IPC 参数");

  assertCommandRequiredEnvelope(commandPath, commandText, "import_skill", "path");
  assertCommandRequiredEnvelope(commandPath, commandText, "remove_skill", "id");
  assertCommandRequiredEnvelope(commandPath, commandText, "restore_skill_backup", "id");
  assertCommandRequiredEnvelope(commandPath, commandText, "delete_skill_backup", "id");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<SkillListPayload>, CoreError>",
    "Result<CoreEnvelope<SkillBackupListPayload>, CoreError>",
    "Result<CoreEnvelope<SkillImportPayload>, CoreError>",
    "Result<CoreEnvelope<SkillRemovePayload>, CoreError>",
    "Result<CoreEnvelope<SkillRestorePayload>, CoreError>",
    "Result<CoreEnvelope<SkillDeleteBackupPayload>, CoreError>",
  ], "skills usecase typed payload");

  assertContains(servicePath, serviceText, [
    "CoreEnvelope<SkillListPayload>",
    "CoreEnvelope<SkillBackupListPayload>",
    "CoreEnvelope<SkillImportPayload>",
    "CoreEnvelope<SkillRemovePayload>",
    "CoreEnvelope<SkillRestorePayload>",
    "CoreEnvelope<SkillDeleteBackupPayload>",
  ], "skills service typed envelope");

  assertContains(ipcPath, ipcText, [
    '"load_installed_skills"',
    '"load_skill_backups"',
    '"import_skill"',
    '"remove_skill"',
    '"restore_skill_backup"',
    '"delete_skill_backup"',
  ], "skills IPC command contract");

  assertContains(featureTypesPath, featureTypesText, [
    "export type SkillsInstalledEnvelope",
    "export type SkillsBackupsEnvelope",
    "export type SkillsImportEnvelope",
    "export type SkillsRemoveEnvelope",
    "export type SkillsRestoreEnvelope",
    "export type SkillsDeleteBackupEnvelope",
    "export type SkillsMutationPayload",
    "export type SkillsMutationEnvelope",
    "export type SkillsCachePayload",
    "export interface SkillsPageController",
  ], "skills frontend typed cache/controller contract");

  assertContains(featureHooksPath, featureHooksText, [
    'from "./query"',
    'from "./mutation"',
    'from "./page"',
  ], "skills hooks barrel owner");

  assertNotContainsSnippet(featureHooksPath, featureHooksText, [
    "useQuery",
    "useMutation",
    "writeSkillsAuthoritativePayload",
    "writeSkillsMutationPayload",
    "skillsService.",
  ], "skills hooks/index must not own query, mutation, payload, or service logic");

  assertContains(featureQueryHookPath, featureQueryHookText, [
    "SKILLS_INSTALLED_QUERY_KEY",
    "SKILLS_BACKUPS_QUERY_KEY",
    "skillsService.loadInstalled",
    "skillsService.loadBackups",
    "writeSkillsCachePayload",
  ], "skills query hooks typed authoritative envelope");

  assertContains(featureMutationHookPath, featureMutationHookText, [
    "skillsService.pickSkillDirectory",
    "skillsService.importSkill",
    "skillsService.removeSkill",
    "skillsService.restoreBackup",
    "skillsService.deleteBackup",
    "writeSkillsMutationPayload",
    "cancelQueries",
    "return null;",
    "if (payload) return writeSkillsMutationPayload(queryClient, payload)",
  ], "skills mutation hooks typed authoritative envelope and import cancel no-op");

  assertContains(featurePageHookPath, featurePageHookText, [
    "SkillsPageController",
    "useSkillsPageQueries",
    "useSkillsPageMutations",
    "activeQuery.isError",
    "queryFailureAlert",
    "activeQuery.refetch()",
    "skills.loadFailed",
    "skills.loadFailedDesc",
  ], "skills page controller query failure contract");

  assertContains(featureCachePath, featureCacheText, [
    "createModuleCacheOwner<SkillsCachePayload>(\"skills\")",
    "Omit<SkillsCacheEnvelope, \"moduleId\">",
    "writeSkillsAuthoritativePayload",
    "writeSkillsCachePayload",
    "writeSkillsMutationPayload",
    "setQueryData<CoreEnvelope<SkillListPayload>>",
    "setQueryData<CoreEnvelope<SkillBackupListPayload>>",
    "invalidateSkillsContractQueries",
  ], "skills cache typed authoritative envelope");

  assertNotContains(commandPath, commandText, [
    /\bserde_json::Value\b/,
    /\bCoreEnvelope<IpcEvidencePayload>\b/,
    /\bCoreEnvelope<unknown>\b/,
  ], "skills command must not return generic payload");

  assertNotContains(usecasePath, usecaseText, [
    /\bserde_json::Value\b/,
    /\bCoreEnvelope<IpcEvidencePayload>\b/,
    /\bCoreEnvelope<unknown>\b/,
  ], "skills usecase must not return generic payload");

  assertNotContains(servicePath, serviceText, [
    /\bIpcEvidencePayload\b/,
    /\bIpcJsonObject\b/,
    /\bCoreEnvelope<unknown>\b/,
  ], "skills service must not return generic evidence payload");

  assertNotContains(featurePageHookPath, featurePageHookText, [
    /\buse(Query|Mutation|QueryClient)\b/,
    /@\/services\/skills|@\/lib\/api|@\/contracts\/ipc|@tauri-apps\/api|skillsService\.|invokeIpc|invoke\(/,
  ], "skills page controller must not call TanStack or service/API/IPC directly");

  assertNotContainsSnippet(featureTypesPath, featureTypesText, [
    "SkillsCacheEnvelope<TPayload = unknown>",
    "ModuleCacheEnvelope<unknown>",
    "ReturnType<typeof useSkillsPageController>",
  ], "skills feature types must keep explicit typed payloads and controller contracts");

  assertNotContainsSnippet(featureCachePath, featureCacheText, [
    "createModuleCacheOwner(\"skills\")",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
  ], "skills cache must keep typed authoritative payloads");

  assertNotContainsSnippet(featureQueryHookPath, featureQueryHookText, [
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
  ], "skills query hook must keep typed authoritative payloads");

  assertNotContainsSnippet(featureMutationHookPath, featureMutationHookText, [
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
  ], "skills mutation hook must keep typed authoritative payloads");
}

validateSkillsTypedPayloadContracts();

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

function validateMaintenanceSystemSplitPayloadContracts() {
  const systemCommandPath = join(backendRoot, "commands", "system.rs");
  const systemUsecasePath = join(backendRoot, "application", "usecase", "system.rs");
  const systemContractPath = join(backendRoot, "contracts", "system.rs");
  const systemServicePath = join(frontendRoot, "services", "system", "index.ts");
  const maintenanceServicePath = join(frontendRoot, "services", "maintenance", "index.ts");
  const hooksIndexPath = join(frontendRoot, "features", "maintenance", "hooks", "index.ts");
  const queryHookPath = join(frontendRoot, "features", "maintenance", "hooks", "query.ts");
  const mutationHookPath = join(frontendRoot, "features", "maintenance", "hooks", "mutation.ts");
  const pageHookPath = join(frontendRoot, "features", "maintenance", "hooks", "page.ts");
  const cachePath = join(frontendRoot, "features", "maintenance", "cache", "index.ts");
  const typesPath = join(frontendRoot, "features", "maintenance", "types", "index.ts");
  const diagnosticsDialogPath = join(
    frontendRoot,
    "features",
    "maintenance",
    "dialogs",
    "diagnostics.tsx",
  );

  const systemCommandText = readRequiredUtf8(systemCommandPath, "maintenance system command contract");
  const systemUsecaseText = readRequiredUtf8(systemUsecasePath, "maintenance system usecase contract");
  const systemContractText = readRequiredUtf8(systemContractPath, "maintenance system DTO contract");
  const systemServiceText = readRequiredUtf8(systemServicePath, "maintenance system service facade");
  const maintenanceServiceText = readRequiredUtf8(maintenanceServicePath, "maintenance service facade");
  const hooksIndexText = readRequiredUtf8(hooksIndexPath, "maintenance hooks barrel");
  const queryHookText = readRequiredUtf8(queryHookPath, "maintenance query hook owner");
  const mutationHookText = readRequiredUtf8(mutationHookPath, "maintenance mutation hook owner");
  const pageHookText = readRequiredUtf8(pageHookPath, "maintenance page hook owner");
  const cacheText = readRequiredUtf8(cachePath, "maintenance cache owner");
  const typesText = readRequiredUtf8(typesPath, "maintenance frontend types owner");
  const diagnosticsDialogText = readRequiredUtf8(
    diagnosticsDialogPath,
    "maintenance diagnostics dialog typed props",
  );

  assertContains(systemContractPath, systemContractText, [
    "pub(crate) struct CleanPayload",
    "pub(crate) struct RebuildRegistryPayload",
    "pub(crate) struct DiagnosePayload",
    "pub(crate) struct SystemInfo",
    "pub(crate) struct SystemActionPayload",
  ], "maintenance/system backend typed DTO");

  assertContains(systemCommandPath, systemCommandText, [
    "Result<CoreEnvelope<CleanPayload>, String>",
    "Result<CoreEnvelope<RebuildRegistryPayload>, String>",
    "Result<CoreEnvelope<DiagnosePayload>, String>",
    "Result<CoreEnvelope<SystemInfo>, String>",
    "Result<CoreEnvelope<SystemActionPayload>, String>",
    "Result<CoreEnvelope<bool>, String>",
    "state.services().system().clean()",
    "state.services().system().rebuild_registry()",
    "state.services().system().diagnose()",
    "state.services().system().get_system_info()",
    "state.services().system().get_image_compat()",
    "state.services().system().set_image_compat(enabled)",
  ], "maintenance/system command typed envelope");

  assertContains(systemUsecasePath, systemUsecaseText, [
    "Result<CoreEnvelope<CleanPayload>, CoreError>",
    "Result<CoreEnvelope<RebuildRegistryPayload>, CoreError>",
    "Result<CoreEnvelope<DiagnosePayload>, CoreError>",
    "Result<CoreEnvelope<SystemInfo>, CoreError>",
    "Result<CoreEnvelope<SystemActionPayload>, CoreError>",
    "Result<CoreEnvelope<bool>, CoreError>",
    "CleanPayload {",
    "RebuildRegistryPayload {",
    "DiagnosePayload {",
    "SystemInfo {",
    "system_action_payload(&plan)",
  ], "maintenance/system usecase typed payload");

  assertContains(systemServicePath, systemServiceText, [
    "CoreEnvelope<CleanPayload>",
    "CoreEnvelope<RebuildRegistryPayload>",
    "CoreEnvelope<DiagnosePayload>",
    "CoreEnvelope<SystemInfoPayload>",
    "CoreEnvelope<SystemActionPayload>",
    "CoreEnvelope<boolean>>(\"get_image_compat\")",
    "CoreEnvelope<boolean>>(\"set_image_compat\"",
  ], "maintenance/system service typed envelope");

  assertContains(maintenanceServicePath, maintenanceServiceText, [
    "readEnvelopeData(systemService.clean())",
    "readEnvelopeData(systemService.rebuildRegistry())",
    "readEnvelopeData(systemService.diagnose())",
    "systemService.restartCodex",
    "systemService.forceKillCodex",
    "systemService.resetCodexConfig",
    "systemService.getImageCompat",
    "systemService.setImageCompat",
    "systemService.getSystemInfo",
    "CoreEnvelope<RelayDiagnosticPayload>",
    "CoreEnvelope<RelayRouterIssueFixPayload>",
  ], "maintenance service typed system/router facade");

  assertContains(typesPath, typesText, [
    "export type MaintenanceCachePayload",
    "export type MaintenanceQueryPayloadForKey",
    "export type MaintenanceSystemInfoPayload",
    "export type MaintenanceRouterDiagnosticsPayload = RelayDiagnosticPayload",
    "export type MaintenanceRouterFixPayload = RelayRouterIssueFixPayload",
    "export interface MaintenancePageController",
    "ModuleCacheEnvelope<TPayload>",
  ], "maintenance frontend split types");

  assertContains(cachePath, cacheText, [
    "createModuleCacheOwner<MaintenanceCachePayload>(\"maintenance\")",
    "Omit<MaintenanceCacheEnvelope<TPayload>, \"moduleId\">",
    "TKey extends MaintenanceWritableQueryKey",
    "MaintenanceQueryPayloadForKey<TKey>",
    "toMaintenanceCachePayload",
    "TPayload extends MaintenanceActionPayload",
  ], "maintenance frontend split cache payload owner");

  assertContains(hooksIndexPath, hooksIndexText, [
    "from \"./query\"",
    "from \"./mutation\"",
    "from \"./page\"",
  ], "maintenance hooks/index split barrel");

  assertContains(queryHookPath, queryHookText, [
    "useQuery",
    "useQueryClient",
    "runMaintenanceQuery",
    "MAINTENANCE_IMAGE_COMPAT_QUERY_KEY",
    "MAINTENANCE_SYSTEM_INFO_QUERY_KEY",
    "maintenanceService.getImageCompat",
    "maintenanceService.getSystemInfo",
  ], "maintenance query hook typed payload owner");

  assertContains(mutationHookPath, mutationHookText, [
    "useMutation",
    "useQueryClient",
    "prepareMaintenanceMutation",
    "writeMaintenanceActionPayload",
    "writeMaintenanceMutationPayload",
    "invalidateMaintenanceContractQueries",
    "maintenanceService.diagnose",
    "maintenanceService.clean",
    "maintenanceService.rebuildRegistry",
    "maintenanceService.runCodexRouterDiagnostics",
    "maintenanceService.fixCodexRouterIssue",
  ], "maintenance mutation hook typed payload owner");

  assertContains(pageHookPath, pageHookText, [
    "MaintenancePageController",
    "restartDialog",
    "routerDiagnosticsDialog",
    "value: systemInfoQuery.data?.os ?? \"-\"",
    "value: systemInfoQuery.data?.arch ?? \"-\"",
    "value: systemInfoQuery.data?.osVersion ?? \"-\"",
  ], "maintenance page controller contract");

  assertContains(diagnosticsDialogPath, diagnosticsDialogText, [
    "runDiagnostics: () => Promise<MaintenanceRouterDiagnosticsPayload>",
    "fixResult: MaintenanceRouterFixPayload",
    "diagnosticsResult: MaintenanceRouterDiagnosticsPayload",
  ], "maintenance diagnostics dialog typed props");

  assertNotContainsSnippet(systemCommandPath, systemCommandText, [
    "serde_json::Value",
    "CoreEnvelope<Value>",
  ], "maintenance/system command must not return generic payload");

  assertNotContainsSnippet(systemUsecasePath, systemUsecaseText, [
    "serde_json::Value",
    "CoreEnvelope<Value>",
    "json!",
  ], "maintenance/system usecase must not return generic payload");

  assertNotContainsSnippet(systemServicePath, systemServiceText, [
    "CoreEnvelope<unknown>",
    "IpcEvidencePayload",
    "IpcJsonObject",
  ], "maintenance/system service must not return generic evidence payload");

  assertNotContainsSnippet(maintenanceServicePath, maintenanceServiceText, [
    "CoreEnvelope<unknown>",
    "IpcEvidencePayload",
  ], "maintenance service must not return generic evidence payload");

  assertNotContainsSnippet(hooksIndexPath, hooksIndexText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "payload: unknown",
    "prepareMaintenanceMutation",
    "maintenanceService.",
    "systemService.",
  ], "maintenance hooks/index must not own query, mutation, payload, or service logic");

  assertNotContainsSnippet(typesPath, typesText, [
    "MaintenanceCacheEnvelope<TPayload = unknown>",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "MaintenancePageController = ReturnType",
  ], "maintenance frontend split types must not loosen typed payloads");

  assertNotContainsSnippet(cachePath, cacheText, [
    "createModuleCacheOwner(\"maintenance\")",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "maintenanceService.",
    "systemService.",
  ], "maintenance frontend cache owner must not loosen typed payloads or call services");

  assertNotContainsSnippet(queryHookPath, queryHookText, [
    "useMutation",
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
    "systemService.",
    "@/lib/api",
    "@/contracts/ipc",
    "invokeIpc",
  ], "maintenance frontend query owner must not mix mutation, generic payloads, or IPC");

  assertNotContainsSnippet(mutationHookPath, mutationHookText, [
    "useQuery(",
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
    "systemService.",
    "@/lib/api",
    "@/contracts/ipc",
    "invokeIpc",
  ], "maintenance frontend mutation owner must not mix query, generic payloads, or IPC");

  assertNotContainsSnippet(pageHookPath, pageHookText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "setQueryData",
    "invalidateQueries",
    "cancelQueries",
    "prepareMaintenanceMutation",
    "MAINTENANCE_IMAGE_COMPAT_QUERY_KEY",
    "MAINTENANCE_SYSTEM_INFO_QUERY_KEY",
    "maintenanceService.",
    "systemService.",
    "@/lib/api",
    "@/contracts/ipc",
    "invokeIpc",
    "payload: unknown",
  ], "maintenance page controller must not own TanStack, cache keys, or service/API access");
}

validateMaintenanceSystemSplitPayloadContracts();

function validateSettingsTypedPayloadContracts() {
  const systemCommandPath = join(backendRoot, "commands", "system.rs");
  const hotspotCommandPath = join(backendRoot, "commands", "hotspot.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "system.rs");
  const contractPath = join(backendRoot, "contracts", "system.rs");
  const systemServicePath = join(frontendRoot, "services", "system", "index.ts");
  const settingsServicePath = join(frontendRoot, "services", "settings", "index.ts");
  const ipcPath = join(frontendRoot, "contracts", "ipc", "commands.ts");
  const featureTypesPath = join(frontendRoot, "features", "settings", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "settings", "cache", "index.ts");
  const hooksIndexPath = join(frontendRoot, "features", "settings", "hooks", "index.ts");
  const queryHookPath = join(frontendRoot, "features", "settings", "hooks", "query.ts");
  const mutationHookPath = join(frontendRoot, "features", "settings", "hooks", "mutation.ts");
  const actionHookPath = join(frontendRoot, "features", "settings", "hooks", "action.ts");
  const pageHookPath = join(frontendRoot, "features", "settings", "hooks", "page.ts");

  const systemCommandText = readRequiredUtf8(systemCommandPath, "settings system command contract");
  const hotspotCommandText = readRequiredUtf8(hotspotCommandPath, "settings hotspot command contract");
  const usecaseText = readRequiredUtf8(usecasePath, "settings system usecase contract");
  const contractText = readRequiredUtf8(contractPath, "settings system DTO contract");
  const systemServiceText = readRequiredUtf8(systemServicePath, "settings system service facade");
  const settingsServiceText = readRequiredUtf8(settingsServicePath, "settings service facade");
  const ipcText = readRequiredUtf8(ipcPath, "settings IPC command map");
  const featureTypesText = readRequiredUtf8(featureTypesPath, "settings feature types owner");
  const featureCacheText = readRequiredUtf8(featureCachePath, "settings feature cache owner");
  const hooksIndexText = readRequiredUtf8(hooksIndexPath, "settings hooks barrel owner");
  const queryHookText = readRequiredUtf8(queryHookPath, "settings query hook owner");
  const mutationHookText = readRequiredUtf8(mutationHookPath, "settings mutation hook owner");
  const actionHookText = readRequiredUtf8(actionHookPath, "settings action hook owner");
  const pageHookText = readRequiredUtf8(pageHookPath, "settings page hook owner");
  const splitHookText = [
    hooksIndexText,
    queryHookText,
    mutationHookText,
    actionHookText,
    pageHookText,
  ].join("\n");

  assertContains(contractPath, contractText, [
    "pub(crate) struct ApiProxyConfigPayload",
    "pub(crate) struct ApiProxyTestPayload",
    "pub(crate) struct ApiProxyDetectPayload",
    "pub(crate) struct AutoSwitchConfigPayload",
    "pub(crate) struct UpdateInstallabilityPayload",
    "pub(crate) struct SystemActionPayload",
  ], "settings system DTO typed payload");

  assertContains(systemCommandPath, systemCommandText, [
    "Result<CoreEnvelope<CoreSnapshotPayload>, String>",
    "Result<CoreEnvelope<AutoSwitchConfigPayload>, String>",
    "Result<CoreEnvelope<ApiModePayload>, String>",
    "Result<CoreEnvelope<ApiProxyTestPayload>, String>",
    "Result<CoreEnvelope<ApiProxyDetectPayload>, String>",
    "Result<CoreEnvelope<String>, String>",
    "Result<CoreEnvelope<UpdateInstallabilityPayload>, String>",
  ], "settings system command typed envelope");

  assertContains(hotspotCommandPath, hotspotCommandText, [
    "Result<CoreEnvelope<bool>, String>",
    "Result<CoreEnvelope<SystemActionPayload>, String>",
  ], "settings hotspot command typed envelope");

  assertContains(usecasePath, usecaseText, [
    "Result<CoreEnvelope<CoreSnapshotPayload>, CoreError>",
    "Result<CoreEnvelope<AutoSwitchConfigPayload>, CoreError>",
    "Result<CoreEnvelope<ApiModePayload>, CoreError>",
    "Result<CoreEnvelope<ApiProxyTestPayload>, CoreError>",
    "Result<CoreEnvelope<ApiProxyDetectPayload>, CoreError>",
    "Result<CoreEnvelope<String>, CoreError>",
    "Result<CoreEnvelope<UpdateInstallabilityPayload>, CoreError>",
    "Result<CoreEnvelope<bool>, CoreError>",
  ], "settings system usecase typed envelope");

  assertContains(systemServicePath, systemServiceText, [
    "CoreEnvelope<CoreSnapshotPayload>",
    "CoreEnvelope<AutoSwitchConfigPayload>",
    "CoreEnvelope<ApiModePayload>",
    "CoreEnvelope<ApiProxyTestPayload>",
    "CoreEnvelope<ApiProxyDetectPayload>",
    "CoreEnvelope<UpdateInstallabilityPayload>",
    "CoreEnvelope<boolean>",
  ], "settings frontend system service typed envelope");

  assertContains(settingsServicePath, settingsServiceText, [
    "loadSnapshot: systemService.loadSnapshot",
    "setAutoSwitch: systemService.setAutoSwitch",
    "configureAutoSwitch: systemService.configureAutoSwitch",
    "setApiProxyConfig: systemService.setApiProxyConfig",
    "testApiProxyConfig: systemService.testApiProxyConfig",
    "detectApiProxyConfig: systemService.detectApiProxyConfig",
    "getUsageRefreshInterval: systemService.getUsageRefreshInterval",
    "setUsageRefreshInterval: systemService.setUsageRefreshInterval",
    "checkUpdateInstallability: systemService.checkUpdateInstallability",
    "hasNotch: systemService.hasNotch",
    "getHotspotEnabled: systemService.getHotspotEnabled",
    "setHotspotEnabled: systemService.setHotspotEnabled",
    "hotspotReady: systemService.hotspotReady",
    "getImageCompat: systemService.getImageCompat",
    "setImageCompat: systemService.setImageCompat",
  ], "settings service must stay a systemService facade");

  for (const command of [
    "load_snapshot",
    "set_auto_switch",
    "configure_auto_switch",
    "set_api_proxy_config",
    "test_api_proxy_config",
    "detect_api_proxy_config",
    "get_usage_refresh_interval",
    "set_usage_refresh_interval",
    "check_update_installability",
    "has_notch",
    "get_hotspot_enabled",
    "set_hotspot_enabled",
    "hotspot_ready",
    "get_image_compat",
    "set_image_compat",
  ]) {
    assertContains(ipcPath, ipcText, [`"command": "${command}"`], "settings IPC command map");
    assertNotContainsSnippet(settingsServicePath, settingsServiceText, [
      `"${command}"`,
      `'${command}'`,
    ], "settings service must not wrap raw system IPC commands");
  }

  assertContains(hooksIndexPath, hooksIndexText, [
    'from "./query"',
    'from "./mutation"',
    'from "./action"',
    'from "./page"',
  ], "settings hooks barrel owner");
  assertNotContainsSnippet(hooksIndexPath, hooksIndexText, [
    'from "../types"',
    "from '../types'",
  ], "settings hooks barrel must only re-export split hook owners");

  assertContains(queryHookPath, queryHookText, [
    "settingsService.loadSnapshot",
    "settingsService.getUsageRefreshInterval",
    "settingsService.getImageCompat",
    "runSettingsQuery",
  ], "settings query hook typed system facade consumption");

  assertContains(mutationHookPath, mutationHookText, [
    "setUsageRefreshInterval",
    "settingsService.setApiProxyConfig",
    "settingsService.setHotspotEnabled",
    "beginSettingsMutation",
    "writeSettingsMutationPayload",
  ], "settings mutation hook typed payload writeback");

  assertContains(actionHookPath, actionHookText, [
    "useSettingsBusyActions",
    "useBusyAction",
    "updateCheckAction",
    "detectProxyAction",
    "testProxyAction",
    "saveProxyAction",
  ], "settings action hook UI effect owner");

  assertContains(pageHookPath, pageHookText, [
    "useSettingsPageController",
    "SettingsPageController",
  ], "settings page controller contract");

  assertContains(featureTypesPath, featureTypesText, [
    "export interface SettingsPageController",
    "export interface SettingsAppearanceController",
    "export interface SettingsStatusController",
    "export interface SettingsModeSwitchController",
    "export interface SettingsAboutController",
    "export interface SettingsThresholdDialogController",
    "export interface SettingsProxyDialogController",
    "export interface SettingsPageActions",
    "export interface SettingsControllerProps",
    "export type SettingsCachePayload",
    "export type SettingsCacheEnvelope",
  ], "settings feature explicit controller/cache types");

  assertContains(featureCachePath, featureCacheText, [
    "createModuleCacheOwner<SettingsCachePayload>(\"settings\")",
    "Omit<SettingsCacheEnvelope<TPayload>, \"moduleId\">",
    "writeSettingsMutationPayload",
    "invalidateSettingsContractQueries",
    "SettingsQueryPayloadForKey<TKey>",
  ], "settings cache typed authoritative payload");

  assertNotContainsSnippet(systemServicePath, systemServiceText, [
    "CoreEnvelope<unknown>",
    "CoreEnvelope<IpcEvidencePayload>",
    "IpcJsonObject",
  ], "settings system service must not return generic payload");

  assertNotContainsSnippet(settingsServicePath, settingsServiceText, [
    "invokeIpc",
    "CoreEnvelope<unknown>",
    "CoreEnvelope<IpcEvidencePayload>",
    "IpcJsonObject",
  ], "settings service facade must not bypass system service or use generic payload");

  assertNotContainsSnippet(featureTypesPath, featureTypesText, [
    "SettingsCacheEnvelope<TPayload = unknown>",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "SettingsPageController = ReturnType",
  ], "settings feature types must not return unknown or ReturnType controller");

  assertNotContainsSnippet(featureCachePath, featureCacheText, [
    "createModuleCacheOwner(\"settings\")",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
  ], "settings cache must not return unknown authoritative payload");

  assertNotContainsSnippet(pageHookPath, pageHookText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "settingsService.",
    "systemService.",
    "invokeIpc",
  ], "settings page hook must not own TanStack or service/API/IPC");

  assertNotContainsSnippet(hooksIndexPath, splitHookText, [
    "Promise<unknown> | void",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
  ], "settings split hooks must not loosen typed payloads");
}

validateSettingsTypedPayloadContracts();

function validateAccountsTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "accounts.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "accounts.rs");
  const contractPath = join(backendRoot, "contracts", "accounts.rs");
  const servicePath = join(frontendRoot, "services", "accounts", "index.ts");
  const featureTypesPath = join(frontendRoot, "features", "accounts", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "accounts", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "accounts", "hooks", "index.ts");
  const featureQueryHookPath = join(frontendRoot, "features", "accounts", "hooks", "query.ts");
  const featureMutationHookPath = join(frontendRoot, "features", "accounts", "hooks", "mutation.ts");
  const featureActionHookPath = join(frontendRoot, "features", "accounts", "hooks", "action.ts");
  const featurePageHookPath = join(frontendRoot, "features", "accounts", "hooks", "page.ts");
  const featureControllerConsumerPaths = [
    ...walkFiles(join(frontendRoot, "features", "accounts", "panels"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(frontendRoot, "features", "accounts", "dialogs"), (file) => /\.(ts|tsx)$/.test(file)),
    ...walkFiles(join(frontendRoot, "features", "accounts", "components"), (file) => /\.(ts|tsx)$/.test(file)),
  ];
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const serviceText = readUtf8(servicePath);
  const featureTypesText = readRequiredUtf8(featureTypesPath, "accounts feature types owner");
  const featureCacheText = readRequiredUtf8(featureCachePath, "accounts feature cache owner");
  const featureHooksText = readRequiredUtf8(featureHooksPath, "accounts hooks barrel");
  const featureQueryHookText = readRequiredUtf8(featureQueryHookPath, "accounts query hook owner");
  const featureMutationHookText = readRequiredUtf8(featureMutationHookPath, "accounts mutation hook owner");
  const featureActionHookText = readRequiredUtf8(featureActionHookPath, "accounts action hook owner");
  const featurePageHookText = readRequiredUtf8(featurePageHookPath, "accounts page hook owner");
  const featureControllerConsumerText = featureControllerConsumerPaths
    .map((file) => readRequiredUtf8(file, "accounts controller consumer"))
    .join("\n");

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
    "export interface AccountsPageQueries",
    "export interface AccountsPageMutations",
    "export interface AccountsPathActions",
    "export interface AccountsModuleController",
    "export interface AccountsPageController",
  ], "accounts 前端模块 typed cache payload");

  assertContains(featureHooksPath, featureHooksText, [
    'from "./query"',
    'from "./mutation"',
    'from "./action"',
    'from "./page"',
  ], "accounts hooks barrel owner");

  assertContains(featureQueryHookPath, featureQueryHookText, [
    "AccountsSnapshotEnvelope",
    "useAccountsCacheController",
    "useAccountsPageQueries",
    "accountsService.loadSnapshot(true)",
    "writeAccountsSnapshotPayload",
  ], "accounts query hooks typed authoritative envelope");

  assertContains(featureMutationHookPath, featureMutationHookText, [
    "AccountsMutationEnvelope",
    "useAccountsPageMutations",
    "accountsService.beginAddAccountAttachMonitor",
    "accountsService.refreshUsageSnapshot",
    "accountsService.switchAccount",
    "accountsService.switchAccountAndRestartCodex",
    "accountsService.removeAccounts",
    "accountsService.logout",
    "accountsService.importChatGptSessionAccount",
    "accountsService.exportAccountsToFile",
    "accountsService.previewAccountImport",
    "accountsService.importAccountsFromFile",
    "writeAccountsMutationPayload",
    "writeAccountsSnapshotPayload",
    "invalidateAccountsDumpedQueries",
  ], "accounts mutation hooks typed authoritative envelope");

  assertContains(featureActionHookPath, featureActionHookText, [
    "useAccountsPathActions",
    "accountsService.openPath",
  ], "accounts action hook owner");

  assertContains(featurePageHookPath, featurePageHookText, [
    "AccountsPageController",
    "useAccountsPageQueries",
    "useAccountsPageMutations",
    "useAccountsPathActions",
    "readArray<AccountRecord>",
  ], "accounts page controller owner");

  assertContains(featureCachePath, featureCacheText, [
    "createModuleCacheOwner<AccountsCachePayload>(\"accounts\")",
    "writeAccountsSnapshotPayload",
    "writeAccountsMutationPayload",
    "invalidateAccountsDumpedQueries",
    "setQueryData<ModuleCacheEnvelope<AccountsCachePayload>>",
    "mutationFenceAt",
    "isStaleEnvelope",
  ], "accounts cache typed authoritative envelope");

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

  assertNotContainsSnippet(featureHooksPath, featureHooksText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "writeAccountsSnapshotPayload",
    "writeAccountsMutationPayload",
    "accountsService.",
    "invokeIpc",
  ], "accounts hooks/index must stay split barrel");

  assertNotContainsSnippet(featureTypesPath, featureTypesText, [
    "AccountsCacheEnvelope<TPayload = unknown>",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "ReturnType<typeof useAccountsPageController>",
    "ReturnType<typeof useAccountsModule>",
  ], "accounts feature types must keep explicit typed payloads and controller contracts");

  assertNotContainsSnippet(featureCachePath, featureCacheText, [
    "createModuleCacheOwner(\"accounts\")",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "accountsService.",
    "systemService.",
    "maintenanceService.",
    "invokeIpc",
  ], "accounts cache must keep typed authoritative payloads and avoid service access");

  assertNotContainsSnippet(featureQueryHookPath, featureQueryHookText, [
    "useMutation",
    "writeAccountsMutationPayload",
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
    "invokeIpc",
  ], "accounts query hook must not mix mutation or generic payloads");

  assertNotContainsSnippet(featureMutationHookPath, featureMutationHookText, [
    "useQuery(",
    "setQueryData",
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
    "useMutation<unknown",
    "invokeIpc",
  ], "accounts mutation hook must not mix query, direct cache writes, or generic payloads");

  assertNotContainsSnippet(featureActionHookPath, featureActionHookText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "setQueryData",
    "invalidateQueries",
    "cancelQueries",
    "writeAccounts",
    "invokeIpc",
  ], "accounts action hook must only bridge path action to service facade");

  assertNotContainsSnippet(featurePageHookPath, featurePageHookText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "accountsService.",
    "systemService.",
    "maintenanceService.",
    "setQueryData",
    "invalidateQueries",
    "cancelQueries",
    "AccountsAuthoritativeQueryKeys",
    "AccountsDumpedQueryKeys",
    "writeAccounts",
    "invokeIpc",
  ], "accounts page controller must not own TanStack, cache keys, or service/API access");

  for (const forbidden of [
    "ReturnType<typeof useAccountsPageController>",
    "ReturnType<typeof useAccountsModule>",
  ]) {
    if (featureControllerConsumerText.includes(forbidden)) {
      failures.push(
        `src/features/accounts panels/dialogs/components 违反 accounts view owners must consume explicit controller types：${forbidden}`,
      );
    }
  }
}

validateAccountsTypedPayloadContracts();

function validateSessionsTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "sessions.rs");
  const analyticsCommandPath = join(backendRoot, "commands", "analytics.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "sessions.rs");
  const analyticsUsecasePath = join(backendRoot, "application", "usecase", "analytics.rs");
  const repositoryPath = join(backendRoot, "repository", "sessions.rs");
  const contractPath = join(backendRoot, "contracts", "sessions.rs");
  const analyticsContractPath = join(backendRoot, "contracts", "analytics.rs");
  const servicePath = join(frontendRoot, "services", "sessions", "index.ts");
  const analyticsServicePath = join(frontendRoot, "services", "analytics", "index.ts");
  const featureTypesPath = join(frontendRoot, "features", "sessions", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "sessions", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "sessions", "hooks", "index.ts");
  const featureQueryHookPath = join(frontendRoot, "features", "sessions", "hooks", "query.ts");
  const featureMutationHookPath = join(frontendRoot, "features", "sessions", "hooks", "mutation.ts");
  const featurePageHookPath = join(frontendRoot, "features", "sessions", "hooks", "page.ts");
  const commandText = readUtf8(commandPath);
  const analyticsCommandText = readUtf8(analyticsCommandPath);
  const usecaseText = readUtf8(usecasePath);
  const analyticsUsecaseText = readUtf8(analyticsUsecasePath);
  const repositoryText = readUtf8(repositoryPath);
  const contractText = readUtf8(contractPath);
  const analyticsContractText = readUtf8(analyticsContractPath);
  const serviceText = readUtf8(servicePath);
  const analyticsServiceText = readUtf8(analyticsServicePath);
  const featureTypesText = readRequiredUtf8(featureTypesPath, "sessions feature types owner");
  const featureCacheText = readRequiredUtf8(featureCachePath, "sessions feature cache owner");
  const featureHooksText = readRequiredUtf8(featureHooksPath, "sessions hooks barrel");
  const featureQueryHookText = readRequiredUtf8(featureQueryHookPath, "sessions query hook owner");
  const featureMutationHookText = readRequiredUtf8(featureMutationHookPath, "sessions mutation hook owner");
  const featurePageHookText = readRequiredUtf8(featurePageHookPath, "sessions page hook owner");

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

  assertContains(repositoryPath, repositoryText, [
    "list_sessions",
    "self.fs.exists",
    "self.fs.read_to_string",
    "RepositoryPath::SessionsSource",
    "SessionRecordPayload",
    "serde_json",
  ], "sessions repository readonly list owner");

  assertNotContains(repositoryPath, repositoryText, [
    /\bstd::fs\b/,
    /\btokio::fs\b/,
    /\bread_dir\b/,
  ], "sessions repository must use repository filesystem adapter");

  const loadSessionsBody = extractFunctionBody(usecaseText, "load_sessions");
  if (!loadSessionsBody) {
    failures.push(`${toRelative(usecasePath)} missing sessions load_sessions function body`);
  } else {
    assertContains(usecasePath, loadSessionsBody, [
      "list_sessions",
      "items",
      "total",
      "last_scan_at",
    ], "sessions load_sessions repository readonly payload");

    assertNotContainsSnippet(usecasePath, loadSessionsBody, [
      "items: Vec::new()",
      "total: 0",
      "last_scan_at: 0",
    ], "sessions load_sessions must not return empty readonly skeleton");
  }

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
    "export type SessionsMutationEnvelope",
    "export type SessionsCachePayload",
    "export interface SessionsPageQueries",
    "export interface SessionsPageMutations",
    "export interface SessionsModuleController",
    "export interface SessionsPageController",
  ], "sessions 前端模块 typed cache payload");

  assertContains(featureHooksPath, featureHooksText, [
    'from "./query"',
    'from "./mutation"',
    'from "./page"',
  ], "sessions hooks split barrel owner");

  assertContains(featureQueryHookPath, featureQueryHookText, [
    "SessionsCacheEnvelope",
    "useSessionsCacheController",
    "useSessionsPageQueries",
    "SessionsAuthoritativeQueryKeys",
    "SessionsDumpedQueryKeys",
    "AnalyticsAuthoritativeQueryKeys",
    "AnalyticsDumpedQueryKeys",
    "sessionsService.loadSessions",
    "analyticsService.loadUsageAnalytics",
    "writeSessionsListPayload",
    "writeAnalyticsPanelPayload",
  ], "sessions query hook typed authoritative envelope");

  assertContains(featureMutationHookPath, featureMutationHookText, [
    "SessionsDeleteEnvelope",
    "useSessionsPageMutations",
    "sessionsService.deleteSessions",
    "writeSessionsMutationPayload",
    "fenceAnalyticsPanelPayload",
    "invalidateSessionsDumpedQueries",
  ], "sessions mutation hook typed authoritative envelope");

  if (!/refreshPromiseRef|singleFlight|refreshPromise/.test(featureMutationHookText)) {
    failures.push("src/features/sessions/hooks/mutation.ts missing sessions single-flight refresh owner");
  }

  assertContains(featurePageHookPath, featurePageHookText, [
    "useSessionsModule",
    "SessionsModuleController",
    "useSessionsPageController",
    "SessionsPageController",
    "useSessionsPageQueries",
    "useSessionsPageMutations",
    "buildSessionGroups",
    "selectDeletedSessionIds",
  ], "sessions page controller split owner");

  assertContains(featureCachePath, featureCacheText, [
    "createModuleCacheOwner<SessionsCachePayload>(\"sessions\")",
    "writeSessionsListPayload",
    "writeSessionsMutationPayload",
    "invalidateSessionsDumpedQueries",
    "setQueryData<ModuleCacheEnvelope<SessionsCachePayload>>",
    "mutationFenceAt",
    "isStaleEnvelope",
  ], "sessions frontend split cache payload owner");

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

  assertNotContainsSnippet(featureHooksPath, featureHooksText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "writeSessionsListPayload",
    "writeSessionsMutationPayload",
    "sessionsService.",
    "analyticsService.",
    "invokeIpc",
  ], "sessions hooks/index must stay split barrel");

  assertNotContainsSnippet(featureTypesPath, featureTypesText, [
    "SessionsCacheEnvelope<TPayload = unknown>",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "ReturnType<typeof useSessionsPageController>",
    "ReturnType<typeof useSessionsModule>",
  ], "sessions feature types must keep explicit typed payloads and controller contracts");

  assertNotContainsSnippet(featureCachePath, featureCacheText, [
    "createModuleCacheOwner(\"sessions\")",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "sessionsService.",
    "analyticsService.",
    "invokeIpc",
  ], "sessions cache must keep typed authoritative payloads and avoid service access");

  assertNotContainsSnippet(featureQueryHookPath, featureQueryHookText, [
    "useMutation",
    "writeSessionsMutationPayload",
    "fenceAnalyticsPanelPayload",
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
    "CoreEnvelope<unknown>",
    "invokeIpc",
  ], "sessions query hook must not mix mutation or generic payloads");

  assertNotContainsSnippet(featureMutationHookPath, featureMutationHookText, [
    "useQuery(",
    "setQueryData",
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
    "CoreEnvelope<unknown>",
    "useMutation<unknown",
    "invokeIpc",
  ], "sessions mutation hook must not mix query, direct cache writes, or generic payloads");

  assertNotContainsSnippet(featurePageHookPath, featurePageHookText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "sessionsService.",
    "analyticsService.",
    "setQueryData",
    "invalidateQueries",
    "cancelQueries",
    "SessionsAuthoritativeQueryKeys",
    "SessionsDumpedQueryKeys",
    "AnalyticsAuthoritativeQueryKeys",
    "AnalyticsDumpedQueryKeys",
    "writeSessions",
    "writeAnalytics",
    "invokeIpc",
  ], "sessions page controller must not own TanStack, cache keys, or service/API access");
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
  const featureHooksIndexPath = join(frontendRoot, "features", "analytics", "hooks", "index.ts");
  const featureQueryHookPath = join(frontendRoot, "features", "analytics", "hooks", "query.ts");
  const featurePageHookPath = join(frontendRoot, "features", "analytics", "hooks", "page.ts");
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const systemContractText = readUtf8(systemContractPath);
  const serviceText = readUtf8(servicePath);
  const featureTypesText = readUtf8(featureTypesPath);
  const featureCacheText = readUtf8(featureCachePath);
  const featureHooksIndexText = readRequiredUtf8(featureHooksIndexPath, "analytics hooks index owner");
  const featureQueryHookText = readRequiredUtf8(featureQueryHookPath, "analytics query hook owner");
  const featurePageHookText = readRequiredUtf8(featurePageHookPath, "analytics page hook owner");

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

  const hooksIndexReExportPattern =
    /export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+["']([^"']+)["'];?/g;
  const hooksIndexReExports = [...featureHooksIndexText.matchAll(hooksIndexReExportPattern)].map(
    (match) => match[1],
  );
  const hooksIndexOnlyReExports =
    featureHooksIndexText
      .replace(hooksIndexReExportPattern, "")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .trim() === "" &&
    ["query", "page"].every(
      (owner) =>
        featureHooksIndexText.includes(`from "./${owner}"`) ||
        featureHooksIndexText.includes(`from './${owner}'`),
    ) &&
    hooksIndexReExports.every((reExport) =>
      new Set(["./query", "./page"]).has(reExport),
    );
  if (!hooksIndexOnlyReExports) {
    failures.push("src/features/analytics/hooks/index.ts must only re-export ./query and ./page split owners");
  }

  assertContains(featureQueryHookPath, featureQueryHookText, [
    "AnalyticsCacheEnvelope<AnalyticsUsageEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsSessionEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsTokenEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsToolEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsChangeEnvelope>",
    "AnalyticsCacheEnvelope<AnalyticsQuotaEnvelope>",
    "useAnalyticsModule",
    "writeAnalyticsPanelPayload",
  ], "analytics query hooks typed authoritative envelope");

  assertContains(featurePageHookPath, featurePageHookText, [
    "useAnalyticsPageController",
    "AnalyticsPageController",
    "useAnalyticsModule",
    "PANELS",
    "ANALYTICS_RANGES",
    "ACTIVITY_RANGES",
    "buildActivityPanel",
    "buildSessionsPanel",
    "buildTokenPanel",
    "buildToolsPanel",
    "buildChangesPanel",
    "buildQuotaPanel",
  ], "analytics page controller split owner");

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
  assertNotContainsSnippet(featureQueryHookPath, featureQueryHookText, [
    "payload: unknown",
    "ModuleCacheEnvelope<unknown>",
    "IpcEvidencePayload",
  ], "analytics query hooks must keep typed authoritative payloads");

  assertNotContainsSnippet(featurePageHookPath, featurePageHookText, [
    "useQuery",
    "useQueryClient",
    "analyticsService.",
    "invokeIpc",
    "invoke(",
    "AnalyticsDumpedQueryKeys",
    "AnalyticsAuthoritativeQueryKeys",
    "writeAnalyticsPanelPayload",
    "setQueryData",
    "invalidateQueries",
  ], "analytics page controller must not own TanStack, service/API/IPC, query keys, or cache writes");
}

validateAnalyticsTypedPayloadContracts();

function validateRelayTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "relay.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "relay.rs");
  const contractPath = join(backendRoot, "contracts", "relay.rs");
  const servicePath = join(frontendRoot, "services", "relay", "index.ts");
  const hooksIndexPath = join(frontendRoot, "features", "relay", "hooks", "index.ts");
  const queryPath = join(frontendRoot, "features", "relay", "hooks", "query.ts");
  const mutationPath = join(frontendRoot, "features", "relay", "hooks", "mutation.ts");
  const runtimePath = join(frontendRoot, "features", "relay", "hooks", "runtime.ts");
  const pagePath = join(frontendRoot, "features", "relay", "hooks", "page.ts");
  const cachePath = join(frontendRoot, "features", "relay", "cache", "index.ts");
  const typesPath = join(frontendRoot, "features", "relay", "types", "index.ts");
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const contractText = readUtf8(contractPath);
  const serviceText = readUtf8(servicePath);
  const hooksIndexText = readRequiredUtf8(hooksIndexPath, "relay split hooks barrel");
  const queryText = readRequiredUtf8(queryPath, "relay query owner");
  const mutationText = readRequiredUtf8(mutationPath, "relay mutation owner");
  const runtimeText = readRequiredUtf8(runtimePath, "relay runtime owner");
  const pageText = readRequiredUtf8(pagePath, "relay page controller owner");
  const cacheText = readRequiredUtf8(cachePath, "relay cache owner");
  const typesText = readRequiredUtf8(typesPath, "relay types owner");

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

  assertContains(hooksIndexPath, hooksIndexText, [
    "from \"./query\"",
    "from \"./mutation\"",
    "from \"./runtime\"",
    "from \"./page\"",
  ], "relay split hooks barrel");

  assertContains(typesPath, typesText, [
    "export type RelayQueryDataPayload",
    "export type RelayMutationDataPayload",
    "export type RelayCachePayload",
    "export type RelayCacheDataPayload",
    "export type RelayKnownQueryPayload",
    "export interface RelayPageController",
  ], "relay frontend split typed payload contracts");

  assertContains(cachePath, cacheText, [
    "createModuleCacheOwner<RelayCachePayload>(\"relay\")",
    "Omit<RelayCacheEnvelope<TPayload>, \"moduleId\">",
    "writeRelayQueryPayload",
    "writeRelayMutationPayload",
    "writeRelayStateQueryPayload",
    "writeRelayRouterToggleQueryPayload",
    "invalidateRelayContractQueries",
    "nextRelayCacheSequence",
  ], "relay frontend split cache payload owner");

  assertContains(queryPath, queryText, [
    "TPayload extends RelayCachePayload",
    "relayActiveStateQueryKey",
    "relayService.loadState",
    "relayService.getActive",
    "relayService.getProxyStatus",
    "relayService.getPassthroughAuditLog",
    "runRelayQuery",
  ], "relay frontend split query typed payload owner");

  assertContains(mutationPath, mutationText, [
    "CoreEnvelope<TPayload>",
    "TPayload extends RelayMutationDataPayload",
    "writeRelayMutationPayload",
    "queryClient",
    "invalidateRelayContractQueries(queryClient)",
    "cancelQueries",
    "relayService.setCodexRouterEnabled",
    "useRelayVoidMutation",
  ], "relay frontend split mutation typed payload owner");

  assertContains(runtimePath, runtimeText, [
    "useRelayRuntimeEvents",
    "relayService.subscribeRouterToggleProgress",
    "return relayService.subscribeRouterToggleProgress",
    "parseRelayRouterToggleProgress",
    "writeRelayRouterToggleProgress",
  ], "relay frontend split runtime event owner");

  assertContains(pagePath, pageText, [
    "useRelayPageController",
    "useRelayPageQueries",
    "useRelayPageMutations",
    "useRelayRuntimeEvents",
    "RelayPageController",
    "formatExtraHeaders(extraHeaders: RelayExtraHeaders | undefined)",
  ], "relay frontend split page controller owner");

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
  assertNotContainsSnippet(hooksIndexPath, hooksIndexText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "setQueryData",
    "invalidateQueries",
    "cancelQueries",
    "relayService.",
    "invokeIpc",
  ], "relay hooks/index must stay split barrel");
  assertNotContainsSnippet(typesPath, typesText, [
    "RelayCacheEnvelope<TPayload = unknown>",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "ReturnType<typeof useRelayPageController>",
  ], "relay frontend split types must not loosen typed payloads");
  assertNotContainsSnippet(cachePath, cacheText, [
    "createModuleCacheOwner(\"relay\")",
    "ModuleCacheEnvelope<unknown>",
    "payload: unknown",
    "relayService.",
    "invokeIpc",
  ], "relay frontend cache owner must not loosen typed payloads or call services");
  assertNotContainsSnippet(queryPath, queryText, [
    "useMutation",
    "payload: unknown",
    "setQueryData<unknown>",
    "invalidateQueries",
    "invokeIpc",
  ], "relay frontend query owner must not mix mutation or generic payloads");
  assertNotContainsSnippet(mutationPath, mutationText, [
    "useQuery(",
    "payload: unknown",
    "useMutation<unknown",
    "Promise<unknown>",
    "setQueryData",
    "invokeIpc",
  ], "relay frontend mutation owner must not mix query or direct cache writes");
  assertNotContainsSnippet(runtimePath, runtimeText, [
    "useQuery(",
    "useMutation",
    "useState",
    "setQueryData(",
    "relayService.loadState",
    "relayService.getActive",
    "relayService.getProxyStatus",
    "relayService.getPassthroughAuditLog",
    "relayService.upsert",
    "relayService.delete",
    "relayService.activate",
    "relayService.deactivate",
    "relayService.setCodexRouterEnabled",
    "invokeIpc",
  ], "relay frontend runtime owner must only bridge event facade to cache helper");
  assertNotContainsSnippet(pagePath, pageText, [
    "useQuery",
    "useMutation",
    "useQueryClient",
    "relayService.",
    "systemService.",
    "setQueryData",
    "invalidateQueries",
    "cancelQueries",
    "RELAY_STATE_QUERY_KEY",
    "RELAY_ROUTER_TOGGLE_PROGRESS_QUERY_KEY",
    "invokeIpc",
  ], "relay page controller must not own TanStack, cache keys, or service/API access");
}

validateRelayTypedPayloadContracts();

function validateRuntimeExtensionsTypedPayloadContracts() {
  const commandPath = join(backendRoot, "commands", "runtime_extensions.rs");
  const usecasePath = join(backendRoot, "application", "usecase", "runtime_extensions.rs");
  const repositoryPath = join(backendRoot, "repository", "runtime_extensions.rs");
  const contractPath = join(backendRoot, "contracts", "runtime_extensions.rs");
  const servicePath = join(frontendRoot, "services", "runtime-extensions", "index.ts");
  const pluginsServicePath = join(frontendRoot, "services", "plugins", "index.ts");
  const featureTypesPath = join(frontendRoot, "features", "plugins", "types", "index.ts");
  const featureCachePath = join(frontendRoot, "features", "plugins", "cache", "index.ts");
  const featureHooksPath = join(frontendRoot, "features", "plugins", "hooks", "index.ts");
  const featureQueryHookPath = join(frontendRoot, "features", "plugins", "hooks", "query.ts");
  const featureRefreshHookPath = join(frontendRoot, "features", "plugins", "hooks", "refresh.ts");
  const featureMutationHookPath = join(frontendRoot, "features", "plugins", "hooks", "mutation.ts");
  const featurePageHookPath = join(frontendRoot, "features", "plugins", "hooks", "page.ts");
  const commandText = readUtf8(commandPath);
  const usecaseText = readUtf8(usecasePath);
  const repositoryText = readUtf8(repositoryPath);
  const contractText = readUtf8(contractPath);
  const serviceText = readUtf8(servicePath);
  const pluginsServiceText = readUtf8(pluginsServicePath);
  const featureTypesText = readUtf8(featureTypesPath);
  const featureCacheText = readUtf8(featureCachePath);
  const featureHooksText = readUtf8(featureHooksPath);
  const featureQueryHookText = readUtf8(featureQueryHookPath);
  const featureRefreshHookText = readUtf8(featureRefreshHookPath);
  const featureMutationHookText = readUtf8(featureMutationHookPath);
  const featurePageHookText = readUtf8(featurePageHookPath);

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
    "id: Option<String>",
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
    "id: Option<String>",
    "fn required_text(",
    "value: Option<String>",
    "None => Err(CoreError::domain(code, public_message))",
    "value.trim().to_owned()",
    "value.is_empty()",
    "CoreError::domain(code, public_message)",
    "运行时扩展标识不能为空。",
  ], "runtime-extensions usecase typed 骨架");

  assertContains(repositoryPath, repositoryText, [
    "list_plugins",
    "self.fs.exists",
    "self.fs.read_to_string",
    "RepositoryPath::RuntimeExtensionsSource",
    "RuntimeExtensionPluginPayload",
    "serde_json",
  ], "runtime-extensions repository readonly list owner");

  assertNotContains(repositoryPath, repositoryText, [
    /\bstd::fs\b/,
    /\btokio::fs\b/,
    /\bread_dir\b/,
  ], "runtime-extensions repository must use repository filesystem adapter");

  const listPluginsBody = extractFunctionBody(usecaseText, "list_plugins");
  if (!listPluginsBody) {
    failures.push(`${toRelative(usecasePath)} missing runtime-extensions list_plugins function body`);
  } else {
    assertContains(usecasePath, listPluginsBody, [
      "list_plugins",
      "items",
      "list_payload",
    ], "runtime-extensions list_plugins repository readonly call chain");
  }

  const listPayloadBody = extractFunctionBody(usecaseText, "list_payload");
  const listPayloadSignatureMatch = /fn\s+list_payload\s*\([\s\S]*?\)\s*->/.exec(usecaseText);
  const listPayloadContractText = `${listPayloadSignatureMatch?.[0] ?? ""}\n${listPayloadBody}`;
  if (!listPayloadBody) {
    failures.push(`${toRelative(usecasePath)} missing runtime-extensions list_payload function body`);
  } else {
    assertContains(usecasePath, listPayloadContractText, [
      "items: Vec<RuntimeExtensionPluginPayload>",
      "let total = items.len()",
      "items",
      "total",
      "last_scan_at",
    ], "runtime-extensions list_payload readonly payload");
  }

  assertNotContainsSnippet(usecasePath, `${listPluginsBody}\n${listPayloadBody}`, [
    "items: Vec::new()",
    "total: 0",
    "last_scan_at: 0",
  ], "runtime-extensions list_plugins must not return empty readonly skeleton");

  for (const functionName of ["toggle_plugin", "get_plugin_config", "update_plugin_config"]) {
    const commandBody = extractFunctionBody(commandText, functionName);
    const commandSignature = new RegExp(
      `fn\\s+${functionName}\\s*\\([\\s\\S]*?\\bid\\s*:\\s*Option\\s*<\\s*String\\s*>[\\s\\S]*?\\)\\s*->`,
    );
    const usecaseSignature = new RegExp(
      `fn\\s+${functionName}\\s*\\([\\s\\S]*?\\bid\\s*:\\s*Option\\s*<\\s*String\\s*>[\\s\\S]*?\\)\\s*->`,
    );

    assertMatches(commandPath, commandText, [
      commandSignature,
    ], `runtime-extensions ${functionName} command id 必须是 Option<String>`);
    assertMatches(usecasePath, usecaseText, [
      usecaseSignature,
    ], `runtime-extensions ${functionName} usecase id 必须是 Option<String>`);
    assertNotContainsSnippet(commandPath, commandBody, [
      "unwrap_or_default()",
      "id.unwrap_or(",
      "id.unwrap_or_else(",
      "id.unwrap_or_default()",
      "id.map_or(",
      "id.map_or_else(",
    ], `runtime-extensions ${functionName} command 不得补默认业务值`);
  }

  const requiredTextBody = extractFunctionBody(usecaseText, "required_text");
  assertMatches(usecasePath, usecaseText, [
    /fn\s+required_text\s*\(\s*value\s*:\s*Option\s*<\s*String\s*>/,
  ], "runtime-extensions required_text 签名必须接收 Option<String>");
  assertContains(usecasePath, requiredTextBody, [
    "Some(value)",
    "value.trim().to_owned()",
    "value.is_empty()",
    "CoreError::domain(code, public_message)",
    "None => Err(CoreError::domain(code, public_message))",
  ], "runtime-extensions required_text 必须处理 None、trim、空字符串和 domain error");

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
    'from "./query"',
    'from "./refresh"',
    'from "./mutation"',
    'from "./page"',
  ], "plugins hooks barrel owner");

  assertNotContainsSnippet(featureHooksPath, featureHooksText, [
    "useQuery",
    "useMutation",
    "writePluginsAuthoritativePayload",
    "writePluginsMutationPayload",
    "pluginsService.",
  ], "plugins hooks/index 不得继续承载 typed payload 或 service 逻辑");

  assertContains(featureQueryHookPath, featureQueryHookText, [
    "PluginsListEnvelope",
    "pluginsService.list",
    "writePluginsListQueryPayload",
  ], "plugins query hooks typed authoritative envelope");

  assertContains(featureRefreshHookPath, featureRefreshHookText, [
    "PluginsListEnvelope",
    "pluginsService.list",
    "nextPluginsCacheSequence",
    "writePluginsRefreshPayload",
  ], "plugins refresh hooks typed authoritative envelope");

  assertContains(featureMutationHookPath, featureMutationHookText, [
    "PluginsToggleEnvelope",
    "pluginsService.toggle",
    "optimisticallyUpdatePluginsToggle",
    "rollbackPluginsToggle",
    "writePluginsMutationPayload",
  ], "plugins mutation hooks typed authoritative envelope");

  assertContains(featurePageHookPath, featurePageHookText, [
    "PluginsPageController",
    "usePluginsListQuery",
    "usePluginsRefreshMutation",
    "usePluginsToggleMutation",
  ], "plugins page controller typed envelope");

  assertContains(featureCachePath, featureCacheText, [
    "writePluginsAuthoritativePayload",
    "toPluginsListEnvelope",
    "writePluginsListQueryPayload",
    "writePluginsRefreshPayload",
    "writePluginsMutationPayload",
    "optimisticallyUpdatePluginsToggle",
    "rollbackPluginsToggle",
  ], "plugins cache typed authoritative envelope");

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
