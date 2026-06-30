---
name: "niu-image-gen"
description: "Generate images using the Niu Image Gen plugin. Trigger when the user wants to create, draw, or generate images via Niu Image Gen, wants batch image generation, or needs AI-generated images saved to disk. Do not use for editing existing images, the built-in image_gen tool, or SVG/vector work."
---

# Niu Image Gen 🎨

AI image generation with persistent config, zero-confirmation quick mode, and batch mode.

## Script location

```
SCRIPT="$HOME/plugins/niu-image-gen/scripts/generate.mjs"
```

---

## 🔴 输出规则（最高优先级，所有 Branch 都必须遵守）

1. **脚本输出 = 最终展示内容**：运行脚本后，将脚本的 stdout 输出**原样展示**给用户。不要改写、省略、翻译、合并或重新组织脚本的输出。
2. **交互提示 = 原样输出**：本文件中所有 `「📋 原样输出」` 标记后面的引用块（`>` 开头），必须**逐字输出**给用户，包括所有 emoji、表格、分隔线。不得用自己的话重新表述。
3. **禁止纯文本降级**：不要去掉 emoji，不要把表格改成逗号列表，不要把多行合并成一行。

---

## ⚠️ ENTRY LOGIC — ALWAYS START HERE

**Every time this skill is triggered, run this first:**

```bash
node "$SCRIPT" --get-config
```

The output is JSON:

```json
{
  "hasKey": true,
  "keyPreview": "sk-1aa1...aa4d",
  "quickMode": { "quality": "2K", "ratio": "square", "count": 1 },
  "batchMode": { "quality": "2K", "ratio": "landscape", "concurrency": 3 }
}
```

Fields can be `null` if not yet configured.

**Decision tree — pick the FIRST matching rule, top to bottom:**

| # | Condition | Go to |
|---|-----------|-------|
| 1 | `hasKey` is `false` | → **Branch A**: First-time Wizard |
| 2 | `hasKey` is `true` AND `quickMode` is `null` | → **Branch A2**: Quick Mode Setup |
| 3 | User intent is to modify config (keywords: 修改配置、设置、更改参数、配置、settings) | → **Branch C**: Modify Config |
| 4 | User intent is batch generation (keywords: 批量、batch) | → **Branch D**: Batch Mode |
| 5 | `quickMode` exists AND user message contains a prompt | → **Branch B**: Quick Mode |
| 6 | `quickMode` exists AND user message has no clear prompt | → **Branch E**: Help |

**IMPORTANT**: Rules are ORDERED. Rule 3 beats Rule 5 — if the user says "修改配置", go to Branch C even though quickMode exists. Rule 4 beats Rule 5 — "批量生成猫" goes to Branch D, not Branch B.

---

## Branch A: 🆕 First-time Wizard

The user has never configured the plugin. Walk them through everything.

### W1: Welcome + API Key 🔑

「📋 原样输出」

> 👋 欢迎使用 **Niu Image Gen**！首次使用需要快速设置一下
>
> 整个过程只需 30 秒，之后每次 @我 + 描述就直接出图 ⚡
>
> ---
>
> 🔑 **第一步：请提供你的 API Key**
>
> 把你的 Key 粘贴给我，我会安全保存在本地，不会上传到任何地方 🔒

When the user provides their key, run:

```bash
node "$SCRIPT" --set-key <USER_KEY>
```

**直接展示脚本输出，不要改写。** 脚本会输出格式化的确认信息。

Then proceed to **W2** below (same as Branch A2).

---

## Branch A2: ⚡ Quick Mode Setup

Used when:
- Continuing from Branch A after key is saved
- hasKey is true but quickMode is null (key set manually but wizard never completed)

### W2: Choose Quality 🎨

「📋 原样输出」

> ⚡ **第二步：设置快速模式** — 以后 @我 + 描述就按这个配置直接出图！
>
> 🎨 选择默认 **画质**：
>
> | 选项 | 分辨率 | 速度 | 适合场景 |
> |------|--------|------|----------|
> | **1K** 🚀 | ~1百万像素 | ~12s | 草稿、缩略图 |
> | **2K** ✨ _(推荐)_ | ~4百万像素 | ~20s | 日常使用 |
> | **4K** 💎 | ~8百万像素 | ~28s | 高清大图、印刷 |

Wait for user to choose.

### W3: Choose Ratio 📐

「📋 原样输出」

