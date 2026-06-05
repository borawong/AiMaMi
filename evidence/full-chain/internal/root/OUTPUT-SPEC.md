# Reverse 输出规范

`<source-location>/` 的目标是让逆向结果可复核、可继续、可给人读、可据此写代码，而不是堆 raw 产物。

## 分层原则（OneDrive 同步 vs source archive 共享）

逆向产物按读者和体积分两层存放，边界不可混：

- **`<source-location>/`（OneDrive 同步，不进 git）= 结论 + 写代码依据**：放 `README.md` / `AI.md` / `SYSTEM-DIFF.md`（结论）、`logic/`（实现/复刻代码的直接依据，纯文本）、`reviews/`（CC + Codex 交叉复核）、`pointers/`（外部 evidence 指针）、`manifest.json`。整个 `<source-location>/` 靠 OneDrive 在 CC 与 Codex 之间同步、共享读写，**被根 `.gitignore` 完全排除出 git**（仅 `internal/CLAUDE.md` + `internal/AGENTS.md` 进 git）。
- **source archive 共享（`<source-location>`；Windows 无特例 canonical root）= upstream/source/extracted 对象 + raw/intermediate 证据**：根级 upstream 必须放在 `<source-location>/upstream/<product>/<version>/...`；raw/intermediate 权威根分别是 `<source-location>/raw` 和 `<source-location>/intermediate`。pseudocode `.c`、call-tree `jsonl`、binary dump、反汇编、frontend dump、Ghidra project、截图、运行日志等只走共享根。`SOURCE_ARCHIVE_SHARE_ROOT` 是唯一机器相关配置，各机器只在本机 shell/profile 中设置挂载点，结论包和 `pointers/` 只能写 `<source-location>` 相对路径。**只经 `pointers/` 的 env 相对外部路径引用，既不进 OneDrive 的 `internal/`、更不进 git。**
- **Binary SOT = `<source-location>/source-binary/`**：所有 source archive / AiMaMi 版本和平台的 binary 发现都从此目录开始；新版本 binary 先放这里，再允许复制到 raw/intermediate/Ghidra/extraction 工作区。任何派生副本都必须回写 source SHA-256/size，不能覆盖此 SOT。

