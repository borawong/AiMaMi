import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function repoPath(...parts) {
  return join(repoRoot, ...parts);
}

function toRepoPath(file) {
  return relative(repoRoot, file).split(sep).join("/");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function flattenLocale(value, prefix = [], entries = []) {
  if (typeof value === "string") {
    entries.push([prefix.join("."), value]);
    return entries;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return entries;
  for (const [key, child] of Object.entries(value)) {
    flattenLocale(child, [...prefix, key], entries);
  }
  return entries;
}

function walkFiles(root, predicate, files = []) {
  if (!existsSync(root)) return files;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(path, predicate, files);
      continue;
    }
    if (predicate(path)) files.push(path);
  }
  return files;
}

const rawControlFlowSources = [
  {
    platform: "windows-x64",
    path: repoPath(
      "evidence",
      "full-chain",
      "raw",
      "aimami",
      "1.0.9",
      "windows-x64",
      "frontend",
      "tauri-dumped",
      "frontend",
      "frontend-control-flow.jsonl",
    ),
  },
  {
    platform: "macos",
    path: repoPath(
      "evidence",
      "full-chain",
      "raw",
      "aimami",
      "1.0.9",
      "macos",
      "frontend",
      "macos-109-frontend-ccf-found-app",
      "frontend",
      "frontend-control-flow.jsonl",
    ),
  },
];

function collectRawKeyEvidence() {
  const evidenceByKey = new Map();

  for (const source of rawControlFlowSources) {
    for (const [index, row] of readJsonl(source.path).entries()) {
      const keys = Array.isArray(row.trigger?.i18n_keys)
        ? row.trigger.i18n_keys
        : [];
      for (const key of keys) {
        if (!evidenceByKey.has(key)) evidenceByKey.set(key, []);
        evidenceByKey.get(key).push({
          platform: source.platform,
          source: toRepoPath(source.path),
          row: index + 1,
          componentFile: row.component_file ?? null,
          command: row.terminal_call?.command ?? null,
          evidenceFile: row.evidence?.file ?? null,
          evidenceLine: row.evidence?.line ?? null,
          evidenceColumn: row.evidence?.column ?? null,
        });
      }
    }
  }

  return evidenceByKey;
}

function collectInternalKeyEvidence(localeKeys) {
  const keySet = new Set(localeKeys);
  const evidenceByKey = new Map();
  const internalRoot = repoPath("evidence", "full-chain", "internal");
  const files = walkFiles(
    internalRoot,
    (file) =>
      /\.(md|json|jsonl)$/.test(file) &&
      !file.endsWith(`${sep}frontend-copy-acceptance.json`),
  );

  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const match of line.matchAll(/[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z0-9-]+)+/g)) {
        const key = match[0];
        if (!keySet.has(key)) continue;
        if (!evidenceByKey.has(key)) evidenceByKey.set(key, []);
        evidenceByKey.get(key).push({
          source: toRepoPath(file),
          line: index + 1,
        });
      }
    });
  }

  return evidenceByKey;
}

function evidenceTier(rawEvidence, internalEvidence) {
  if (rawEvidence.length > 0 && internalEvidence.length > 0) {
    return "raw-and-internal-key";
  }
  if (rawEvidence.length > 0) return "raw-control-flow-key";
  if (internalEvidence.length > 0) return "internal-key";
  return "source-sync-only";
}

function buildAcceptanceDraft() {
  const zhPath = repoPath("src", "locales", "zh.json");
  const enPath = repoPath("src", "locales", "en.json");
  const zhEntries = new Map(flattenLocale(readJson(zhPath)));
  const enEntries = new Map(flattenLocale(readJson(enPath)));
  const allKeys = [...new Set([...zhEntries.keys(), ...enEntries.keys()])].sort();
  const rawKeyEvidence = collectRawKeyEvidence();
  const internalKeyEvidence = collectInternalKeyEvidence(allKeys);

  const entries = allKeys.map((key) => {
    const rawEvidence = rawKeyEvidence.get(key) ?? [];
    const internalEvidence = internalKeyEvidence.get(key) ?? [];
    const tier = evidenceTier(rawEvidence, internalEvidence);
    return {
      key,
      zhValue: zhEntries.get(key) ?? null,
      enValue: enEntries.get(key) ?? null,
      zhAccepted: false,
      enAccepted: false,
      zhSource: null,
      enSource: null,
      evidenceTier: tier,
      status: `${tier}-copy-unaccepted`,
      blocker:
        tier !== "source-sync-only"
          ? "当前证据只能证明该 i18n key 出现过，不能证明原始中文/英文文案值。"
          : "当前未找到 raw/internal key 或原始文案来源。需要补齐来源后才能验收。",
      keyEvidence: {
        rawControlFlow: rawEvidence,
        internalMentions: internalEvidence,
      },
      literalEvidence: [],
    };
  });

  const rawObservedKeys = entries.filter(
    (entry) => entry.keyEvidence.rawControlFlow.length > 0,
  ).length;
  const internalObservedKeys = entries.filter(
    (entry) => entry.keyEvidence.internalMentions.length > 0,
  ).length;
  const rawOrInternalObservedKeys = entries.filter(
    (entry) =>
      entry.keyEvidence.rawControlFlow.length > 0 ||
      entry.keyEvidence.internalMentions.length > 0,
  ).length;

  return {
    schema: "open-aimami.frontend.copy_acceptance.v1",
    status: "draft",
    purpose:
      "逐条记录前端 locale 文案验收状态。本文件不是验收通过声明；只有 zhAccepted/enAccepted 同时为 true 且 zhSource/enSource 指向 raw/internal 原文时，才算对应 key 完成。",
    sources: {
      localeFiles: ["src/locales/zh.json", "src/locales/en.json"],
      rawControlFlow: rawControlFlowSources.map((source) =>
        toRepoPath(source.path),
      ),
      internalRoot: "evidence/full-chain/internal",
    },
    totals: {
      zhLocaleKeys: zhEntries.size,
      enLocaleKeys: enEntries.size,
      entries: entries.length,
      rawControlFlowKeyBacked: rawObservedKeys,
      internalKeyBacked: internalObservedKeys,
      rawOrInternalKeyBacked: rawOrInternalObservedKeys,
      sourceSyncOnly: entries.length - rawOrInternalObservedKeys,
      literalZhBacked: 0,
      literalEnBacked: 0,
      acceptedZh: entries.filter((entry) => entry.zhAccepted).length,
      acceptedEn: entries.filter((entry) => entry.enAccepted).length,
      missingRawOrInternalCopySource: entries.filter(
        (entry) => !entry.zhSource || !entry.enSource,
      ).length,
    },
    entries,
  };
}

const outputPath = repoPath(
  "evidence",
  "full-chain",
  "internal",
  "frontend-copy-acceptance.json",
);
const output = `${JSON.stringify(buildAcceptanceDraft(), null, 2)}\n`;

if (process.argv.includes("--check")) {
  if (!existsSync(outputPath)) {
    console.error(`缺少 ${toRepoPath(outputPath)}，请运行 npm run generate:frontend-copy-acceptance`);
    process.exit(1);
  }

  const current = readFileSync(outputPath, "utf8").replace(/\r\n/g, "\n");
  if (current !== output) {
    console.error(`${toRepoPath(outputPath)} 未同步，请运行 npm run generate:frontend-copy-acceptance`);
    process.exit(1);
  }

  console.log(`${toRepoPath(outputPath)} 已同步`);
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, "utf8");
  console.log(`已生成 ${toRepoPath(outputPath)}`);
}
