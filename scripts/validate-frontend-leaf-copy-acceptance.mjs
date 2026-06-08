import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..");
const failures = [];
const notes = [];

function repoPath(...parts) {
  return join(repoRoot, ...parts);
}

function toRepoPath(file) {
  return relative(repoRoot, file).split(sep).join("/");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
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

function flattenLocale(locale, prefix = [], entries = new Map()) {
  if (typeof locale === "string") {
    entries.set(prefix.join("."), locale);
    return entries;
  }
  if (!locale || typeof locale !== "object" || Array.isArray(locale)) return entries;
  for (const [key, value] of Object.entries(locale)) {
    flattenLocale(value, [...prefix, key], entries);
  }
  return entries;
}

function hasLocaleKey(locale, key) {
  let current = locale;
  for (const part of key.split(".")) {
    if (!current || typeof current !== "object" || !(part in current)) return false;
    current = current[part];
  }
  return typeof current === "string" || typeof current === "number" || typeof current === "boolean";
}

function collectGateFields(value, file, path = [], fields = []) {
  if (!value || typeof value !== "object") return fields;
  const requiredTrueFields = new Set(["readyToImplement", "implementation_use", "gate_accepted", "full_leaf_100"]);
  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (requiredTrueFields.has(key) || key === "dim6_missing") {
      fields.push({ file, path: nextPath.join("."), value: child });
    }
    collectGateFields(child, file, nextPath, fields);
  }
  return fields;
}

function gateFieldFailed(field) {
  if (field.path.endsWith("dim6_missing")) return field.value === true;
  if (field.path.endsWith("full_leaf_100")) return field.value !== true;
  if (field.path.endsWith("readyToImplement")) return field.value === false || field.value === 0;
  return field.value === false;
}

function checkGateSpecInputs() {
  const required = [
    repoPath("evidence", "full-chain", "internal", "root", "GATE-SPEC.md"),
    repoPath("evidence", "full-chain", "internal", "root", "CONSUMER-GATE-SCHEMA.md"),
  ];
  for (const path of required) {
    if (!existsSync(path)) failures.push(`缺少严格 gate 规范输入：${toRepoPath(path)}`);
  }
}

function checkFullLeafGapAudit() {
  const auditPath = repoPath("evidence", "full-chain", "internal", "data", "data", "full-leaf-100-gap-audit.json");
  const audit = readJson(auditPath);
  const totals = audit.totals ?? {};

  if (totals.full_leaf_100 !== true) {
    failures.push(`${toRepoPath(auditPath)} totals.full_leaf_100=${String(totals.full_leaf_100)}`);
  }
  if (totals.gate_accepted !== true) {
    failures.push(`${toRepoPath(auditPath)} totals.gate_accepted=${String(totals.gate_accepted)}`);
  }
  if (Number(totals.consumerStartBlocked ?? 0) > 0) {
    failures.push(`${toRepoPath(auditPath)} consumerStartBlocked=${totals.consumerStartBlocked}`);
  }
  if (Number(totals.readyToImplement ?? 0) !== Number(totals.totalRows ?? 0)) {
    failures.push(`${toRepoPath(auditPath)} readyToImplement=${totals.readyToImplement}/${totals.totalRows}`);
  }

  for (const [moduleName, moduleGate] of Object.entries(audit.modules ?? {})) {
    const blocked = Number(moduleGate.consumerStartBlocked ?? 0);
    const blockers = Array.isArray(moduleGate.fullLeafBlockers) ? moduleGate.fullLeafBlockers : [];
    if (blocked > 0) {
      failures.push(`${toRepoPath(auditPath)} modules.${moduleName}.consumerStartBlocked=${blocked}`);
    }
    if (blockers.length > 0) {
      failures.push(`${toRepoPath(auditPath)} modules.${moduleName}.fullLeafBlockers=${blockers.length}`);
    }
    if (moduleGate.moduleExitAllowed === false) {
      failures.push(`${toRepoPath(auditPath)} modules.${moduleName}.moduleExitAllowed=false`);
    }
  }
}