一句话：**binary SOT 走 `<source-location>/source-binary/`；结论和写代码依据走 `<source-location>/source archive` 结论区（CC/Codex 共享读，不进 git），upstream/source/extracted 对象走根级 `<source-location>/upstream`，raw/intermediate 证据走 `<source-location>/raw` / `<source-location>/intermediate`；禁止硬编码机器本地卷、旧临时目录或 SSH 同伴路径。`<local-path>

raw 写入顺序固定为：先在 `<source-location>/raw/<product>/<version>/<platform>/...` 或 `intermediate/...` 生成证据，再追加唯一 canonical `<source-location>/INDEX.jsonl`，最后写 OneDrive 结论和 `pointers/`。`INDEX.jsonl` 是 append-only 单文件索引；禁止新增或继续写 `INDEX.json`、`INDEX.<machine>.jsonl`、`INDEX.*.local.jsonl` 等机器分片。读取 raw 时只读 `INDEX.jsonl`，按 `path` 最新 `produced_at`、`sha`、`size` 校验。历史分片合并必须使用 `scripts/merge_reverse_index.py` 或等价流程：先 dry-run 统计、append 缺失记录到 `INDEX.jsonl`、复读 canonical 校验分片记录条数不丢，再立即删除已合并分片。

## 同目录共读共写（CC + Codex 交叉核对）

同一 bundle 目录由 Claude（CC）与 Codex 共读共写，二者对同一份证据各自独立复核，再交叉核对：

- `reviews/CLAUDE.md`（CC 复核）、`reviews/AGENT.md`（Codex 复核）、`reviews/CROSS-REVIEW.md`（冲突/采纳/驳回/Unknown）。
- 两份复核的口径、字段、证据指针必须一致，以便逐条交叉核对；不一致处进 `CROSS-REVIEW.md`。

## 标准产物

每个新冻结包必须在包根放三份最终文件：

| 文件 | 读者 | 内容 |
|---|---|---|
| `README.md` | 人 | 最终结论、范围、证据指针、缺口、行动/不行动项 |
| `AI.md` | AI | 可继续执行的结构化状态、target universe、queue、coverage、脚本入口 |
| `SYSTEM-DIFF.md` | 人 + AI | frontend/backend/plugin/capability/OTA/platform 差异 |

## 消费 Gate 输出

共享 gate 以 [GATE-SPEC.md](./GATE-SPEC.md) 和 [CONSUMER-GATE-SCHEMA.md](./CONSUMER-GATE-SCHEMA.md) 为准。新 `task-plan.json` 必须使用三档队列：

```json
{
  "schema": "restoration.cm.reverse.task_plan.consumer_gate.v1",
  "readyToImplement": [],
  "strictImplementationUse": [],
  "consumerStartReady": [],
  "reverseRequiredQueues": {
    "forbiddenUntilReady": [],
    "forbiddenUntilStrictImplementationUse": [],
    "consumerStartBlocked": []
  },
  "platformPolicy": {
    "windowsIndependent": true,
    "doNotInferWindowsFromMacOS": true
  }
}
```

三档含义：

- `consumerStartReady`：实现消费者可以开始编码，但不得宣称 upstream 100% 等价。
- `strictImplementationUse`：上游行为合同足够完整，可按 upstream 行为严格实现。
- `readyToImplement`：最高放行档，必须满足 strict gate 与 `full_leaf_100_definition_v2` 或明确 accepted substitute。

旧 `readyToImplement=[]`、`implementation_use=false`、`gate_accepted=false`、`full_leaf_100=false` 不自动升级；旧 functional-parity 包可以作为 `consumerStartReady` 输入，但必须补 render surface / boundary / acceptance draft 后才可进入 consumer queue。

## 结果完整性硬要求

每个 target / command / endpoint 的最终结论必须覆盖以下结果维度。缺 start gate 关键维度时，不得写 `consumerStartReady=true`；缺 strict gate 时，不得写 `strictImplementationUse=true`；缺 highest gate 时，不得写 `readyToImplement=true`、`gate_accepted=true` 或 `implementation_use=true`。缺口必须在 `Unknown / Missing`、`AI.md unknowns` 和对应 review 中标成 `SOT missing` / `blocked` / `candidate-only`。

所有原始上游功能的最高 ready 依据必须以 AiMaMi 1.0.8 的 `full_leaf_100_definition_v2` 为准；1.0.1 / 1.0.6 只能作为历史差异、回归/迁移参考或补充证据，不能替代 1.0.8 baseline。任何版本、模块或平台缺少前端控制流、后端 owner/pseudocode、深层 call-tree、interface/error/side-effect boundary、same-platform gate 或 test/acceptance mapping 时，必须降级为 
eeds-work` / `reverse-required` / `implementation_use=false`，不得写 `readyToImplement=true` 或进入最高 ready 队列。

### full_leaf_100_definition_v2

只有逐 leaf 同时闭合以下六项，才允许写 `full leaf 100`、`implementation-ready` 或作为 source archive 原始上游行为实现依据（六维编号 dim1-dim6 的 canonical 定义见 `GATE-SPEC.md §DIM1-6 正式定义`）：

1. **dim1** — 前端 control-flow + UI/state：真实 UI 触发、guard/preflight、invoke wrapper、参数组装和终端 `invoke("<command>")`，或明示接受的同平台 native callback / helper 替代路径。
2. **dim2** — 后端 owner + pseudocode：同版本同平台 owner、非失败 pseudocode、source binary SHA、核心分支和状态语义。
3. **dim3** — 后端 call-tree 深到 implementation leaves：不得只到 command wrapper；必须追到 fs/http/registry/process/sidecar/persistence/response/error 等可实现叶子。
4. **dim4** — interface / DTO / error envelope / side-effect boundary：入参、出参、默认值、错误封装、副作用边界和前端消费字段闭合。
5. **dim5** — 同平台 platform gate：macOS 与 Windows 独立闭合；Windows 必须有同版本同平台 evidence，且必须输出相对 macOS 的 platform 差异，供源码级平台差异实现使用，禁止用 macOS 证据外推 Windows。
6. **dim6** — test / acceptance mapping：每个 leaf 都要映射到 source archive 验收、单测/E2E/人工验收或明确不可自动化的接受条件。

