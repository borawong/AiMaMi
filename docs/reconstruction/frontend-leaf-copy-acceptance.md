# 前端 leaf 与文案验收状态

本文记录当前仓库对前端 leaf 和全文案验收的真实状态。它不是完成声明，而是防止把静态扫描、key 同步或 draft 清单误报成 100% leaf。

## 当前结论

当前仓库不能证明 macOS / Windows 双平台前端已经达到 100% leaf，也不能证明 `src/locales/zh.json` 和 `src/locales/en.json` 的所有用户可见文案已经逐条对照 raw/internal 原文验收。

`evidence/full-chain/internal/frontend-copy-acceptance.json` 当前已经存在，但状态是 `draft`。它列出 950 个 locale key 的逐条验收槽位，并从 raw dumped 主 bundle 中解析 i18n `zh/en translation` 对象。只有 raw translation 对象里的 key/value 与当前 locale 精确一致时，才把对应语言标成 accepted；不能把全 JS 字符串扫描命中当作文案来源。

## 当前文案验收数字

- `zh` locale key：950
- `en` locale key：950
- draft entries：950
- raw control-flow key 证据：40
- internal key 提及证据：9
- raw 或 internal key 证据：44
- source-sync-only：906
- raw translation 中文 key 证据：573
- raw translation 英文 key 证据：573
- raw translation 中文 key/value 精确一致：293
- raw translation 英文 key/value 精确一致：293
- raw translation 双语 key/value 同时精确一致：272
- raw translation key 存在但当前文案不一致：301
- zhAccepted：293
- enAccepted：293
- 缺少 raw/internal 文案来源：678

## 已有验证

- `scripts/validate-frontend-dumped.mjs` 验证 raw dumped 的 IPC、service wrapper、模块 contract、route、query 和 control-flow 静态覆盖。
- `scripts/validate-frontend-evidence.mjs` 验证 raw control-flow 中出现的 locale key、route registry、page chunk、query key 和若干 owner gate。
- `scripts/validate-i18n.mjs` 验证 `zh/en` key 同步、源码静态 `t("key")` 覆盖，以及明显乱码、问号和占位质量问题。
- `scripts/generate-frontend-copy-acceptance.mjs` 生成全文案验收 draft；它解析 raw i18n translation 对象，不把普通字符串扫描命中当作 accepted。
- `scripts/validate-frontend-leaf-copy-acceptance.mjs` 是严格 gate，当前应继续失败。

## 明确缺口

- `full-leaf-100-gap-audit.json` 顶层 `totals.full_leaf_100` 当前仍为 `false`。
- internal gate-report 中仍存在严格 gate 失败字段。
- Windows bootstrap frontend 文档仍包含 `partial/candidate` 信号，不能在 dim6 acceptance、managed state registry、bootstrap cache 等缺口关闭前移除。
- `frontend-copy-acceptance.json` 仍是 draft，当前只有 272 个 locale key 同时具备 raw translation 中文和英文 key/value 精确来源，剩余 678 个 locale key 仍缺少完整 raw/internal 文案来源。
- `src/restoration/frontend-manifest/index.ts` 仍存在 `source-only`、`boundary-only`、`contract-service-only` 和 `owner-closed` 状态；这些是进度记录，不是 full leaf。

## 严格 gate

`npm run validate:frontend-leaf-copy` 只有在以下条件全部满足时才能通过：

1. `full-leaf-100-gap-audit.json` 的总 gate 和模块 gate 不再存在 blocker。
2. internal 相关 `gate-report.json` 的 `full_leaf_100`、`gate_accepted` 和 `implementation_use` 不再失败。
3. `leaf-ledger-map.json` 覆盖 macOS 和 Windows leaf。
4. raw frontend control-flow 中出现的 locale key 在 `zh/en` 中同步存在。
5. `src/restoration/frontend-manifest/index.ts` 不再存在非 full leaf 状态，或这些状态被明确排除出 100% leaf 验收范围。
6. `evidence/full-chain/internal/frontend-copy-acceptance.json` 达到 `status: "accepted"`，并且每个 locale key 都有 `zhSource`、`enSource`、`zhAccepted: true` 和 `enAccepted: true`。

在这些条件全部满足前，任何文档、提交说明或 PR 说明都不能写“前端 100% leaf 已完成”。
