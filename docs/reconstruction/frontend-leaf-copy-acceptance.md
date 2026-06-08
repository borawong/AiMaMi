# 前端 leaf 与文案验收状态

本文记录当前仓库对前端 leaf 和全文案验收的真实状态。它不是完成声明，而是防止把静态扫描结果误报成 100% leaf。

## 当前结论

当前仓库不能证明 macOS / Windows 双平台前端已经达到 100% leaf，也不能证明 `src/locales/zh.json` 和 `src/locales/en.json` 的所有用户可见文案已经逐条对照 raw/internal 原文验收。

## 已有证据

- `scripts/validate-frontend-dumped.mjs` 验证 raw dumped 的 IPC、service wrapper、模块 contract、route、query 和 control-flow 静态覆盖。
- `scripts/validate-frontend-evidence.mjs` 验证 raw control-flow 中出现的 locale key、route registry、page chunk、query key 和若干 owner gate。
- `scripts/validate-i18n.mjs` 验证 `zh/en` key 同步、源码静态 `t("key")` 覆盖，以及乱码、问号和占位质量问题。
- `evidence/full-chain/internal/leaf-ledger-map.json` 提供 internal leaf 入口索引。
- `evidence/full-chain/internal/data/data/full-leaf-100-gap-audit.json` 提供当前 full leaf gap 状态。
- `evidence/full-chain/internal/audits/audits/**/gate-report.json` 提供各模块 gate 状态。
- `src/restoration/frontend-manifest/index.ts` 记录当前前端 dumped 合同和模块恢复状态。

## 明确缺口

- `evidence/full-chain/internal/data/data/full-leaf-100-gap-audit.json` 顶层 `totals.full_leaf_100` 当前为 `false`。
- internal gate-report 中仍存在 `full_leaf_100=false` 的模块或跨模块 gate。
- 当前没有 `evidence/full-chain/internal/frontend-copy-acceptance.json`，因此无法证明每条 locale 文案都能回指到 raw/internal 原文并已经验收。
- 当前已有脚本只能证明 key 存在和静态合同覆盖，不能证明实际 leaf 行为、渲染状态、交互路径、异常路径、延迟/乱序事件和文案语义完全一致。
- `src/restoration/frontend-manifest/index.ts` 仍存在 `source-only`、`boundary-only`、`contract-service-only` 和 `owner-closed` 状态；这些状态可以作为重建进度记录，但不能计入 100% leaf。

## 严格 gate

`npm run validate:frontend-leaf-copy` 是严格验收 gate。当前它应当失败，直到以下条件都满足：

1. `full-leaf-100-gap-audit.json` 的总 gate 和模块 gate 不再存在 blocker。
2. internal 所有相关 `gate-report.json` 的 `full_leaf_100` 字段均为 `true`。
3. `leaf-ledger-map.json` 覆盖 macOS 和 Windows leaf。
4. raw frontend control-flow 中出现的 locale key 在 `zh/en` 中同步存在。
5. `src/restoration/frontend-manifest/index.ts` 不再存在 `source-only`、`boundary-only`、`contract-service-only` 或 `owner-closed` 这类非 full leaf 状态，或者这些状态被明确从 100% leaf 目标中排除并记录为不验收范围。
6. 新增并通过 `evidence/full-chain/internal/frontend-copy-acceptance.json`，逐条记录 locale key、中文来源、英文来源和验收状态。

在这些条件全部满足前，任何文档、提交说明或 PR 说明都不能写“前端 100% leaf 已完成”。