历史包中的 `102/102`、`79/79`、`146/146` 等数字只能保留为 evidence coverage count。缺 test/acceptance mapping、深层 implementation leaf、同平台 gate 或 plugin 内部 owner/store proof 时，必须降级为 `pre_acceptance_evidence_pack` / 
eeds_test_acceptance_mapping` / `blocked`，不得写成实现可用。

plugins 模块额外硬要求：`toggle_plugin` 不能只凭 command wrapper pseudocode 视为 100%。必须深解 `PluginRegistry::set_enabled`、持久化 store、两个内置插件字段、strict DTO parity、config UI absence / web-tools side channel；未闭合前 plugins 模块整体不得声明全 leaf 100，不得作为 source archive 原始插件行为实现输入。

### plugins 1.0.8 最小逆向任务

AiMaMi 1.0.8 macOS plugins 模块当前状态固定为 `blocked` for `full_leaf_100` / original upstream implementation；包状态仍是 `pre_acceptance_evidence_pack`。已有证据只能说明：list/toggle/get_config/update_config（`list_plugins` / `toggle_plugin` / `get_plugin_config` / `update_plugin_config`）的 frontend CCF / UI wrapper 证据存在，四个 backend command wrapper pseudocode 存在，`PluginsPage` 只使用 `list_plugins` / `toggle_plugin`，config UI calls 缺失，`web-tools` side-channel audit 不是 full leaf proof。

解除阻断前必须闭合：

- `PluginRegistry::set_enabled`、`save_store_static`、`PluginRegistry::list`、`PluginRegistry::get_config`、`PluginRegistry::update_settings` 的同版本同平台 owner、pseudocode 和深层 call-tree。
- `plugins.json`、`PluginStoreSchema { schemaVersion, plugins }`、序列化/写入、poisoned-lock error、target-not-found error。
- `all_builtin_plugins`、`builtin::web_tools::plugin_info`、两个 builtin plugin 的 fields/defaults/capabilities/settings 与 DTO 关系。
- `list_plugins` / `get_plugin_config` / `toggle_plugin` / `update_plugin_config` 的 strict DTO parity、error envelope、response payload，尤其是 `toggle_plugin` response。
- 每个 plugin leaf 的 source archive test/acceptance mapping。

候选地址只作为下个 worker 的同版本 macOS 1.0.8 定位提示，不能单独作为 proof：`0x1003e5518`、`0x1003e5a88`、`0x1003e60c8`、`0x1003e4fb0`、`0x1003e57b8`。Windows evidence 必须独立闭合，禁止用 macOS evidence 外推 Windows。

| 维度 | 必须写清的结果 | 缺失时的状态 |
|---|---|---|
| 前端控制流（frontend CCF） | UI 触发点、guard/preflight、invoke wrapper、`invoke("<command>")`、参数组装路径；若只有 IPC contract / 字符串命中，必须写明不是 CCF proof | `frontend-control-flow-missing` |
| 后端控制流（backend CCF） | Tauri command 注册入口、handler/owner、core/repository/platform/sidecar 调用链，跨模块跳转和分支条件 | `backend-control-flow-missing` |
| 伪代码（pseudocode） | 同版本同平台真实 IDA MCP decompile pseudocode 摘要、函数 VA、source binary SHA、是否失败/timeout/range-repaired/candidate | `pseudocode-missing` 或 `candidate-only` |
| call-tree | 从 command/owner 到 core/leaf 的调用树结果、深度、accepted 状态、终止原因；必须列出最终 leaf（例如 fs/http/registry/process/sidecar/response/error leaf） | `call-tree-depth-insufficient` 或 `unresolved_root` |
| 界面 / 接口契约（interface） | 入参字段、类型、默认值、响应 envelope/payload、前端消费字段、可空/可选边界 | `interface-missing` |
| 错误路径 | 失败分支、错误 envelope、异常/timeout/权限/IO/HTTP/parse 错误、用户可见错误映射 | `error-path-missing` |
| 边界条件 | 平台差异、artifact 缺失、版本差异、权限/路径/配置前置条件、不可外推边界、full-app vs backend-owned-target-universe | `boundary-missing` |
| gate leaf | 该 target 最终 gate 叶子状态：accepted/rejected/warning/candidate/diagnostic-only；写清 leaf evidence path、失败 category 和下一步条件 | `gate-leaf-missing` |

`logic/` 文件不能只写“找到函数”或“命令存在”。它必须把以上维度合成为可写代码的最终结果；如果证据只到字符串、diagnostic、neighbor、RetDec-only、range-repaired candidate、synthetic CCF/call-tree 或人工推测，只能写为诊断/候选，不得提升。

写代码 / 复刻依据放 `logic/`（OneDrive 同步，纯 `.md`，不进 git）。目录名固定为 `logic/`，内容必须是 OneDrive 上可读的纯文本 Markdown，供 CC 与 Codex 共享读：

| 文件（命名约定） | 用途 |
|---|---|
| `logic/FULL-CHAIN-<ver>.md` | 单版本端到端调用链（前端 trigger → guard → invoke → 后端 command → core → 持久化/HTTP/sidecar 叶子）的还原逻辑 |
| `logic/DELTA-LOGIC-<ver>.md` | 该版本相对前版的 delta 逻辑差异（改了什么、为什么、如何复刻） |
| `logic/NO-BEHAVIOR-DIFF-MIGRATION-<ver>.md` | 当前版本相对上一 canonical baseline / hotfix handoff 无行为差异时的迁移矩阵；必须写清 previous evidence、diff basis、unchanged targets、changed targets、reused gate、new evidence path、remaining Unknown，并落在最新版本 bundle |
| `logic/REGISTRATION-TABLE-<ver>.md` | 命令/endpoint 注册表（名字、入参、出参、注册位置） |
| `logic/STABLE-<n>-LOGIC.md` | 跨版本稳定不变的逻辑基线 |
| `logic/WIN-PLATFORM-LOGIC-<topic>.md` | Windows 平台特有逻辑（如 `-symbolization`、`-5module-branch`） |
| `CROSS-VERSION-REGISTRATION-EVOLUTION.md`（reverse 根） | 跨版本演进逻辑，跨多个 bundle，放 `<source-location>/` 根而非单个 bundle 的 `logic/` |

`logic/` 是实现/复刻代码的**直接依据**，必须在 OneDrive 上可读（CC/Codex 共享），**不能只留指针**；其原始证据（pseudocode、call-tree 等）按上面分层原则留 `<source-location>`，由 `pointers/` 引用。`logic/` 只放最终整理结果，不放中间产物、原始 dump、批处理输出或机器流水账。

版本迭代包必须包含 `logic/DELTA-LOGIC-<ver>.md` 或 `logic/NO-BEHAVIOR-DIFF-MIGRATION-<ver>.md`。新版本不得先当全新任务重头逆；必须先做同平台 diff 迁移决策。无行为 diff 只能迁移旧证据和 gate 上限，不能升级旧 gate；有行为 diff 只允许为 changed targets 增补证据。迁移矩阵必须在最新版本 bundle 内自足，旧版本 bundle 只能通过 pointer / manifest `consumed_bundles` 引用。

实际布局参考（`<source-location>/aimami/<target-version>/<platform>/<leaf>/logic/`）：1.0.1 含 `FULL-CHAIN-101` + `REGISTRATION-TABLE-101` + 两份 `WIN-PLATFORM-LOGIC-*`；1.0.4 含 `FULL-CHAIN-104` + `REGISTRATION-TABLE-104`；1.0.5 含 `FULL-CHAIN-105` + `DELTA-LOGIC-105` + `STABLE-19-LOGIC` + `REGISTRATION-TABLE-105`；1.0.6 含 `FULL-CHAIN-106` + `DELTA-LOGIC-106` + `REGISTRATION-TABLE-106`。若需引用 upstream/source/extracted 输入，只在 `pointers/` 中指向根级 `<source-location>/upstream/aimami/<target-version>/...`。

### 存储与 .gitignore 约定

整个 `internal/`（含 `<source-location>/` 全部冻结包、`logic/`、本规范文件）**走 OneDrive 同步当磁盘 SoT，不进 git**。根 `.gitignore` 用 `internal/**` 屏蔽整目录，只放行两个协作约定文件：

```gitignore
internal/**
!internal/CLAUDE.md
!internal/AGENTS.md
```

即：协作者经 OneDrive 共享同一份 `internal/`（CC 与 Codex 看到的是同一份盘上文件，不依赖提交/拉取）；干净 `git clone` 只看得到 `internal/CLAUDE.md` + `internal/AGENTS.md`。`logic/` 的写代码依据是盘上可读纯 `.md`（仍不能只留指针、不能混入 raw），但**不被 git track**；raw 证据（`raw/`、`intermediate/`、`artifacts/`、`ghidra*/`、`pseudocode*/`、`call-trees/`、`*.c`、`*.jsonl`）只留 `<source-location>`，由 `pointers/` 外部路径引用，既不进 OneDrive 的 `internal/`、更不进 git。`<source-location>/` 作为 Git 内目录已弃用并整目录移出 git；作为 source archive 共享卷名时只通过 env 指针引用。

独立复核文件放在 `reviews/`：

| 文件 | 用途 |
|---|---|
| `reviews/AGENT.md` | Codex/Agent 独立复核 |
| `reviews/CLAUDE.md` | Claude 独立复核 |
| `reviews/CROSS-REVIEW.md` | 两份复核的冲突、采纳、驳回、Unknown |

外部 evidence 指针放在 `pointers/`：

| 文件 | 用途 |
|---|---|
| `pointers/evidence-paths.md` | 指向 `<source-location>/raw/...` 或 `intermediate/...` 的外部路径，不复制 raw artifact |

## README.md 模板

```text
# <产品> <版本范围> <主题>