function checkGateReports() {
  const gateRoot = repoPath("evidence", "full-chain", "internal", "audits", "audits");
  const reports = walkFiles(gateRoot, (file) => file.endsWith(`${sep}gate-report.json`));
  if (reports.length === 0) {
    failures.push("没有找到 internal gate-report.json，无法证明 leaf gate");
    return;
  }

  const falseFields = [];
  for (const report of reports) {
    const fields = collectGateFields(readJson(report), toRepoPath(report));
    falseFields.push(...fields.filter((field) => gateFieldFailed(field)));
  }

  for (const field of falseFields.slice(0, 80)) {
    failures.push(`${field.file} ${field.path}=${String(field.value)}`);
  }
  if (falseFields.length > 80) {
    failures.push(`internal gate-report 另有 ${falseFields.length - 80} 个严格 gate 字段未通过`);
  }
  notes.push(`internal gate-report 严格 gate 字段：${reports.length} 个文件，失败字段 ${falseFields.length} 个`);
}

function checkLeafLedger() {
  const ledgerPath = repoPath("evidence", "full-chain", "internal", "leaf-ledger-map.json");
  const ledger = readJson(ledgerPath);
  const leaves = Object.keys(ledger.leaves ?? {});
  const macLeaves = leaves.filter((leaf) => leaf.startsWith("macos") || leaf.startsWith("macos-arm64"));
  const winLeaves = leaves.filter((leaf) => leaf.startsWith("windows") || leaf.startsWith("windows-x64"));

  if (leaves.length === 0) failures.push(`${toRepoPath(ledgerPath)} 没有 leaf 条目`);
  if (macLeaves.length === 0) failures.push(`${toRepoPath(ledgerPath)} 没有 macOS leaf 条目`);
  if (winLeaves.length === 0) failures.push(`${toRepoPath(ledgerPath)} 没有 Windows leaf 条目`);
  notes.push(`leaf-ledger-map leaf 条目：全部 ${leaves.length}，macOS ${macLeaves.length}，Windows ${winLeaves.length}`);
}

