# Reverse Consumer Gate Spec

本文件定义逆向生产者给实现消费者的三档消费 gate。它只升级共享规约，不改任何业务 bundle 的 leaf 结论。

## 总原则

- `full_leaf_100_definition_v2` 继续保留，但只服务最高 strict gate 和 `100% leaf` 口径，不再阻塞所有实现开工。
- 消费 gate 只有三档：`consumerStartReady`、`strictImplementationUse`、`readyToImplement`。
- 不新增第四档；`productDecisionStartReady` 只写作 `consumerStartReady.startMode = "product_decision"`。
- `strictParityReady` 只是证据字段，不是消费队列档位。
- Unknown 必须显式分类为 `blocks_start`、`accepted_unknown` 或 `product_decision`。
- macOS/Windows 独立闭合；Windows 不能用 macOS 外推。

## Gate 1: consumerStartReady

含义：实现消费者可以开始编码，但不能宣称 upstream 100% 等价。

必须满足：

- `renderSurfaceReady`：原始 upstream 页面、弹窗、菜单、状态机、渲染结构已记录；source archive 自研优化和 upstream baseline 已区分。
- `uiCallEntryReady`：按钮、菜单、handler、wrapper、invoke command、参数来源明确。
- `dtoBoundaryReady`：required/optional/null/empty/default/omitted 语义明确。
- `happyPathReady`：UI -> invoke -> backend owner -> core/helper 主路径明确。
- `boundaryPathReady`：not found/conflict/permission/parse/timeout/partial success/rollback 等边界明确，或被产品接受为 Unknown。
- `sideEffectReady`：文件、registry/config、HTTP、process、monitor、persistence 副作用明确。
- `frontendConsumptionReady`：toast、loading、disabled、dialog close、query invalidation、展示字段明确。
- `acceptanceDraftReady`：至少有主路径和高风险异常的 unit/E2E/manual 验收草案。
- `platformScopeDeclared`：明确 macOS confirmed/Windows confirmed/Windows Unknown/product decision。

允许实现模式：

- `startMode = "reverse_guided"`：证据足够指导实现，但仍有非关键 strict gap。
- `startMode = "product_decision"`：明确由 source archive 产品决策承担差异，必须记录 `productDecisionsRequired` 和 `sourceSurfaceDelta`。

禁止：

- 不得写 `implementation_use=true`。
- 不得宣称 upstream strict parity。
- 不得关闭 `forbiddenUntilStrictImplementationUse` 或 `forbiddenUntilReady`。

## Gate 2: strictImplementationUse

含义：上游行为合同足够完整，可按 upstream 行为严格实现，但不一定进入最高 ready 队列。

必须满足：

- `consumerStartReady` 全部满足。
- upstream render surface/behavior contract/DTO/boundary/side-effect/frontend consumption 均已闭合。
- backend owner/IDA decompile/callee-xref 至少达到可实现叶子级。
- 复杂功能允许不逐行源码级还原，但必须能解释边界行为。
- Unknown 不影响实现行为，只能是非关键内部细节。

允许实现模式：

- 可写 `strictImplementationUse=true`。
- 可写 `consumerUse=true`。
- 可进入 `strictImplementationUse[]` 队列。

禁止：

- 不满足 `full_leaf_100_definition_v2` 六维门时，不得写 `readyToImplement=true`。
- 不得把 `strictParityReady=false` 的 leaf 说成 upstream 100% 等价。

## DIM1-6 正式定义 {#dim-definitions-v1}

`full_leaf_100_definition_v2` 六维门的正式编号定义（canonical source：本节；OUTPUT-SPEC.md §full_leaf_100_definition_v2 和 CONSUMER-GATE-SCHEMA.md 均交叉引用本节，不独立维护定义）：