同步时间：
范围：
最终结论：

## 证据索引
## Coverage
## Per-target Result Matrix
## Frontend Control Flow
## Backend Control Flow / Pseudocode / Call-tree
## Interface / Error / Boundary
## Gate Leaf Status
## Diff 结论
## Unknown / Missing
## Action / Non-action
```

## AI.md 模板

```text
# AI Handoff

status:
evidence_root:
versions:
platforms:
target_universe:
locator_audit:
coverage:
coverage_mode:
owner_resolution_status:
full_app_coverage_status:
per_target_required_results:
frontend_ccf_status:
backend_ccf_status:
pseudocode_status:
call_tree_status:
interface_status:
error_path_status:
boundary_status:
gate_leaf_status:
scripts:
unknowns:
do_not_infer:
```

## SYSTEM-DIFF.md 模板

```text
# System Diff

## Platform Artifacts
## Frontend IPC / Control-flow
## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf
## Interface / Error / Boundary
## Gate Leaf
## Plugin / Capability
## OTA / Package
## Resource / Binary Surface
## Unknown
```

## 验收条件

- `README.md` 和 `AI.md` 都存在，且结论一致。
- `logic/` 非空，且含该版本写代码所需的 logic 文档（至少 `FULL-CHAIN-<ver>` 或 `REGISTRATION-TABLE-<ver>`，delta 包另含对应 `DELTA-LOGIC-<ver>`）；logic 必须是 OneDrive 上可读的纯 `.md`（CC/Codex 共享，不进 git），不能只留指针，也不能把 raw 证据塞进 `logic/`。
- 每个 target 必须有结果矩阵覆盖：前端控制流、后端控制流、伪代码、call-tree、interface、错误路径、边界条件、gate leaf。缺任一项时必须列入 Unknown/Missing，并阻断 `accepted` / `implementation_use`。
- `reviews/AGENT.md` 与 `reviews/CLAUDE.md` 至少一份存在；两份都存在时必须有 `reviews/CROSS-REVIEW.md`，且两份复核口径一致可交叉核对。
- `SYSTEM-DIFF.md` 不得只写 macOS；缺 Windows artifact 时写 `Unknown`。
- 如果 `full_app_coverage_status=not-full-app`，最终报告不得写成整包全量或 source-level 100%。
- 所有 raw evidence（pseudocode / call-tree / binary dump / 反汇编 / frontend dump / 日志 / 中间批处理产物）只留 `<source-location>` 或用户明确批准的非 OneDrive 临时 scratch，经 `pointers/` 外部路径引用，**既不进 OneDrive 的 `internal/`、更不进 git**。source archive 结论区 `<source-location>/source archive` 只收最终结果、summary、manifest、review 和 pointer；repo-local `internal/reverse` 不得新写。

## 2026-05-27 Strict Leaf Readiness Clarification {#strict-leaf-readiness-2026-05-27}

For every target / command / endpoint, the word `ready` is allowed only when all of these are simultaneously present in the same-version, same-platform result set:

- frontend control-flow: UI trigger, guard/preflight, invoke wrapper, argument assembly, and terminal `invoke("<command>")` or an explicitly accepted native callback/helper substitute.
- frontend UI/state: concrete component/route/menu owner, state/store mutation or consumption, visible UX state, and any frontend guard/default behavior.
- backend owner/pseudocode: real owner and non-failed pseudocode for the same Windows/macOS artifact and source SHA.
- call-tree: implementation leaves, not only wrapper edges; must reach fs/http/registry/process/sidecar/persistence/response/error leaves where applicable.
- interface/error/side-effect gate: DTO fields, defaults/nullability, output payload, error envelope, side effects, rollback/boundary behavior, and platform-specific preconditions.
- platform gate and acceptance mapping: same-platform gate result plus source archive test/manual acceptance mapping.

If any one dimension is missing, the row must be marked `Unknown`, `Missing`, `blocked`, `candidate-only`, or `reverse-agent`. It must not be marked target-level `ready`, target-level `accepted`, `gate_accepted=true`, or `implementation_use=true`. A single dimension may still record its own leaf evidence status, for example `Accepted body`, but that does not promote the target. Feature-scope pass, diagnostic facts, backend-only pseudocode, absent-string proof, or call-tree-only evidence never close strict readiness by themselves.

## NO_VERSION_SPAN_PATH_COMPONENTS_V1

raw/intermediate/source archive 路径同样禁止二段版本跨度目录组件。`raw/<product>/<version>/...`、`intermediate/<product>/<version>/...` 和 `<source-location>/<product>/<version>/...` 中的 `<version>` 必须是单一目标版本；不要把 `upstream` 作为 `source archive` 下的新强制中间层。根级 upstream 使用 `upstream/<product>/<version>/...`，结论包需要时只通过 pointer 引用。若产物来自上一版本到当前版本的 diff，仍落入当前目标版本目录，并以稳定语义 bundle/file 名表达用途，例如 `frontend-delta-classification`、`backend-diff-readiness-reducer`、
o-behavior-diff-migration`。跨版本文件内容可以说明 baseline/target，但目录不得包含 `old-to-new` 版本跨度；目标版本目录是唯一归属点。

