import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const repoRoot = process.cwd();
const maxTrackedBytes = 5 * 1024 * 1024;
const checks = [];

const forbiddenTrackedExtensions = new Set([
  ".i64",
  ".idb",
  ".zip",
  ".7z",
  ".rar",
  ".tar",
  ".gz",
  ".tgz",
  ".exe",
  ".msi",
  ".dmg",
  ".pkg",
  ".iso",
]);

const rawRoot = join(
  repoRoot,
  "evidence",
  "full-chain",
  "raw",
  "aimami",
  "1.0.9",
);

const rawTextExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".md",
  ".svg",
  ".txt",
]);

const publishForbiddenTerms = [
  "二维码",
  "付款码",
  "扫码",
  "微信扫码",
  "QR code",
  "QRCode",
];

const repositoryForbiddenTerms = [
  ["lobe", "hub"].join(""),
  ["C", "5"].join(""),
  ["Codex", "Manager"].join(""),
];

function toRepoPath(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

function addCheck(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function readUtf8(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function isBinaryLike(buffer) {
  return buffer.includes(0);
}

function listTrackedFiles() {
  const output = execFileSync(
    "git",
    ["-c", "core.quotePath=false", "ls-files", "-z"],
    { cwd: repoRoot },
  );
  return output.toString("utf8").split("\0").filter(Boolean);
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const pending = [root];
  const files = [];

  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(next);
      } else if (entry.isFile()) {
        files.push(next);
      }
    }
  }

  return files;
}

function validateGitAttributes() {
  const path = ".gitattributes";
  if (!existsSync(join(repoRoot, path))) {
    addCheck(".gitattributes 存在", false, "缺少 .gitattributes");
    return;
  }

  const content = readUtf8(path);
  const requiredPatterns = [
    "*.i64",
    "*.idb",
    "*.zip",
    "*.7z",
    "*.rar",
    "*.tar",
    "*.tar.gz",
    "*.tgz",
    "*.gz",
    "*.exe",
    "*.msi",
    "*.dmg",
    "*.pkg",
    "*.iso",
  ];
  const missing = requiredPatterns.filter((pattern) => !content.includes(pattern));
  addCheck(
    ".gitattributes 发布资产规则",
    missing.length === 0,
    missing.length === 0
      ? "发布资产扩展名已列入规则"
      : `缺少规则：${missing.join(", ")}`,
  );
}

function validateReadmeFile(path) {
  if (!existsSync(join(repoRoot, path))) {
    addCheck(`${path} 存在`, false, "文件不存在");
    return;
  }

  const content = readUtf8(path);
  const headings = content
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.trim());
  const requiredHeadings = [
    "# OpenAiMami",
    "## 为什么公开",
    "## 仓库内容",
    "## 重建流程",
    "## 可直接给 AI 的重建提示",
    "## PR 规则",
    "## 匿名化规则",
  ];
  const missingHeadings = requiredHeadings.filter(
    (heading) => !headings.includes(heading),
  );
  const requiredReasons = [
    { name: "个人迭代", pattern: /个人.*迭代|继续迭代/ },
    { name: "Apache License", pattern: /Apache License/ },
    { name: "隐私泄露风险", pattern: /隐私泄露|隐私相关行为|使用者.*检查/ },
    { name: "raw/internal 主链路", pattern: /raw\/internal|raw、internal/ },
  ];
  const missingReasons = requiredReasons
    .filter(({ pattern }) => !pattern.test(content))
    .map(({ name }) => name);
  const forbiddenTerms = repositoryForbiddenTerms.filter((term) =>
    content.includes(term),
  );
  const ok =
    missingHeadings.length === 0 &&
    missingReasons.length === 0 &&
    forbiddenTerms.length === 0;

  const details = [];
  if (missingHeadings.length > 0) {
    details.push(`缺少标题：${missingHeadings.join(", ")}`);
  }
  if (missingReasons.length > 0) {
    details.push(`缺少理由：${missingReasons.join(", ")}`);
  }
  if (forbiddenTerms.length > 0) {
    details.push(`包含禁止公开标识：${forbiddenTerms.join(", ")}`);
  }

  addCheck(
    `${path} 保留完整中文公开重建说明`,
    ok,
    details.length === 0 ? "README 保留中文说明、重建流程和匿名化规则" : details.join("；"),
  );
}