function checkRawFrontendLocaleKeys() {
  const controlFlowSources = [
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
  const zhPath = repoPath("src", "locales", "zh.json");
  const enPath = repoPath("src", "locales", "en.json");
  const zh = readJson(zhPath);
  const en = readJson(enPath);

  for (const source of controlFlowSources) {
    if (!existsSync(source.path)) {
      failures.push(`缺少 ${source.platform} raw frontend-control-flow：${toRepoPath(source.path)}`);
      continue;
    }
    const rows = readJsonl(source.path);
    const rawKeys = [...new Set(rows.flatMap((row) => row.trigger?.i18n_keys ?? []))].sort();
    const missing = rawKeys.filter((key) => !hasLocaleKey(zh, key) || !hasLocaleKey(en, key));
    for (const key of missing) {
      failures.push(`${source.platform} raw frontend-control-flow locale key 未同步 zh/en：${key}`);
    }
    notes.push(`${source.platform} raw frontend-control-flow locale key：${rawKeys.length}，缺失 ${missing.length}`);
  }
}

function checkCopyAcceptanceProof() {
  const zhPath = repoPath("src", "locales", "zh.json");
  const enPath = repoPath("src", "locales", "en.json");
  const zhEntries = flattenLocale(readJson(zhPath));
  const enEntries = flattenLocale(readJson(enPath));
  const proofPath = repoPath("evidence", "full-chain", "internal", "frontend-copy-acceptance.json");

  notes.push(`locale 字符串数量：zh ${zhEntries.size}，en ${enEntries.size}`);

  if (!existsSync(proofPath)) {
    failures.push(
      "没有找到 evidence/full-chain/internal/frontend-copy-acceptance.json，无法证明全文案逐条对照 raw/internal 原文",
    );
    return;
  }

  const proof = readJson(proofPath);
  if (proof.schema !== "open-aimami.frontend.copy_acceptance.v1") {
    failures.push(`${toRepoPath(proofPath)} schema 不匹配`);
  }
  if (proof.status !== "accepted") {
    failures.push(`${toRepoPath(proofPath)} status=${String(proof.status)}`);
  }
  const entries = Array.isArray(proof.entries) ? proof.entries : [];
  if (entries.length !== zhEntries.size || entries.length !== enEntries.size) {
    failures.push(`${toRepoPath(proofPath)} entries=${entries.length}，locale zh/en=${zhEntries.size}/${enEntries.size}`);
  }
  const acceptedEntries = entries.filter(
    (entry) => entry.zhAccepted === true && entry.enAccepted === true,
  );
  const missingSourceEntries = entries.filter(
    (entry) => !entry.zhSource || !entry.enSource,
  );
  notes.push(
    `frontend-copy-acceptance：status=${String(proof.status)}，entries=${entries.length}，accepted=${acceptedEntries.length}，missingSource=${missingSourceEntries.length}`,
  );

  if (proof.status !== "accepted") {
    const totals = proof.totals && typeof proof.totals === "object" ? proof.totals : {};
    failures.push(
      `${toRepoPath(proofPath)} 仍是草稿或未验收状态：acceptedZh=${String(totals.acceptedZh ?? acceptedEntries.length)} acceptedEn=${String(totals.acceptedEn ?? acceptedEntries.length)} missingRawOrInternalCopySource=${String(totals.missingRawOrInternalCopySource ?? missingSourceEntries.length)}`,
    );
    for (const entry of missingSourceEntries.slice(0, 10)) {
      failures.push(`${toRepoPath(proofPath)} ${entry.key} 缺少 raw/internal 文案来源`);
    }
    if (missingSourceEntries.length > 10) {
      failures.push(`${toRepoPath(proofPath)} 另有 ${missingSourceEntries.length - 10} 个 locale key 缺少 raw/internal 文案来源`);
    }
    return;
  }
  for (const entry of entries) {
    if (entry.zhAccepted !== true || entry.enAccepted !== true) {
      failures.push(`${toRepoPath(proofPath)} ${entry.key} 未同时验收 zh/en`);
    }
    if (!entry.zhSource || !entry.enSource) {
      failures.push(`${toRepoPath(proofPath)} ${entry.key} 缺少 raw/internal 文案来源`);
    }
  }
}

function checkFrontendChainDocs() {
  const closedFrontendDocs = loadClosedFrontendDocs();
  const frontendDocs = walkFiles(
    repoPath("evidence", "full-chain", "internal", "audits", "audits"),
    (file) => file.includes(`${sep}frontend${sep}`) && file.endsWith(".md"),
  );
  const hits = [];

  for (const file of frontendDocs) {
    const normalizedFile = toRepoPath(file);
    if (closedFrontendDocs.has(normalizedFile)) continue;
    const text = readText(file).toLowerCase();
    const signal = findFrontendDocSignal(text);
    if (signal) {
      hits.push(`${normalizedFile} 包含缺口信号：${signal}`);
    }
  }

  for (const hit of hits.slice(0, 40)) {
    failures.push(hit);
  }
  if (hits.length > 40) {
    failures.push(`internal frontend 文档另有 ${hits.length - 40} 个缺口信号`);
  }
  notes.push(`internal frontend 文档缺口信号：${hits.length}/${frontendDocs.length}`);
}

function findFrontendDocSignal(text) {
  const checks = [
    ["missing frontend route/API/command/mock chain", "missing frontend route/api/command/mock chain"],
    ["not_closed", "not_closed"],
    ["not closed", "not closed"],
    ["partial/candidate", "partial/candidate"],
    ["blocked by", "blocked by"],
    ["still blocked", "still blocked"],
    ["blockers", "blockers"],
    ["implementation gap", "implementation gap"],
    ["source archive 实现 gap", "source archive 实现 gap"],
    ["**gap**", "**gap**"],
  ];
  for (const [label, needle] of checks) {
    if (text.includes(needle)) return label;
  }
  return null;
}

function loadClosedFrontendDocs() {
  const closeoutsPath = repoPath("docs", "reconstruction", "frontend-current-source-closeouts.json");
  if (!existsSync(closeoutsPath)) return new Set();
  const closeouts = readJson(closeoutsPath);
  const closedDocs = new Set();
  for (const closeout of closeouts.closeouts ?? []) {
    if (closeout.status !== "current-source-closed-partial") continue;
    for (const doc of closeout.closedFrontendDocs ?? []) {
      closedDocs.add(doc);
    }
  }
  return closedDocs;
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

function loadClosedManifestStatuses() {
  const closeoutsPath = repoPath("docs", "reconstruction", "frontend-current-source-closeouts.json");
  if (!existsSync(closeoutsPath)) return new Set();
  const closeouts = readJson(closeoutsPath);
  const closedStatuses = new Set();
  for (const closeout of closeouts.closeouts ?? []) {
    if (closeout.status !== "current-source-closed-partial") continue;
    for (const entry of closeout.closedManifestStatuses ?? []) {
      closedStatuses.add(manifestCloseoutKey(entry));
    }
  }
  return closedStatuses;
}

function checkFrontendManifestStatuses() {
  const closedManifestStatuses = loadClosedManifestStatuses();
  const manifestPath = repoPath("src", "restoration", "frontend-manifest", "index.ts");
  const lines = readText(manifestPath).split(/\r?\n/);
  const nonLeafStatuses = new Set(["source-only", "boundary-only", "contract-service-only", "owner-closed"]);
  const hits = [];
  let currentArray = null;
  let objectDepth = 0;
  let currentRecord = null;

  lines.forEach((line, index) => {
    const arrayMatch = line.match(/^export const\s+([A-Z0-9_]+)\s*=\s*\[/);
    if (arrayMatch) {
      currentArray = arrayMatch[1];
      objectDepth = 0;
      currentRecord = null;
      return;
    }
    if (!currentArray) return;
    if (line.trim().startsWith("] as const") || line.trim().startsWith("] satisfies")) {
      currentArray = null;
      objectDepth = 0;
      currentRecord = null;
      return;
    }
    if (currentArray === "FRONTEND_DUMPED_BOUNDARY_EXCEPTIONS") return;

    if (objectDepth === 0 && line.trim().startsWith("{")) {
      currentRecord = {
        arrayName: currentArray,
        owner: null,
        module: null,
        command: null,
        queryKey: null,
        source: null,
        status: null,
        statusLine: null,
      };
    }
    if (!currentRecord) return;

    for (const field of ["module", "owner", "command", "queryKey", "source"]) {
      const match = line.match(new RegExp(`\\b${field}:\\s*"([^"]+)"`));
      if (match) currentRecord[field] = match[1];
    }
    const statusMatch = line.match(/\bstatus:\s*"([^"]+)"/);
    if (statusMatch && nonLeafStatuses.has(statusMatch[1])) {
      currentRecord.status = statusMatch[1];
      currentRecord.statusLine = index + 1;
    }

    objectDepth += (line.match(/{/g) ?? []).length;
    objectDepth -= (line.match(/}/g) ?? []).length;
    if (objectDepth <= 0) {
      if (currentRecord.status && !closedManifestStatuses.has(manifestCloseoutKey(currentRecord))) {
        const owner = currentRecord.owner ?? currentRecord.module ?? "unknown";
        const command = currentRecord.command ? ` command=${currentRecord.command}` : "";
        const queryKey = currentRecord.queryKey ? ` queryKey=${currentRecord.queryKey}` : "";
        const source = currentRecord.source ? ` source=${currentRecord.source}` : "";
        hits.push(
          `${toRepoPath(manifestPath)}:${currentRecord.statusLine} ${currentRecord.arrayName} owner=${owner}${command}${queryKey}${source} manifest status=${currentRecord.status}`,
        );
      }
      objectDepth = 0;
      currentRecord = null;
    }
  });

  for (const hit of hits.slice(0, 60)) {
    failures.push(hit);
  }
  if (hits.length > 60) {
    failures.push(`frontend manifest 另有 ${hits.length - 60} 个非 full leaf 状态`);
  }
  notes.push(`frontend manifest 非 full leaf 状态：${hits.length}`);
}

checkGateSpecInputs();
checkFullLeafGapAudit();
checkGateReports();
checkLeafLedger();
checkRawFrontendLocaleKeys();
checkCopyAcceptanceProof();
checkFrontendChainDocs();
checkFrontendManifestStatuses();

for (const note of notes) {
  console.log(`INFO ${note}`);
}

if (failures.length > 0) {
  console.error("前端 leaf/全文案严格验收失败：");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("前端 leaf/全文案严格验收通过。");