## CANONICAL_DIRECTORY_AUTHORITY_V1 {#canonical-directory-authority}

**唯一 canonical 消费入口**：`audits/<platform>-<version>-<module>/` 是消费者读取 gate 结论、task-plan 队列和 evidence pointer 的**唯一 canonical 入口**。消费者（实现侧、复核方）不得从 `aimami/`、`<source-location>/` 或任何 legacy 树直接读取并用作 canonical 门控依据。

**legacy 树状态**：

| 目录 | authoritative | 处置规则 |
|---|---|---|
| `aimami/` | false（legacy，迁移中） | 只作为 consumed_bundles pointer 来源；新结论不写入此树；历史 logic 只经 `pointers/evidence-paths.md` 引用 |
| `<source-location>/` | false（legacy，迁移中） | 同上；历史包只作迁移输入；不得作为 gate 放行依据 |

**迁移规则**：legacy 树下的结论迁移到 `audits/<platform>-<version>-<module>/` 后，源路径降级为 pointer，不再直接作为 readyToImplement/strictImplementationUse/consumerStartReady 的放行依据。gate_accepted=true 和 implementation_use=true 只能在 audits/ 结构下写入。

## DISTILLED_PLACEMENT_V1 {#distilled-placement}

**DISTILLED.md 白名单**：`<source-location>/` 中的结论文件白名单修订如下：

