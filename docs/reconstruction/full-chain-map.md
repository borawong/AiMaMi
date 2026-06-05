# 全链条地图

本文件列出 OpenAiMami 1.0.9 重建所需的 raw/internal 证据入口。还原工作应以全链条为依据，不能只依赖 `OpenAiMami IDB`。

## 主要入口

| 类型 | 路径 |
| --- | --- |
| raw 索引 | `evidence/full-chain/raw/INDEX.md` |
| raw 命令索引 | `evidence/full-chain/raw/command-index.json` |
| raw 校验摘要 | `evidence/full-chain/raw/validation-summary.json` |
| 前端 dumped 校验 | `evidence/full-chain/raw/aimami/1.0.9/frontend-dumped-checksums.zh.md` |
| internal 索引 | `evidence/full-chain/internal/INDEX.md` |
| audit map | `evidence/full-chain/internal/audit-map.json` |
| frontend map | `evidence/full-chain/internal/frontend-map/INDEX.md` |
| leaf ledger map | `evidence/full-chain/internal/leaf-ledger-map.json` |

## 覆盖范围

internal 链条覆盖：

- root 状态和规格。
- logic 摘要。
- data 汇总。
- audit 链条。
- leaf 摘要。
- version diff 材料。
- frontend map。

raw 链条覆盖：

- macOS/Windows 前端 dumped 文件。
- IPC、CCF、manifest 和命令索引。
- 校验摘要和命令级输出。
- raw leaf 与原始证据组织。

## 使用方法

1. 先校验前端 dumped 文件和 manifest hash。
2. 用 raw 链条确认来源、文件、命令和校验结果。
3. 用 internal 链条理解结构、页面、IPC、DTO、数据流和 distilled logic。
4. 形成实现时同时引用 raw 和 internal 路径。
5. 需要 IDB 时引用 `OpenAiMami IDB` 的 manifest 状态，但仍以 raw/internal 为主线。

## 贡献要求

新增重建说明或实现 PR 必须写明：

- 使用了哪些 raw/internal 路径。
- 是否需要 `OpenAiMami IDB`。
- 校验了哪些 manifest、哈希或 dumped 文件。
- 哪些行为已经实现，哪些仍是桩或待实现项。