| 编号 | 名称 | 含义 |
|---|---|---|
| **dim1** | 前端 CCF（frontend control-flow + UI/state） | 真实 UI 触发、guard/preflight、invoke wrapper、参数组装和终端 `invoke("<command>")`，或明示接受的同平台 native callback/helper 替代路径；含具体 component/route/menu owner、state/store mutation、可见 UX 状态和 frontend guard/default 行为 |
| **dim2** | 后端 owner + pseudocode | 同版本同平台真实 owner、非失败 IDA decompile pseudocode、source binary SHA、核心分支和状态语义 |
| **dim3** | call-tree（后端调用树深到 implementation leaves） | 从 command/owner 到 core/leaf 的完整调用树；不得只到 command wrapper；必须追到 fs/http/registry/process/sidecar/persistence/response/error 等可实现叶子 |
| **dim4** | interface / DTO / error envelope / side-effect boundary | 入参、出参、默认值、错误封装、副作用边界和前端消费字段闭合 |
| **dim5** | 同平台 platform gate | macOS 与 Windows 独立闭合；Windows 必须有同版本同平台 evidence 且必须输出相对 macOS 的 platform 差异；禁止用 macOS 证据外推 Windows |
| **dim6** | test / acceptance mapping | 每个 leaf 必须映射到 source archive 实现验收、单测/E2E/人工验收或明确不可自动化的接受条件；**dim6 是 source archive 实现侧的验收工作**，不是逆向生产者的工作，但 gate 要求逆向侧提供足够的 contract/DTO/behavior basis 以便实现侧能写出验收条件 |

上表是唯一 source-of-truth；所有 dim1-6 引用均指本节编号。

## Gate 3: readyToImplement

含义：最高放行档；简单、低风险、闭合 leaf 可直接进入消费者实现队列。

必须满足：

- `strictImplementationUse=true`。
- `full_leaf_100_definition_v2` 六维门闭合（dim1-dim6 均满足，见 §DIM1-6 正式定义），或被本规约明确允许的等价 strict accepted substitute 闭合。
- acceptance mapping 已执行或被明确接受。
- task-plan 允许进入 `readyToImplement[]`。

允许：

- 可写 `readyToImplement=true`。
- 可写 `implementation_use=true`/`gate_accepted=true`。
- 可进入 `readyToImplement[]` 队列。

## Unknown 分类

| 分类 | 含义 | Gate 影响 |
|---|---|---|
| `blocks_start` | 影响 UI/DTO/主路径/副作用/平台安全，无法开始实现 | `consumerStartReady=false` |
| `accepted_unknown` | 不影响实现行为，已记录为非关键内部细节 | 可进入 `consumerStartReady` 或 `strictImplementationUse`，不得单独提升 `readyToImplement` |
| `product_decision` | source archive 明确接受与 upstream 的差异或缺口 | 可作为 `consumerStartReady.startMode="product_decision"`，不得伪装成 upstream proof |

## 平台策略

- `platformPolicy.windowsIndependent=true`。
- `platformPolicy.doNotInferWindowsFromMacOS=true`。
- macOS-only outtake 必须写明 `platformScopeDeclared = "macOS confirmed; Windows Unknown"` 或等价字段。
- Windows-only diagnostic 不得关闭 macOS gate，macOS evidence 也不得关闭 Windows gate。

## 模块升级策略