| 白名单条目 | 允许位置 | 跨版本 reference | 相关规则 |
|---|---|---|---|
| `README.md` | 包根（`audits/<platform>-<version>-<module>/README.md`） | 消费入口 | [OUTPUT-SPEC.md § README.md 模板](#readmemd-模板) |
| `AI.md` | 包根 | AI 交付 | [OUTPUT-SPEC.md § AI.md 模板](#aimd-模板) |
| `SYSTEM-DIFF.md` | 包根 | 平台差异 | [OUTPUT-SPEC.md § SYSTEM-DIFF.md 模板](#system-diffmd-模板) |
| `DISTILLED.md` | **只允许** `audits/<platform>-<version>-<module>/` 结论包内 | 引用须经 [AGENTS.md DISTILLED_PLACEMENT_V1](./AGENTS.md#distilled_placement_v1) 验证 | [AGENTS.md § DISTILLED_PLACEMENT_V1](./AGENTS.md#distilled_placement_v1) |

**DISTILLED.md 定义**：从 source archive `raw/` 或 `intermediate/` 清洗迁移的蒸馏结论存储；只允许在 `audits/<platform>-<version>-<module>/` 版本专属结论包内，禁止单独出现在 `<source-location>/` 根目录或跨目录 standalone。所有外部 raw 证据（pseudocode、call-tree、binary dump、反汇编）只留 source archive 根级，经 `pointers/evidence-paths.md` 引用；DISTILLED.md 是结论层，不得嵌入 raw artifact 或批处理流水。
