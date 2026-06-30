#!/usr/bin/env node

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";

const API_BASE = "https://api.iiiiitoken.com/v1/images/generations";
const MODEL = "gpt-image-2-x";
const CONFIG_PATH = join(homedir(), ".codex", "niu-image-gen-config.json");

const SIZE_MATRIX = {
  "1K": { square: "1024x1024", landscape: "1536x1024", portrait: "1024x1536" },
  "2K": { square: "2048x2048", landscape: "2048x1536", portrait: "1536x2048" },
  "4K": { square: "2880x2880", landscape: "3840x2160", portrait: "2160x3840" },
};

const DEFAULTS = { quality: "2K", ratio: "square", count: 1, concurrency: 3 };
const RATIO_NAMES = { square: "正方形", landscape: "横版", portrait: "竖版" };
const QUALITY_EMOJI = { "1K": "🚀", "2K": "✨", "4K": "💎" };

function resolveSize(quality, ratio) {
  return SIZE_MATRIX[quality?.toUpperCase()]?.[ratio?.toLowerCase()] || null;
}

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  try { return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")); } catch { return null; }
}

function saveConfig(cfg) {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

function getApiKey() {
  const cfg = loadConfig();
  if (!cfg?.apiKey) {
    console.error("ERROR: API key not configured.");
    process.exit(1);
  }
  return cfg.apiKey;
}

function timestamp() {
  const d = new Date();
  return [
    d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"), "_",
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join("");
}

function resolveOutputDir(userDir) {
  const dir = userDir || join(homedir(), "Pictures", "niu-image-gen");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function generate(apiKey, prompt, size, outputDir) {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, prompt, n: 1, size }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const elapsed = Date.now() - start;

    if (!res.ok) {
      const body = await res.text();
      let msg;
      try { msg = JSON.parse(body).error?.message || body; } catch { msg = body; }
      return { ok: false, elapsed, error: `HTTP ${res.status}: ${msg}` };
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return { ok: false, elapsed, error: "No image data in response" };

    const buf = Buffer.from(b64, "base64");
    const filename = `img_${timestamp()}_${Math.random().toString(36).slice(2, 6)}.png`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, buf);

    return { ok: true, elapsed, path: filepath, fileSize: `${(buf.length / 1024 / 1024).toFixed(2)}MB` };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, elapsed: Date.now() - start, error: err.name === "AbortError" ? "Timeout (120s)" : err.message };
  }
}

async function editImage(apiKey, imagePath, prompt, size, outputDir) {
  if (!existsSync(imagePath)) {
    return { ok: false, elapsed: 0, error: `文件不存在: ${imagePath}` };
  }

  const imageData = readFileSync(imagePath);
  const lp = imagePath.toLowerCase();
  const ext = lp.endsWith(".jpg") || lp.endsWith(".jpeg") ? "jpeg" : lp.endsWith(".webp") ? "webp" : "png";
  const dataUrl = `data:image/${ext};base64,${imageData.toString("base64")}`;
  const sourceName = basename(imagePath);

  console.log(`🖼️ 加载 ${sourceName} (${(imageData.length / 1024 / 1024).toFixed(2)}MB)...`);
  console.log(`✏️ 编辑中...\n`);

  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, prompt, n: 1, size, image: dataUrl }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const elapsed = Date.now() - start;

    if (!res.ok) {
      const body = await res.text();
      let msg;
      try { msg = JSON.parse(body).error?.message || body; } catch { msg = body; }
      return { ok: false, elapsed, error: `HTTP ${res.status}: ${msg}` };
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return { ok: false, elapsed, error: "No image data in response" };

    const buf = Buffer.from(b64, "base64");
    const filename = `edit_${timestamp()}_${Math.random().toString(36).slice(2, 6)}.png`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, buf);

    return { ok: true, elapsed, path: filepath, fileSize: `${(buf.length / 1024 / 1024).toFixed(2)}MB`, sourceName };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, elapsed: Date.now() - start, error: err.name === "AbortError" ? "Timeout (180s)" : err.message };
  }
}