- Windows 端差异优先做到 `consumerStartReady`，避免 implementation 端没有平台边界输入。
- accounts -> plugins deep -> relay targeted -> system -> tray 仍按队列顺序推进。
- 除 Windows 端差异外，优先做到 `strictImplementationUse`。
- 简单、低风险、证据完全闭合的 leaf 再补到 `readyToImplement`。
- relay 等复杂功能逆不出完整 terminal transport 时，可以走 `consumerStartReady + startMode=product_decision`，但必须显式 `strictImplementationUse=false`、`readyToImplement=false`、
ot_upstream_strict_parity`。

## 迁移规则

- 既有 `readyToImplement=[]` 不自动升级。
- 既有 `implementation_use=false`/`gate_accepted=false`/`full_leaf_100=false` 不自动升级。
- 既有 functional-parity 包可作为 `consumerStartReady` 输入，但必须补 render surface/boundary/acceptance draft 后才可进入 consumer queue。
- 生产者 bundle 的实际迁移由生产者执行；协调者只提供 schema、规则、迁移清单。

## NO_VERSION_SPAN_PATH_COMPONENTS_V1

raw/intermediate/source archive 新产物路径的任何目录组件都禁止包含双版本跨度，例如 `1.0.8-to-1.0.9`、`108-to-109`、`1.0.8_1.0.9` 或 `from-1.0.8-to-1.0.9`。diff/migration/reducer 产物必须归入唯一 target version 目录，例如 `.../aimami/1.0.9/...`；语义用稳定 bundle/file 名表达。发现违规路径时，必须先清理或改名到 target version 目录后再继续。

## IMPLEMENTED_CHECKPOINT_RELATIONSHIP_V1 {#implemented-checkpoint-relationship}

`implemented-checkpoint` 是 Claude 复核层（`reviews/CLAUDE.md`）内部使用的标记，用于列出当前复核轮次内**已明确闭合**的 leaf 和 owner scope，以便后续 AI 知道哪些条目已经过本轮复核确认。

**与 gate 档的关系**：

| 事项 | 规则 |
|---|---|
| `implemented-checkpoint` 不等同于任何 gate 档 | 有 `implemented-checkpoint` 标记的 leaf **不自动进入** `consumerStartReady`、`strictImplementationUse` 或 `readyToImplement` 队列 |
| task-plan 三档队列放行依据 | 只能是 gate 档字段（`consumerStartReady=true`、`strictImplementationUse=true`、`readyToImplement=true`）及对应六维门；`implemented-checkpoint` 不作为放行依据 |
| 允许使用的位置 | 只允许写在 `reviews/CLAUDE.md`（Claude 独立复核文件）内；不得出现在 `gate-report.json`、`manifest.json`、`data/task-plan.json` 或 `AI.md` 的 gate 字段 |
| 使用时的注释要求 | 每个 `implemented-checkpoint` 条目必须注明：(a) 对应的 gate 档（`consumerStartReady` / `strictImplementationUse` / `readyToImplement`）；(b) 已闭合的维度（dim1-dim6）；(c) 尚未闭合的维度或 Unknown |
| 范围限制 | 不得扩大到同模块其他 leaf、后台 helper、其他平台或 full-app；范围外的 leaf 保持 `diagnostic-only` / `implementation-blocked: reverse-gap` |

详见 `CLAUDE.md §Leaf-chain 复核口径`（交叉引用本节）。

## 生产者写回边界

- 生产者写 `task-plan.json` 前必须读取 `AI-EXECUTION-QUEUE.md` 顶部 Consumer Intake 表。
- 命中 `status=pending` 且 `priority=P0` 的条目时，2 个工作日内 ack 或 reject。
- `reject` 必须写 block 类型和解除条件。
- `ack` 只是接受排期，不代表 gate 已完成。
- P0 可推高排期，但不得绕过任何 gate 维度，不得降低证据质量。

## PREWRITE_PRODUCER_COLLISION_GATE_V1 {#prewrite-canonical}

> **本节为 PREWRITE_PRODUCER_COLLISION_GATE_V1 canonical 全文**（含 `runtime/` 路径）。`AGENTS.md`、`CLAUDE.md` 和 SKILL.md 红线 11 的对应节均为本节摘要与引用；所有 producer collision gate 的权威定义、owner 上下文清单、碰撞解决流程、takeover sensitive-field 规则均见本节，不在其他文件重复维护。

写入 `<source-location>` 下 `raw/`、`intermediate/`、`<source-location>/`、`upstream/`、`runtime/`、`current-main/` 等共享证据或结论前，必须在同一轮、写入之前重新读取以下 owner 上下文；缺任一项即禁止写：

- 当前 skill/role 文件；
- source archive root `AGENTS.md` + `CLAUDE.md`；
- 目标路径从 root 到最近目录的每一层 `AGENTS.md` + `CLAUDE.md`；
- `<source-location>/AGENTS.md` 和 `<source-location>/GATE-SPEC.md`；
- `AI-EXECUTION-QUEUE.md`；
- root `task-plan.json`；
- `INDEX.jsonl` 最新相关命中；
- 目标 bundle 的 `manifest`、`gate-report`、`task-plan`、pointers；
- raw/intermediate handoff manifest。

写入前必须输出 owner matrix：target path、canonical scope、current producer、machine/agent/session、source index lines、source task-plan/bundle、allowed write mode、collision status、takeover sensitive-field status。

只要 `INDEX.jsonl`、`task-plan.json` 或 manifest 显示已有 producer 或 active session，默认 read-only；只允许写自己的 review/outtake，不允许覆盖 canonical。覆盖 canonical、接管 owner 或重分配 owner 必须有用户显式 sensitive-field：`EXPLICIT_TAKEOVER`、`EXPLICIT_OVERWRITE_CANONICAL`、`EXPLICIT_REASSIGN_OWNER`，并写入 manifest/gate-report。

禁止用”全量覆盖””旧文件没用””重跑更快””本机路径不同””只改文档”绕过 owner gate。如果目标路径没有 `AGENTS.md` + `CLAUDE.md` 双入口，先停，不能写业务产物；补规则入口本身可以作为本 gate 的窄例外。`README.md`/`AI.md` 不是协作双入口，不能替代 `AGENTS.md`/`CLAUDE.md` 的硬规则。

IDB comments、local runtime probes、local notes 不能改变共享 gate 或 owner。gate 提升只能由目标 canonical producer 或显式接管后的 producer 写入。