function validateTrackedAssets() {
  const trackedFiles = listTrackedFiles();
  const forbiddenAssets = [];
  const largeFiles = [];

  for (const file of trackedFiles) {
    const normalized = file.replaceAll("\\", "/");
    const extension = extname(normalized).toLowerCase();
    if (forbiddenTrackedExtensions.has(extension) || normalized.endsWith(".tar.gz")) {
      forbiddenAssets.push(normalized);
    }

    const absolute = join(repoRoot, file);
    if (existsSync(absolute)) {
      const size = statSync(absolute).size;
      if (size > maxTrackedBytes) {
        largeFiles.push(`${normalized} (${size} bytes)`);
      }
    }
  }

  addCheck(
    "tracked 文件不存在 IDB/压缩包/安装包",
    forbiddenAssets.length === 0,
    forbiddenAssets.length === 0
      ? "未发现禁止发布资产"
      : forbiddenAssets.join("；"),
  );
  addCheck(
    "tracked 文件不存在大文件",
    largeFiles.length === 0,
    largeFiles.length === 0
      ? "未发现超过 5MB 的 tracked 文件"
      : largeFiles.join("；"),
  );
}

function validateRawFrontendAssets() {
  const files = walkFiles(rawRoot).filter((file) => {
    const repoPath = toRepoPath(file).toLowerCase();
    return repoPath.includes("/frontend/") && rawTextExtensions.has(extname(repoPath));
  });
  const hits = [];

  for (const file of files) {
    const buffer = readFileSync(file);
    if (isBinaryLike(buffer)) continue;
    const content = buffer.toString("utf8");
    for (const term of publishForbiddenTerms) {
      const lowerContent = content.toLowerCase();
      const lowerTerm = term.toLowerCase();
      let index = lowerContent.indexOf(lowerTerm);
      while (index >= 0) {
        const line = content.slice(0, index).split(/\r?\n/).length;
        hits.push(`${toRepoPath(file)}:${line} 命中 ${term}`);
        index = lowerContent.indexOf(lowerTerm, index + lowerTerm.length);
      }
    }
  }

  addCheck(
    "raw 前端资产不存在发布禁词",
    hits.length === 0,
    hits.length === 0
      ? "未发现扫码、支付或二维码类发布禁词"
      : hits.slice(0, 20).join("；"),
  );
}

function validateRepositoryTextBoundary() {
  const trackedTextFiles = listTrackedFiles().filter((file) =>
    [".md", ".ts", ".tsx", ".js", ".mjs", ".rs", ".json"].includes(
      extname(file).toLowerCase(),
    ),
  );
  const hits = [];

  for (const file of trackedTextFiles) {
    const absolute = join(repoRoot, file);
    if (!existsSync(absolute)) continue;
    const buffer = readFileSync(absolute);
    if (isBinaryLike(buffer)) continue;
    const content = buffer.toString("utf8");
    for (const term of repositoryForbiddenTerms) {
      if (content.includes(term)) {
        hits.push(`${file} 命中 ${term}`);
      }
    }
  }

  addCheck(
    "公开文本不存在禁止标识",
    hits.length === 0,
    hits.length === 0 ? "未发现禁止公开标识" : hits.join("；"),
  );
}

validateGitAttributes();
validateReadmeFile("README.md");
validateReadmeFile("README-cn.md");
validateTrackedAssets();
validateRawFrontendAssets();
validateRepositoryTextBoundary();

let failed = false;
for (const check of checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.name}${check.detail ? `：${check.detail}` : ""}`);
  if (!check.ok) failed = true;
}

if (failed) {
  process.exit(1);
}
