# CHAIN-DIFF-LADDER — 逐链路差异阶梯（main → 1.0.1 → Win → 1.0.4 → 1.0.5 → 1.0.6）

**task#2 · opus-diff · 2026-05-24**

本目录把「跨版本注册命令演进」从命令计数级（SYSTEM-DIFF 的 41-53 行高层）下沉到**逐链路分支级 diff**，让后续复刻执行能落到「改哪个分支 / 哪个 callee / 哪个 IPC 字段 / 哪个前端触发」。

## 为什么要这个阶梯

`<source-location>/CROSS-VERSION-REGISTRATION-EVOLUTION.md` 给了「谁继承谁」的命令计数骨架（146/119/120/122），各包 `SYSTEM-DIFF.md` 给了模块级总览，但二者都不到「该命令在该 hop 具体改了什么逻辑」的粒度。本阶梯把 5 个 hop 逐命令链路展开，每条 diff 行可直接驱动复刻 PR。

## 6 个 hop

| 文件 | hop | 方向 | 主证据源 |
|---|---|---|---|
| `00-main-to-1.0.1.md` | 我方当前仓 → 1.0.1 上游 | 复刻基线对齐（前后端分支级） | parity-freeze 包 `PARITY-AUDIT-1.0.1-vs-ours` + `full-1.0.1-vs-current-repo-parity-gap` + `FULL-CHAIN-101` |
| `01-1.0.1-mac-vs-win.md` | 1.0.1 Mac ↔ Win | 跨平台链路（process/sensitive-field/autostart/tray/proxy） | `WIN-PLATFORM-LOGIC-5module-branch` + `WIN-PLATFORM-LOGIC-symbolization` |
| `02-target-1.0.4.md` | 1.0.1 → 1.0.4 | 版本演进（含 voice/CI 子系统下线 44 命令） | `DELTA`(无 104 delta，由 FULL-CHAIN-101/104 + 演进表 §2/§3 推) + 演进表 |
| `03-target-1.0.5.md` | 1.0.4 → 1.0.5 | 版本演进（+list_plugins 等微调） | `DELTA-LOGIC-105` + `STABLE-19-LOGIC` + 演进表 §4 |
| `04-target-1.0.6.md` | 1.0.5 → 1.0.6 | 版本演进（60 must-reverse delta：4 新增 + 32 body+calltree + 24 body） | `DELTA-LOGIC-106` + 演进表 §4 |
| `05-target-1.0.8.md` | 1.0.6 → 1.0.8 | 版本演进（41 must-reverse delta：5 新增 + 16 body+calltree + 15 body + 5 calltree；7 退役；Win 跨平台 3/5 确认） | `DELTA-LOGIC-108` + `REGISTRATION-TABLE-108` + delta bundle 2026-05-25 |

## 每条 diff 行的强制字段

> 禁止「该命令有改动」这种泛话。每条必须四件套俱全：

| 字段 | 含义 |
|---|---|
| **链路名** | 命令名（或平台能力链路名，如 `kill_process`） |
| **变更类型** | `新增` / `退役` / `改 body` / `改 callee` / `改前端触发` / `改 IPC 字段` / `平台分支差异`（可组合） |
| **具体改了什么** | 落到分支 / callee 名 / IPC 字段 / 前端触发模式的具体描述——不是「重写了」而是「新增 callee X，移除 Y，前端从 Z 触发」 |
| **证据锚** | pseudocode 短名 / call-tree 路径 / logic 文件锚段 / 地址；confidence（high/medium/low）保留原值不抬升 |

## 口径与诚实边界

- **命令计数口径**：沿用演进表的 invoke_handler 注册集口径（146/119/120/122），不与 FE-only(83) / superset(124) / universe(93) 口径混用；遇到不同分母处显式标注切片差。
- **1.0.1 ≠ 1.0.4 超集**：1.0.1 是 voice 全盛旁支底座；1.0.4 才是 1.0.5/1.0.6 直系前身。hop 02 的「退役」是真功能下线，hop 03/04 的演进基线是 1.0.4。
- **口径伪影**：演进表 §3 标注的 12 个「1.0.4 新增伪影」（1.0.1 已有 body、被 101 口径剔为 helper）在 hop 02 标为「口径归属变更，非真新增」，不伪装成演进。
- **client-only 边界**：客户端 binary 只证明客户端行为；任何「服务端校验/逻辑」主张需另附 serverEvidencePath。本阶梯无此类主张。
- **Win 边界**：Win 仅 1.0.1 有 artifact；1.0.4/1.0.5/1.0.6 的 Win 面为 Unknown，不从 Mac bundle 推断（见各包 SYSTEM-DIFF）。
- **call-tree WinAPI 叶**：Ghidra 不把 IAT thunk（CredWriteW 等）列为 callee 边，故 Win call-tree 的 `external_call_recorded` 叶为空；WinAPI 调用在 pseudocode 正文 + `target-discovery.txt` 锚定（见 hop 01 边界说明）。

