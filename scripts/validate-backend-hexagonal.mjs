import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";

const repoRoot = process.cwd();
const backendRoot = join(repoRoot, "src-tauri", "src");
const failures = [];

const requiredDirectories = [
  "commands",
  "application",
  "application/usecase",
  "core",
  "core/dto",
  "core/model",
  "core/parser",
  "core/migration",
  "core/state_machine",
  "platform",
  "repository",
  "repository/adapter",
  "contracts",
  "adapters",
  "adapters/tauri",
];

const requiredFiles = [
  "commands/mod.rs",
  "application/mod.rs",
  "application/service.rs",
  "application/ports.rs",
  "application/usecase/mod.rs",
  "core/mod.rs",
  "core/error.rs",
  "core/dto/mod.rs",
  "core/model/mod.rs",
  "core/parser/mod.rs",
  "core/migration/mod.rs",
  "core/state_machine/mod.rs",
  "platform/mod.rs",
  "repository/mod.rs",
  "repository/adapter/mod.rs",
  "contracts/mod.rs",
  "contracts/envelope.rs",
  "adapters/mod.rs",
  "adapters/tauri/mod.rs",
  "adapters/tauri/state.rs",
];

const voiceBoundaryFiles = [
  "commands/voice.rs",
  "application/usecase/voice.rs",
  "contracts/voice.rs",
  "repository/voice.rs",
];

const ipcCommandContractFile = join(repoRoot, "src", "contracts", "ipc", "commands.ts");
const tauriLibFile = join(backendRoot, "lib.rs");

const ipcDomainModuleMap = new Map([
  ["accounts", "accounts"],
  ["analytics", "analytics"],
  ["custom-instructions", "custom_instructions"],
  ["daemon-autoswitch", "system"],
  ["maintenance", "system"],
  ["mcp", "mcp"],
  ["relay", "relay"],
  ["runtime-extensions", "runtime_extensions"],
  ["sessions", "sessions"],
  ["settings", "system"],
  ["skills", "skills"],
  ["system", "system"],
]);

const ipcCommandModuleOverrides = new Map([["load_session_analytics", "sessions"]]);

// 当前没有无 TS 合同的系统命令；迁移期如需豁免必须显式加入这里。
const allowedExistingSystemCommands = new Set([]);