> 📐 选择默认 **比例**：
>
> | 选项 | 比例 | 1K | 2K | 4K |
> |------|------|-----|-----|-----|
> | ⬜ **正方形** | 1:1 | 1024×1024 | 2048×2048 | 2880×2880 |
> | 🖼️ **横版** | 3:2 | 1536×1024 | 2048×1536 | 3840×2160 |
> | 📱 **竖版** | 2:3 | 1024×1536 | 1536×2048 | 2160×3840 |

Wait for user to choose.

### W4: Choose Count 🔢

「📋 原样输出」

> 🔢 每次默认生成 **几张**？（1~4 张）
>
> 多张 = 同一描述生成不同变体，选 1 张最快 ⚡

Wait for user to choose (default 1).

### W5: Save Config 💾

Run:

```bash
node "$SCRIPT" --set-quick-mode --quality <Q> --ratio <R> --count <N>
```

Where `<Q>` is 1K/2K/4K, `<R>` is square/landscape/portrait, `<N>` is 1-4.

**直接展示脚本输出，不要改写。** 脚本会输出完整的确认信息，包含配置摘要、使用提示和批量模式提醒。

### W6: Handle original request (if applicable)

After wizard completes, check the user's **original trigger message** and route correctly:

- **Contains batch keywords (批量/batch)** → Tell user: "✅ 快速模式设置完了！你刚才提到了批量生成，需要我帮你设置一下批量模式吗？" → If yes, go to **Branch D** (batch setup + collect prompts).
- **Contains a single image prompt** (e.g., "画一只猫") → Execute it via **Branch B** (quick mode). The user shouldn't need to repeat themselves.
- **Purely about setup** (e.g., "帮我设置"/"配置一下") → Stop here, wait for next message.

**Do NOT blindly route everything to Branch B.** Batch intent must go to Branch D.

---

## Branch B: ⚡ Quick Mode (Daily Use)

**This is the zero-confirmation fast path. Do NOT ask the user to confirm or re-select parameters.**

1. Extract the image prompt from the user's message.

2. Check: does the user's message explicitly mention a quality or ratio?
   - "1K" → `--quality 1K`
   - "2K" → `--quality 2K`
   - "4K" → `--quality 4K`
   - "正方形" / "square" → `--ratio square`
   - "横版" / "landscape" → `--ratio landscape`
   - "竖版" / "portrait" → `--ratio portrait`
   - No mention → omit these flags (script uses saved quickMode config)

3. Run:

```bash
node "$SCRIPT" --prompt "<extracted prompt>" [--quality Q] [--ratio R]
```

Only pass `--quality` / `--ratio` if the user explicitly requested them. Otherwise the script reads the saved quickMode config automatically.

4. **直接展示脚本输出，不要改写。** 脚本会输出包含文件名、大小、耗时的格式化结果。

**Do NOT** add a "需要调整参数吗?" prompt at the end of every generation. Keep it clean. The user knows they can say "修改配置" if needed.

---

## Branch C: ⚙️ Modify Config

The user wants to change settings. First run `--get-config` if not already done this turn.

「📋 原样输出」（用 `--get-config` 的数据填充 [占位符]）

> ⚙️ **当前配置：**
>
> | 模式 | 画质 | 比例 | 参数 |
> |------|------|------|------|
> | ⚡ 快速模式 | [Q] | [R] | 每次 [N] 张 |
> | 📦 批量模式 | [Q or 未设置] | [R or —] | 并发 [N or —] |
> | 🔑 API Key | [preview] | | |
>
> 要修改哪个？
>
> 1️⃣ ⚡ 快速模式
>
> 2️⃣ 📦 批量模式
>
> 3️⃣ 🔑 API Key

Based on user choice:

- **1️⃣ Quick Mode**: Run W2 → W3 → W4 → W5 from Branch A2. This overwrites the existing quickMode config.
- **2️⃣ Batch Mode**: Run the batch setup flow from Branch D (first-time section). This overwrites or creates batchMode config.
- **3️⃣ API Key**: Ask for new key, run `--set-key <NEW_KEY>`. **直接展示脚本输出。**

After saving, the script output already includes confirmation — do not add extra summary.

---

## Branch D: 📦 Batch Mode

Batch mode = multiple different prompts, parallel generation.

### Step 1: Check batch config

Run `--get-config` (if not already done). Check the `batchMode` field.

**If `batchMode` is `null` (never configured):**

「📋 原样输出」

> 📦 **批量模式 — 先快速设置默认参数** ⚡

Then walk through:

**D-W1: Quality** — 「📋 原样输出」same table as W2 in Branch A2, wait for choice.

**D-W2: Ratio** — 「📋 原样输出」same table as W3 in Branch A2, wait for choice.

**D-W3: Concurrency**

「📋 原样输出」

