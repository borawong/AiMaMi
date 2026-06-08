import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

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
validateVoiceSkeleton();

if (failures.length > 0) {
  console.error("后端六边形骨架校验失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("后端六边形校验通过：目录、边界文件、副作用 owner 和 voice 空骨架门禁满足当前规则。");