const forbiddenSideEffectRules = [
  {
    label: "std::fs",
    patterns: [/\bstd::fs\b/g, /\bstd\s*::\s*\{\s*fs\b/g],
    reason: "禁止直接使用真实文件系统",
    allowedOwners: [
      /^src-tauri\/src\/repository\/adapter\/real_fs\.rs$/,
      /^src-tauri\/src\/repository\/paths\.rs$/,
    ],
  },
  {
    label: "tokio::fs",
    patterns: [/\btokio::fs\b/g, /\btokio\s*::\s*\{\s*fs\b/g],
    reason: "禁止直接使用异步真实文件系统",
    allowedOwners: [/^src-tauri\/src\/repository\/adapter\/real_fs\.rs$/],
  },
  {
    label: "read_to_string",
    patterns: [/\bstd\s*::\s*fs\s*::\s*read_to_string\s*\(/g],
    reason: "禁止在骨架期读取真实文件内容",
    allowedOwners: [/^src-tauri\/src\/repository\/adapter\/real_fs\.rs$/],
  },
  {
    label: "write_to_string",
    patterns: [/\bstd\s*::\s*fs\s*::\s*write\s*\(/g],
    reason: "禁止在骨架期写入真实文件内容",
    allowedOwners: [/^src-tauri\/src\/repository\/adapter\/real_fs\.rs$/],
  },
  {
    label: "std::process::Command::new",
    patterns: [/\bstd\s*::\s*process\s*::\s*Command\s*::\s*new\s*\(/g, /\bCommand\s*::\s*new\s*\(/g],
    reason: "禁止启动真实外部进程",
    allowedOwners: [/^src-tauri\/src\/platform\//],
  },
  {
    label: "reqwest",
    patterns: [/\breqwest\b/g],
    reason: "禁止发起真实 HTTP 能力",
    allowedOwners: [/^src-tauri\/src\/platform\//, /^src-tauri\/src\/repository\/adapter\//],
  },
  {
    label: "Tauri window 操作",
    patterns: [
      /\btauri\s*::\s*(Window|WebviewWindow|WindowBuilder|WebviewWindowBuilder)\b/g,
      /\b(WindowBuilder|WebviewWindowBuilder)\s*::\s*new\s*\(/g,
      /\.(get_window|get_webview_window|create_window|emit|emit_all)\s*\(/g,
    ],
    reason: "禁止执行真实 Tauri 窗口操作",
    allowedOwners: [/^src-tauri\/src\/platform\/window\.rs$/],
  },
  {
    label: "Tauri tray 操作",
    patterns: [
      /\b(TrayIconBuilder|SystemTray|SystemTrayMenu|SystemTrayEvent)\b/g,
      /\.(tray_handle|set_icon|set_menu|set_tooltip|set_title)\s*\(/g,
    ],
    reason: "禁止执行真实 Tauri 托盘操作",
    allowedOwners: [/^src-tauri\/src\/platform\/tray\.rs$/],
  },
  {
    label: "Tauri process 操作",
    patterns: [
      /\btauri_plugin_process\b/g,
      /\btauri_plugin_shell\b/g,
      /\.\s*shell\s*\(\s*\)\s*\.\s*(command|sidecar)\s*\(/g,
      /\.\s*sidecar\s*\(/g,
    ],
    reason: "禁止执行真实 Tauri 进程操作",
    allowedOwners: [/^src-tauri\/src\/lib\.rs$/, /^src-tauri\/src\/platform\//],
  },
];

const tauriBoundaryScanRoots = ["application", "core"];

const forbiddenApplicationCoreBoundaryRules = [
  {
    label: "#[tauri::command]",
    patterns: [/#\s*\[\s*tauri\s*::\s*command\s*\]/g],
    reason: "application/core 不得注册 Tauri 命令",
  },
  {
    label: "tauri::",
    patterns: [/\btauri\s*::/g],
    reason: "application/core 不得依赖 Tauri 命名空间",
  },
  {
    label: "AppHandle",
    patterns: [/\bAppHandle\b/g],
    reason: "application/core 不得接收或持有 Tauri app handle",
  },
  {
    label: "Manager",
    patterns: [/\bManager\b/g],
    reason: "application/core 不得依赖 Tauri 管理 trait",
  },
  {
    label: "State<",
    patterns: [/\bState\s*</g],
    reason: "application/core 不得依赖 Tauri state 注入类型",
  },
  {
    label: "tauri_plugin_",
    patterns: [/\btauri_plugin_[A-Za-z0-9_]*\b/g],
    reason: "application/core 不得依赖 Tauri plugin 边界",
  },
];

const forbiddenVoiceRules = [
  { label: "#[tauri::command]", pattern: /#\s*\[\s*tauri::command\s*\]/g },
  { label: "respond(", pattern: /\brespond\s*\(/g },
  { label: "State<'_", pattern: /\bState\s*<\s*'_/g },
  { label: "state.services().voice", pattern: /\bstate\s*\.\s*services\s*\(\s*\)\s*\.\s*voice\b/g },
  { label: "serde_json", pattern: /\bserde_json\b/g },
  { label: "workspace_payload", pattern: /\bworkspace_payload\b/g },
  { label: "runtime_payload", pattern: /\bruntime_payload\b/g },
  { label: "llm_payload", pattern: /\bllm_payload\b/g },
  { label: "asr_payload", pattern: /\basr_payload\b/g },
  { label: "recording", pattern: /\brecording\b/gi },
  { label: "shortcut", pattern: /\bshortcut\b/gi },
];

function toRelative(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

function readUtf8(path) {
  return readFileSync(path, "utf8");
}

function assertExists(path, description) {
  if (!existsSync(path)) {
    failures.push(`缺少${description}：${toRelative(path)}`);
    return false;
  }

  return true;
}

function walkRustFiles(root) {
  if (!existsSync(root)) {
    return [];
  }

  const pending = [root];
  const files = [];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(next);
      } else if (entry.isFile() && entry.name.endsWith(".rs")) {
        files.push(next);
      }
    }
  }

  return files.sort();
}

function lineNumberAt(content, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (content[cursor] === "\n") {
      line += 1;
    }
  }

  return line;
}

function blankCommentRange(output, start, end) {
  for (let index = start; index < end; index += 1) {
    output[index] = output[index] === "\n" ? "\n" : " ";
  }
}

function rawStringEndMarker(content, start) {
  if (content[start] !== "r") {
    return null;
  }

  let cursor = start + 1;
  while (content[cursor] === "#") {
    cursor += 1;
  }

  if (content[cursor] !== "\"") {
    return null;
  }

  return {
    contentStart: cursor + 1,
    marker: `"${"#".repeat(cursor - start - 1)}`,
  };
}

// 只去掉 Rust 注释，避免纯注释中的历史痕迹误触发门禁。
function stripRustComments(content) {
  const output = content.split("");
  let cursor = 0;

  while (cursor < content.length) {
    const raw = rawStringEndMarker(content, cursor);
    if (raw) {
      const rawEnd = content.indexOf(raw.marker, raw.contentStart);
      cursor = rawEnd === -1 ? content.length : rawEnd + raw.marker.length;
      continue;
    }

    if (content[cursor] === "b" && content[cursor + 1] === "r") {
      const rawByte = rawStringEndMarker(content, cursor + 1);
      if (rawByte) {
        const rawByteEnd = content.indexOf(rawByte.marker, rawByte.contentStart);
        cursor = rawByteEnd === -1 ? content.length : rawByteEnd + rawByte.marker.length;
        continue;
      }
    }

    if (content[cursor] === "\"") {
      cursor += 1;
      while (cursor < content.length) {
        if (content[cursor] === "\\") {
          cursor += 2;
          continue;
        }
        if (content[cursor] === "\"") {
          cursor += 1;
          break;
        }
        cursor += 1;
      }
      continue;
    }

    if (content[cursor] === "/" && content[cursor + 1] === "/") {
      const start = cursor;
      cursor += 2;
      while (cursor < content.length && content[cursor] !== "\n") {
        cursor += 1;
      }
      blankCommentRange(output, start, cursor);
      continue;
    }

    if (content[cursor] === "/" && content[cursor + 1] === "*") {
      const start = cursor;
      cursor += 2;
      let depth = 1;
      while (cursor < content.length && depth > 0) {
        if (content[cursor] === "/" && content[cursor + 1] === "*") {
          depth += 1;
          cursor += 2;
        } else if (content[cursor] === "*" && content[cursor + 1] === "/") {
          depth -= 1;
          cursor += 2;
        } else {
          cursor += 1;
        }
      }
      blankCommentRange(output, start, cursor);
      continue;
    }

    cursor += 1;
  }

  return output.join("");
}

function findRuleMatches(content, pattern) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  const matches = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    matches.push(match.index);
    if (match[0].length === 0) {
      regex.lastIndex += 1;
    }
  }

  return matches;
}

function commandPathKey(module, command) {
  return `${module}::${command}`;
}

function readRequiredUtf8(path, description) {
  if (!assertExists(path, description)) {
    return "";
  }

  return readUtf8(path);
}

function parseIpcCommandDefinitions() {
  const content = readRequiredUtf8(ipcCommandContractFile, "IPC command TS 合同文件");
  if (content.length === 0) {
    return [];
  }

  const match = content.match(
    /export\s+const\s+IPC_COMMAND_DEFINITIONS\s*=\s*\[([\s\S]*?)\]\s+as\s+const\s*;/,
  );
  if (!match) {
    failures.push(`${toRelative(ipcCommandContractFile)} 缺少可解析的 IPC_COMMAND_DEFINITIONS 数组`);
    return [];
  }

  const definitions = [];
  const objectPattern = /\{[\s\S]*?\}/g;
  let definitionMatch;
  let index = 0;

  while ((definitionMatch = objectPattern.exec(match[1])) !== null) {
    index += 1;
    const definitionText = definitionMatch[0];
    const domainMatch = definitionText.match(/(?:["']?domain["']?)\s*:\s*["']([^"']+)["']/);
    const commandMatch = definitionText.match(/(?:["']?command["']?)\s*:\s*["']([^"']+)["']/);

    if (!domainMatch || !commandMatch) {
      failures.push(`${toRelative(ipcCommandContractFile)} IPC command 定义 #${index} 缺少 domain 或 command`);
      continue;
    }

    definitions.push({ domain: domainMatch[1], command: commandMatch[1] });
  }

  if (definitions.length === 0) {
    failures.push(`${toRelative(ipcCommandContractFile)} IPC_COMMAND_DEFINITIONS 未解析到任何 command 定义`);
  }

  return definitions;
}

function moduleForIpcCommand(definition) {
  return ipcCommandModuleOverrides.get(definition.command) ?? ipcDomainModuleMap.get(definition.domain);
}

function expectedIpcCommandPaths(definitions) {
  const expected = new Map();

  for (const definition of definitions) {
    if (definition.domain === "voice") {
      continue;
    }

    const module = moduleForIpcCommand(definition);
    if (!module) {
      failures.push(
        `${toRelative(ipcCommandContractFile)} 非 voice IPC command ${definition.domain}.${definition.command} 缺少 Rust owner 模块映射`,
      );
      continue;
    }

    const key = commandPathKey(module, definition.command);
    if (expected.has(key)) {
      failures.push(`${toRelative(ipcCommandContractFile)} 非 voice IPC command 重复映射到 commands::${key}`);
      continue;
    }

    expected.set(key, { ...definition, module });
  }

  return expected;
}

function extractGenerateHandlerBody(content) {
  const marker = /tauri\s*::\s*generate_handler!\s*\[/g;
  const match = marker.exec(content);
  if (!match) {
    failures.push(`${toRelative(tauriLibFile)} 缺少 tauri::generate_handler! 注册表`);
    return "";
  }

  const openBracket = content.indexOf("[", match.index);
  let depth = 0;
  for (let index = openBracket; index < content.length; index += 1) {
    if (content[index] === "[") {
      depth += 1;
    } else if (content[index] === "]") {
      depth -= 1;
      if (depth === 0) {
        return content.slice(openBracket + 1, index);
      }
    }
  }

  failures.push(`${toRelative(tauriLibFile)} tauri::generate_handler! 注册表缺少闭合方括号`);
  return "";
}

function parseGenerateHandlerEntries() {
  const original = readRequiredUtf8(tauriLibFile, "Tauri lib.rs 入口文件");
  if (original.length === 0) {
    return [];
  }

  const content = stripRustComments(original);
  const handlerBody = extractGenerateHandlerBody(content);
  if (handlerBody.length === 0) {
    return [];
  }

  if (/\bcommands\s*::\s*voice\s*::/g.test(handlerBody)) {
    failures.push(`${toRelative(tauriLibFile)} tauri::generate_handler! 不得注册 commands::voice::*`);
  }

  const entries = [];
  const seen = new Set();
  for (const rawEntry of handlerBody.split(",")) {
    const entry = rawEntry.trim();
    if (entry.length === 0) {
      continue;
    }

    const normalized = entry.replace(/\s+/g, "");
    const match = normalized.match(/^commands::([A-Za-z_][A-Za-z0-9_]*)::([A-Za-z_][A-Za-z0-9_]*)$/);
    if (!match) {
      failures.push(`${toRelative(tauriLibFile)} tauri::generate_handler! 含无法解析的注册项：${entry}`);
      continue;
    }

    const [, module, command] = match;
    const key = commandPathKey(module, command);
    if (seen.has(key)) {
      failures.push(`${toRelative(tauriLibFile)} tauri::generate_handler! 重复注册 commands::${key}`);
      continue;
    }

    seen.add(key);
    entries.push({ module, command, key });
  }

  return entries;
}

function collectTauriCommandFunctionsByModule() {
  const commandsRoot = join(backendRoot, "commands");
  const result = new Map();

  for (const file of walkRustFiles(commandsRoot)) {
    const fileName = basename(file);
    if (fileName === "mod.rs") {
      continue;
    }

    const module = fileName.replace(/\.rs$/, "");
    const original = readUtf8(file);
    const content = stripRustComments(original);
    const relativePath = toRelative(file);
    const attributes = [...content.matchAll(/#\s*\[\s*tauri\s*::\s*command\s*\]/g)];

    for (let index = 0; index < attributes.length; index += 1) {
      const attribute = attributes[index];
      const segmentStart = attribute.index + attribute[0].length;
      const segmentEnd = attributes[index + 1]?.index ?? content.length;
      const segment = content.slice(segmentStart, segmentEnd);
      const functionMatch = segment.match(/\bpub\s+fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);

      if (!functionMatch) {
        failures.push(
          `${relativePath}:${lineNumberAt(original, attribute.index)} #[tauri::command] 必须关联 pub fn <command>`,
        );
        continue;
      }

      const command = functionMatch[1];
      const line = lineNumberAt(original, segmentStart + functionMatch.index);
      let moduleCommands = result.get(module);
      if (!moduleCommands) {
        moduleCommands = new Map();
        result.set(module, moduleCommands);
      }

      if (moduleCommands.has(command)) {
        failures.push(`${relativePath}:${line} 重复暴露 Rust IPC command：${command}`);
      }

      moduleCommands.set(command, { file, line });
    }
  }

  return result;
}

function isAllowedExistingSystemCommand(module, command) {
  return module === "system" && allowedExistingSystemCommands.has(command);
}

function validateIpcCommandRegistration() {
  const definitions = parseIpcCommandDefinitions();
  const expectedPaths = expectedIpcCommandPaths(definitions);
  const registeredHandlers = parseGenerateHandlerEntries();
  const registeredPathSet = new Set(registeredHandlers.map((handler) => handler.key));
  const commandFunctionsByModule = collectTauriCommandFunctionsByModule();

  for (const expected of expectedPaths.values()) {
    const key = commandPathKey(expected.module, expected.command);
    if (!registeredPathSet.has(key)) {
      failures.push(
        `${toRelative(tauriLibFile)} 缺少非 voice TS IPC command 注册：${expected.domain}.${expected.command} 应为 commands::${key}`,
      );
    }
  }

  for (const handler of registeredHandlers) {
    const moduleCommands = commandFunctionsByModule.get(handler.module);
    if (!moduleCommands?.has(handler.command)) {
      failures.push(
        `${toRelative(tauriLibFile)} 注册了 commands::${handler.key}，但 src-tauri/src/commands/${handler.module}.rs 缺少 #[tauri::command] pub fn ${handler.command}`,
      );
    }

    if (!expectedPaths.has(handler.key) && !isAllowedExistingSystemCommand(handler.module, handler.command)) {
      failures.push(`${toRelative(tauriLibFile)} 注册了非 TS IPC 合同 command：commands::${handler.key}`);
    }
  }

  for (const [module, moduleCommands] of commandFunctionsByModule.entries()) {
    if (module === "voice") {
      continue;
    }

    for (const [command, location] of moduleCommands.entries()) {
      const key = commandPathKey(module, command);
      if (expectedPaths.has(key) || isAllowedExistingSystemCommand(module, command)) {
        continue;
      }

      failures.push(
        `${toRelative(location.file)}:${location.line} 额外暴露 Rust IPC command：#[tauri::command] pub fn ${command} 不在非 voice TS 合同或允许的现有系统命令中`,
      );
    }
  }
}

function validateRequiredSkeleton() {
  assertExists(backendRoot, "后端源码目录");

  for (const directory of requiredDirectories) {
    assertExists(join(backendRoot, directory), "后端六边形目录");
  }

  for (const file of requiredFiles) {
    assertExists(join(backendRoot, file), "后端六边形边界文件");
  }
}

function validateNoRealSideEffects() {
  const rustFiles = walkRustFiles(backendRoot);

  for (const file of rustFiles) {
    const original = readUtf8(file);
    const content = stripRustComments(original);
    const relativePath = toRelative(file);

    for (const rule of forbiddenSideEffectRules) {
      const allowedOwners = rule.allowedOwners ?? [];
      if (allowedOwners.some((owner) => owner.test(relativePath))) {
        continue;
      }

      const matchLines = [];
      for (const pattern of rule.patterns) {
        for (const index of findRuleMatches(content, pattern)) {
          matchLines.push(lineNumberAt(original, index));
        }
      }

      const uniqueLines = [...new Set(matchLines)].sort((left, right) => left - right);
      for (const line of uniqueLines.slice(0, 3)) {
        failures.push(`${relativePath}:${line} 违反六边形 owner 门禁：${rule.reason}（${rule.label}）`);
      }
      if (uniqueLines.length > 3) {
        failures.push(`${relativePath} 还有 ${uniqueLines.length - 3} 处 ${rule.label} 命中未展开`);
      }
    }
  }
}

function validateNoApplicationCoreTauriBoundaryLeaks() {
  const rustFiles = tauriBoundaryScanRoots.flatMap((root) => walkRustFiles(join(backendRoot, root)));

  for (const file of rustFiles) {
    const original = readUtf8(file);
    const content = stripRustComments(original);
    const relativePath = toRelative(file);

    for (const rule of forbiddenApplicationCoreBoundaryRules) {
      const matchLines = [];
      for (const pattern of rule.patterns) {
        for (const index of findRuleMatches(content, pattern)) {
          matchLines.push(lineNumberAt(original, index));
        }
      }

      const uniqueLines = [...new Set(matchLines)].sort((left, right) => left - right);
      for (const line of uniqueLines.slice(0, 3)) {
        failures.push(`${relativePath}:${line} 违反 application/core Tauri 边界门禁：${rule.reason}：${rule.label}`);
      }
      if (uniqueLines.length > 3) {
        failures.push(`${relativePath} 还有 ${uniqueLines.length - 3} 处 ${rule.label} 命中未展开`);
      }
    }
  }
}

function validateVoiceSkeleton() {
  for (const file of voiceBoundaryFiles) {
    const absolute = join(backendRoot, file);
    if (!assertExists(absolute, "voice 空骨架边界文件")) {
      continue;
    }

    const original = readUtf8(absolute);
    const content = stripRustComments(original);
    for (const rule of forbiddenVoiceRules) {
      const lines = findRuleMatches(content, rule.pattern).map((index) => lineNumberAt(original, index));
      for (const line of [...new Set(lines)].sort((left, right) => left - right)) {
        failures.push(`${toRelative(absolute)}:${line} 违反 voice 空骨架门禁：不得包含 ${rule.label}`);
      }
    }
  }
}

validateRequiredSkeleton();
validateNoRealSideEffects();
validateNoApplicationCoreTauriBoundaryLeaks();
validateVoiceSkeleton();
validateIpcCommandRegistration();

if (failures.length > 0) {
  console.error("后端六边形骨架校验失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("后端六边形校验通过：目录、边界文件、副作用 owner、voice 空骨架和 IPC command 注册一致性门禁满足当前规则。");
