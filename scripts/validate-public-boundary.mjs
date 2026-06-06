import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

// 中文职责说明：验证公开发布边界，避免主仓库混入独立发布资产或未脱敏的 raw 前端发布文案。
const repoRoot = process.cwd();
const maxTrackedBytes = 5 * 1024 * 1024;
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
  "扫码",
  "二维码",
  "付款码",
  "扫一扫",
  "微信扫码",
  "QR code",
  "QRCode",
];

const checks = [];

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
  // 中文职责说明：使用 git 的 tracked 清单作为发布资产检查来源，不扫描未跟踪临时文件。
  const output = execFileSync("git", ["-c", "core.quotePath=false", "ls-files", "-z"], {
    cwd: repoRoot,
  });
  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function walkFiles(root) {
  // 中文职责说明：只递归 raw 证据目录下的文件，跳过不存在的证据路径。
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
  // 中文职责说明：确保独立发布资产扩展名被标为不可 diff/merge，防止误当正文审查。
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
    missing.length === 0 ? "发布资产扩展名已列入规则" : `缺少规则：${missing.join(", ")}`,
  );
}

function validateReadmeFile(path) {
  // 中文职责说明：README 只允许保留开源理由方向，不允许恢复重建 prompt 或流程章节。
  if (!existsSync(join(repoRoot, path))) {
    addCheck(`${path} 存在`, false, "文件不存在");
    return;
  }

  const content = readUtf8(path);
  const headings = content
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.trim());
  const allowedHeadings = ["# OpenAiMami", "## 为什么开源"];
  const unexpectedHeadings = headings.filter((heading) => !allowedHeadings.includes(heading));
  const requiredReasons = [
    { name: "个人迭代", pattern: /个人迭代/ },
    { name: "Apache License", pattern: /Apache License/ },
    { name: "隐私放心", pattern: /(隐私泄露|用得更放心|放心)/ },
  ];
  const missingReasons = requiredReasons
    .filter(({ pattern }) => !pattern.test(content))
    .map(({ name }) => name);
  const forbiddenSections = [
    /##\s*仓库内容/,
    /##\s*重建流程/,
    /##\s*可直接给 AI 的重建提示/,
    /##\s*匿名化规则/,
    /prompt/i,
  ];
  const hasForbiddenSection = forbiddenSections.some((pattern) => pattern.test(content));
  const ok =
    unexpectedHeadings.length === 0 &&
    missingReasons.length === 0 &&
    !hasForbiddenSection;

  const details = [];
  if (unexpectedHeadings.length > 0) details.push(`额外标题：${unexpectedHeadings.join(", ")}`);
  if (missingReasons.length > 0) details.push(`缺少理由：${missingReasons.join(", ")}`);
  if (hasForbiddenSection) details.push("包含重建提示或流程类内容");

  addCheck(
    `${path} 只保留开源理由方向`,
    ok,
    details.length === 0 ? "章节和理由符合公开说明边界" : details.join("；"),
  );
}

function validateTrackedAssets() {
  // 中文职责说明：主仓库 tracked 文件不得包含 IDB、压缩包、安装包或超过门槛的大文件。
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
    forbiddenAssets.length === 0 ? "未发现禁止发布资产" : forbiddenAssets.join("；"),
  );
  addCheck(
    "tracked 文件不存在大文件",
    largeFiles.length === 0,
    largeFiles.length === 0 ? "未发现超过 5MB 的 tracked 文件" : largeFiles.join("；"),
  );
}

function validateRawFrontendAssets() {
  // 中文职责说明：raw 前端资产不得保留扫码、二维码、付款码等不适合公开发布的文案。
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
    hits.length === 0 ? "未发现扫码/支付类发布禁词" : hits.slice(0, 20).join("；"),
  );
}

// 中文职责说明：所有检查按固定顺序输出中文 PASS/FAIL，便于 CI 和人工审查同时读取。
validateGitAttributes();
validateReadmeFile("README.md");
validateReadmeFile("README-cn.md");
validateTrackedAssets();
validateRawFrontendAssets();

let failed = 0;
for (const check of checks) {
  if (check.ok) {
    console.log(`PASS ${check.name}：${check.detail}`);
  } else {
    failed += 1;
    console.log(`FAIL ${check.name}：${check.detail}`);
  }
}

if (failed > 0) {
  console.error(`公开发布边界验证失败：${failed} 项不通过。`);
  process.exit(1);
}

console.log("公开发布边界验证通过。");