## 状态

- [x] 阶梯目录骨架（本 README）
- [x] `05-target-1.0.8.md` — 全量 41 命令（5 NEW + 16 body+calltree + 15 body + 5 calltree）+ 7 退役链路 + **全链路状态表（≈120）**（2026-05-25）
- [x] `04-target-1.0.6.md` — 全量 60 命令（4 NEW + 32 body+calltree + 24 body）+ 3 退役链路 + **全链路状态表（122）**
- [x] `03-target-1.0.5.md` — 全量 37 命令（1 NEW + 14 body+calltree + 22 body）+ 5 短暂命令（medium，待 104 链路补）+ **全链路状态表（120/121）**
- [x] `00-main-to-1.0.1.md` — 8 链路对照（3 高偏离 + 2 待确认 + 13 ours-only + 2 surface-scope + 一致摘录）+ **全链路状态表（我方124↔上游111）**
- [x] `01-1.0.1-mac-vs-win.md` — 5 平台模块分支级（process/sensitive-field/autostart/tray/proxy）+ **全平台-能力状态表（13 能力）**
- [x] `02-target-1.0.4.md` — **44 退役逐条**（voice19/voice_runtime15/CI5/inlined-voice*4/sessions1，各列 1.0.1 body 地址+业务 call-tree+FE args）+ **6 真新增逐条**（引 _delta-chain-v2/101-104 added 坐实）+ 12 口径伪影标注 + **全链路状态表（146→119）**

> **diff-2 续铺记录（2026-05-24）**：opus-diff 初铺全 5 hop；diff-2 按 lead「每 hop 末尾加全链路状态表」给 00/03/04 补 D2/E2 状态表，按「02 别将就粗」把 hop 02 从「按模块归组+代表命令」升级为「44 退役逐条 + 6 新增逐条（引 _delta-chain-v2/101-104）+ §D 1.0.4 存活命令 delta 分类」分支级。

### 各 hop 证据等级（诚实）

| hop | 主证据 | 粒度 | 已知缺口 |
|---|---|---|---|
| 05 | DELTA-LOGIC-108（41 命令分支级，Ghidra 41/41）+ Win 字符串+Ghidra 跨平台 | 全分支级 | async-stable ≈18 无 1.0.8 直证；`get_passthrough_audit_log`/`set_block_official_passthrough`/`list_plugins` confidence medium（无 CCF 基线）；MCP/Skill 新嵌套层具体 Rust 类型待对比确认 |
| 04 | DELTA-LOGIC-106（60 命令分支级） | 全分支级 | 无 |
| 03 | DELTA-LOGIC-105（37 命令分支级） | 全分支级 | D 段「1.0.4→1.0.5 移除 5」未逐命令坐实（DELTA 不含已移除），标 medium |
| 00 | PARITY-AUDIT（8 链路对照块）+ parity-gap（逐命令 join 矩阵） | 链路级（我方 vs 上游对齐 diff） | ide 用途 / stream retry 词表 / fix_codex_router 来源标待确认 |
| 01 | WIN-PLATFORM-LOGIC 5module + symbolization | WinAPI 分支级 | Rust 名 inferred（无 PDB）；Mac 对照符号级非逐行；autostart Run-field inferred；Win call-tree 无 WinAPI 叶 |
| 02 | FULL-CHAIN-101（44 退役逐条 body+call-tree）+ _delta-chain-v2/101-104（6 added + 92 modified 分类，98 行实测）+ FULL-CHAIN-104 §5（FE-forward） | 退役 44 逐条 high；新增 6 逐条 high；§D 存活命令 body 改动＝delta 分类（无 DELTA-104） | §D 1.0.4 存活命令逐函数分支级未做（无 DELTA-LOGIC-104，要回 1.0.4 重 ghidra）；3 口径伪影无 101 附录单独地址（medium-high，演进表 §3 裁定） |