async function batchGenerate(apiKey, prompts, size, concurrency, outputDir) {
  const total = prompts.length;
  const results = new Array(total);
  let nextIdx = 0;

  async function worker() {
    while (nextIdx < total) {
      const idx = nextIdx++;
      const prompt = prompts[idx];
      console.log(`[${idx + 1}/${total}] 生成中: "${prompt.slice(0, 30)}${prompt.length > 30 ? "..." : ""}"`);
      const result = await generate(apiKey, prompt, size, outputDir);
      results[idx] = { prompt, ...result };
      if (result.ok) {
        console.log(`[${idx + 1}/${total}] ✅ ${(result.elapsed / 1000).toFixed(1)}s`);
      } else {
        console.log(`[${idx + 1}/${total}] ❌ ${result.error}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));
  return results;
}

async function runBatch(apiKey, prompts, size, concurrency, outputDir, isVariation = false) {
  if (!isVariation) {
    console.log(`\n📦 批量 ${prompts.length} 张\n`);
  }

  const startAll = Date.now();
  const results = await batchGenerate(apiKey, prompts, size, concurrency, outputDir);
  const totalTime = Date.now() - startAll;

  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);

  console.log();

  if (!isVariation) {
    for (const r of results) {
      if (r.ok) {
        const p = r.prompt.length > 30 ? r.prompt.slice(0, 30) + "..." : r.prompt;
        console.log(`🎨 "${p}" ✅ ${(r.elapsed / 1000).toFixed(1)}s ｜ ${r.fileSize}`);
        console.log(`📁 ${r.path}`);
      } else {
        const p = r.prompt.length > 30 ? r.prompt.slice(0, 30) + "..." : r.prompt;
        console.log(`🎨 "${p}" ❌ ${r.error}`);
      }
      console.log();
    }
  }

  console.log(`✅ ${ok.length}/${results.length} ｜ ${(totalTime / 1000).toFixed(1)}s`);
  if (isVariation) {
    ok.forEach((r) => console.log(`📁 ${r.path.split("/").pop()} (${r.fileSize})`));
    fail.forEach((r) => console.log(`❌ ${r.error}`));
  }
  console.log(`📍 ${outputDir}`);
  return fail.length > 0 ? 1 : 0;
}

function printUsage() {
  console.log(`Niu Image Gen — AI Image Generation Tool

CONFIG:
  --get-config                              Show current config (JSON)
  --set-key <key>                           Save API key
  --set-quick-mode --quality Q --ratio R --count N   Save quick mode defaults
  --set-batch-mode --quality Q --ratio R --concurrency N   Save batch mode defaults

GENERATE:
  --prompt "..."  [--quality Q] [--ratio R] [--count N] [--output-dir D]
  --batch <file.json>   [--quality Q] [--ratio R] [--concurrency N]
  --batch-inline "p1" "p2" ...   [--quality Q] [--ratio R] [--concurrency N]

EDIT:
  --edit --image <path> --prompt "..."  [--quality Q] [--ratio R]

Explicit flags override saved config. Without flags, saved mode config is used.

SIZE MATRIX:
  ┌─────────┬────────────┬────────────┬────────────┐
  │         │  square    │ landscape  │  portrait  │
  ├─────────┼────────────┼────────────┼────────────┤
  │   1K    │ 1024×1024  │ 1536×1024  │ 1024×1536  │
  │   2K    │ 2048×2048  │ 2048×1536  │ 1536×2048  │
  │   4K    │ 2880×2880  │ 3840×2160  │ 2160×3840  │
  └─────────┴────────────┴────────────┴────────────┘`);
}

function parseArgs(argv) {
  const args = { prompts: [], flags: {} };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if      (a === "--get-config")                  args.flags.getConfig = true;
    else if (a === "--set-key" && argv[i + 1])      args.flags.setKey = argv[++i];
    else if (a === "--set-quick-mode")               args.flags.setQuickMode = true;
    else if (a === "--set-batch-mode")                args.flags.setBatchMode = true;
    else if (a === "--prompt" && argv[i + 1])         args.prompts.push(argv[++i]);
    else if (a === "--quality" && argv[i + 1])        args.flags.quality = argv[++i];
    else if (a === "--ratio" && argv[i + 1])          args.flags.ratio = argv[++i];
    else if (a === "--count" && argv[i + 1])          args.flags.count = parseInt(argv[++i], 10);
    else if (a === "--output-dir" && argv[i + 1])     args.flags.outputDir = argv[++i];
    else if (a === "--concurrency" && argv[i + 1])    args.flags.concurrency = parseInt(argv[++i], 10);
    else if (a === "--batch" && argv[i + 1])          args.flags.batchFile = argv[++i];
    else if (a === "--batch-inline") {
      i++;
      while (i < argv.length && !argv[i].startsWith("--")) args.prompts.push(argv[i++]);
      args.flags.batchInline = true;
      continue;
    }
    else if (a === "--edit")                             args.flags.edit = true;
    else if (a === "--image" && argv[i + 1])            args.flags.image = argv[++i];
    else if (a === "--help" || a === "-h")              args.flags.help = true;
    i++;
  }
  return args;
}

async function main() {
  const { prompts, flags } = parseArgs(process.argv.slice(2));

  // ── Config commands (no API key needed) ──

  if (flags.getConfig) {
    const cfg = loadConfig();
    console.log(JSON.stringify({
      hasKey: !!cfg?.apiKey,
      keyPreview: cfg?.apiKey ? cfg.apiKey.slice(0, 8) + "..." + cfg.apiKey.slice(-4) : null,
      quickMode: cfg?.quickMode || null,
      batchMode: cfg?.batchMode || null,
    }, null, 2));
    process.exit(0);
  }

  if (flags.setKey) {
    const cfg = loadConfig() || {};
    cfg.apiKey = flags.setKey;
    saveConfig(cfg);
    const preview = flags.setKey.slice(0, 8) + "..." + flags.setKey.slice(-4);
    console.log(`✅ API Key 已保存！\n\n🔑 Key: ${preview}\n🔒 安全存储在本地，不会上传到任何地方`);
    process.exit(0);
  }

  if (flags.setQuickMode) {
    const cfg = loadConfig() || {};
    cfg.quickMode = {
      quality: (flags.quality || cfg.quickMode?.quality || DEFAULTS.quality).toUpperCase(),
      ratio:   (flags.ratio   || cfg.quickMode?.ratio   || DEFAULTS.ratio).toLowerCase(),
      count:   Math.max(1, Math.min(flags.count ?? cfg.quickMode?.count ?? DEFAULTS.count, 4)),
    };
    saveConfig(cfg);
    const q = cfg.quickMode.quality, r = cfg.quickMode.ratio;
    const s = resolveSize(q, r), n = cfg.quickMode.count;
    console.log([
      `✅ 设置完成！你的快速模式配置：`,
      ``,
      `🎨 画质: ${q} ${QUALITY_EMOJI[q] || ""}`,
      `📐 比例: ${RATIO_NAMES[r] || r} (${s})`,
      `🔢 每次: ${n} 张`,
      ``,
      `---`,
      ``,
      `💡 以后 @我 + 描述 → 直接出图，不用再选参数`,
      `⚙️ 随时说「修改配置」可以重新设置`,
      `📦 想一次生多张不同内容？说「批量生成」`,
    ].join("\n"));
    process.exit(0);
  }

  if (flags.setBatchMode) {
    const cfg = loadConfig() || {};
    cfg.batchMode = {
      quality:     (flags.quality     || cfg.batchMode?.quality     || DEFAULTS.quality).toUpperCase(),
      ratio:       (flags.ratio       || cfg.batchMode?.ratio       || DEFAULTS.ratio).toLowerCase(),
      concurrency: Math.max(1, Math.min(flags.concurrency ?? cfg.batchMode?.concurrency ?? DEFAULTS.concurrency, 10)),
    };
    saveConfig(cfg);
    const q = cfg.batchMode.quality, r = cfg.batchMode.ratio;
    const s = resolveSize(q, r), c = cfg.batchMode.concurrency;
    console.log([
      `✅ 批量模式已设置！`,
      ``,
      `🎨 画质: ${q} ${QUALITY_EMOJI[q] || ""}`,
      `📐 比例: ${RATIO_NAMES[r] || r} (${s})`,
      `⚡ 并发: ${c}`,
      ``,
      `💡 说「批量生成」+ 提示词列表即可开始`,
      `⚙️ 随时说「修改配置」可以调整`,
    ].join("\n"));
    process.exit(0);
  }

  if (flags.help || (prompts.length === 0 && !flags.batchFile && !flags.edit)) {
    printUsage();
    process.exit(0);
  }

  // ── Edit command ──

  if (flags.edit) {
    if (!flags.image) { console.error("ERROR: --edit requires --image <path>"); process.exit(1); }
    if (prompts.length === 0) { console.error("ERROR: --edit requires --prompt <text>"); process.exit(1); }

    const apiKey = getApiKey();
    const cfg = loadConfig();
    const qm = cfg?.quickMode;
    const quality = (flags.quality || qm?.quality || DEFAULTS.quality).toUpperCase();
    const ratio = (flags.ratio || qm?.ratio || DEFAULTS.ratio).toLowerCase();
    const size = resolveSize(quality, ratio);
    if (!size) { console.error(`ERROR: Invalid quality="${quality}" or ratio="${ratio}".`); process.exit(1); }
    const outputDir = resolveOutputDir(flags.outputDir);

    const result = await editImage(apiKey, flags.image, prompts[0], size, outputDir);
    if (result.ok) {
      const p = prompts[0].length > 50 ? prompts[0].slice(0, 50) + "..." : prompts[0];
      console.log(`✏️ "${p}"\n\n✅ ${(result.elapsed / 1000).toFixed(1)}s ｜ ${result.fileSize}\n📍 ${result.path}\n🖼️ 原图: ${result.sourceName}`);
    } else {
      console.error(`❌ 编辑失败: ${result.error}`);
      process.exit(1);
    }
    process.exit(0);
  }

  // ── Generation commands (need API key) ──

  const apiKey = getApiKey();
  const cfg = loadConfig();
  const isBatch = !!flags.batchFile || !!flags.batchInline;

  // Parameter resolution: explicit flag → mode config → hardcoded default
  let quality, ratio;
  if (isBatch) {
    const bm = cfg?.batchMode;
    quality = (flags.quality || bm?.quality || DEFAULTS.quality).toUpperCase();
    ratio   = (flags.ratio   || bm?.ratio   || DEFAULTS.ratio).toLowerCase();
  } else {
    const qm = cfg?.quickMode;
    quality = (flags.quality || qm?.quality || DEFAULTS.quality).toUpperCase();
    ratio   = (flags.ratio   || qm?.ratio   || DEFAULTS.ratio).toLowerCase();
  }

  const size = resolveSize(quality, ratio);
  if (!size) {
    console.error(`ERROR: Invalid quality="${quality}" or ratio="${ratio}".`);
    process.exit(1);
  }

  const outputDir = resolveOutputDir(flags.outputDir);

  // Batch from file
  if (flags.batchFile) {
    const bm = cfg?.batchMode;
    const concurrency = Math.max(1, Math.min(flags.concurrency ?? bm?.concurrency ?? DEFAULTS.concurrency, 10));
    const raw = readFileSync(flags.batchFile, "utf-8");
    const parsed = JSON.parse(raw);
    const bp = Array.isArray(parsed) ? parsed : parsed.prompts;
    if (!bp?.length) {
      console.error("ERROR: Batch file must be a JSON array of prompt strings.");
      process.exit(1);
    }
    process.exit(await runBatch(apiKey, bp, size, concurrency, outputDir));
  }

  // Batch inline
  if (flags.batchInline && prompts.length >= 1) {
    const bm = cfg?.batchMode;
    const concurrency = Math.max(1, Math.min(flags.concurrency ?? bm?.concurrency ?? DEFAULTS.concurrency, 10));
    process.exit(await runBatch(apiKey, prompts, size, concurrency, outputDir));
  }

  // Single prompt — resolve count from flag → quickMode config → default
  const prompt = prompts[0];
  const qm = cfg?.quickMode;
  const count = Math.max(1, Math.min(flags.count ?? qm?.count ?? DEFAULTS.count, 4));

  if (count > 1) {
    console.log(`\n🎨 "${prompt}" × ${count}\n`);
    process.exit(await runBatch(apiKey, Array(count).fill(prompt), size, Math.min(count, 4), outputDir, true));
  }

  // Single image
  console.log(`\n🎨 正在生成...\n`);

  const result = await generate(apiKey, prompt, size, outputDir);
  if (result.ok) {
    const p = prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt;
    console.log(`🎨 "${p}"\n\n✅ ${(result.elapsed / 1000).toFixed(1)}s ｜ ${result.fileSize}\n📍 ${result.path}`);
  } else {
    console.error(`❌ 生成失败: ${result.error}`);
    process.exit(1);
  }
}

main();