> ⚡ 选择 **并行数**（1~10，默认 3）
>
> 数字越大越快，但可能触发 API 限流
>
> | 并行数 | 适合场景 |
> |--------|----------|
> | 1~2 | 稳定优先 🛡️ |
> | 3 _(推荐)_ | 速度与稳定平衡 ⚖️ |
> | 5~10 | 大批量快速出图 🚀 |

**D-W4: Save**

```bash
node "$SCRIPT" --set-batch-mode --quality <Q> --ratio <R> --concurrency <N>
```

**直接展示脚本输出，不要改写。** 脚本会输出完整的确认信息。

Then continue to Step 2 below.

**If `batchMode` already configured:**

Skip setup, go directly to Step 2.

### Step 2: Collect prompts 📝

First check: did the user's trigger message **already contain prompts**?

- "批量生成 赛博猫、水墨山水、太空狗" → prompts already provided (split by 、/，/逗号/换行). **Skip to Step 3** with these prompts.
- "批量生成" (no prompts) → ask user to provide:

「📋 原样输出」

> 📝 **请提供 prompt 列表：**
>
> 📌 方式一：每行一个 prompt，写完后说「**开始**」
>
> 📌 方式二：提供一个 JSON 文件路径（内容为 prompt 字符串数组）

Wait for user to provide prompts.

### Step 3: Confirm

「📋 原样输出」（用实际值填充 [占位符]）

> 📦 **批量生成确认：**
>
> | 项目 | 值 |
> |------|----|
> | 📝 Prompt 数量 | [N] 条 |
> | 🎨 画质 | [Q] |
> | 📐 比例 | [R] ([WxH]) |
> | ⚡ 并发 | [C] |
> | 📁 输出 | ~/Pictures/niu-image-gen/ |
>
> ✅ 确认开始？

**Batch mode DOES require confirmation** (unlike quick mode), because it involves multiple images and longer execution time.

If user says **no** or wants to adjust:
- "调整参数" / "改一下" → ask which parameter to change (quality/ratio/concurrency), update only that parameter, re-show confirmation.
- "修改 prompt" / "换一下" → go back to Step 2.
- "取消" / "不了" → abort and return to waiting state.

### Step 4: Execute

**Inline prompts:**

```bash
node "$SCRIPT" --batch-inline "<p1>" "<p2>" "<p3>" [--quality Q --ratio R --concurrency N]
```

Only pass explicit flags if user overrode parameters during this session. Otherwise the script uses saved batchMode config.

**File prompts:**

```bash
node "$SCRIPT" --batch <file.json> [--quality Q --ratio R --concurrency N]
```

### Step 5: Report

**直接展示脚本输出，不要改写。** 脚本会输出包含成功/失败数、耗时、文件列表的格式化结果。

If any failed, offer to retry the failed ones.

---

## Branch E: 💡 Help

User @ the plugin but didn't give a prompt or a command.

「📋 原样输出」（用 `--get-config` 的数据填充 [Q] [R] [N]）

> 🎨 **Niu Image Gen — 使用指南**
>
> ⚡ **生成图片**：@我 + 图片描述（例：一只赛博朋克风格的猫）
>
> 📦 **批量生成**：跟我说「批量生成」
>
> ⚙️ **修改配置**：跟我说「修改配置」
>
> 📊 **当前快速模式**：[Q] [R] ×[N]

---

## Parameter override rules

These rules apply to ALL branches:

1. **Explicit flags override saved config**: if user says "4K横版画一只猫", pass `--quality 4K --ratio landscape`. The script prioritizes explicit flags over saved config.
2. **Saved config overrides hardcoded defaults**: when no explicit flags, the script reads quickMode or batchMode config. Only if those are also absent does it use hardcoded defaults (2K, square).
3. **Quick mode and batch mode configs are independent**: changing one does not affect the other.

## Error handling

| Error | Action |
|-------|--------|
| 503 "No available compatible accounts" | Wait 30s, retry once. If still fails, tell user the API is temporarily busy. |
| 400 with size error | Fall back to closest valid size and retry. |
| Timeout (120s) | Report and offer to retry. |
| Missing API key | Guide through `--set-key` setup (Branch A W1). |

## Hard constraints

- API base URL (`https://api.iiiiitoken.com/v1/images/generations`) and model (`gpt-image-2-x`) are hardcoded. **Never change them.**
- **Never display the user's full API key in chat.**
- Maximum batch size: 20 prompts per run.
- Maximum concurrency: 10.
- Maximum count (quick mode): 4.
- Pixel budget: ≤8,294,400 px. Longest edge ≤3,840. Dimensions divisible by 16.
