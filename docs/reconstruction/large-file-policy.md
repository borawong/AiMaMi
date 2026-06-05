# 大文件策略

本策略用于保持主源码仓库轻量、可审计、可匿名化。OpenAiMami 1.0.9 的重建材料应优先使用文本清单、摘要、索引和校验文件表达。

## 默认规则

- 优先保存经过审查的 Markdown、JSON、JSONL、文本摘要和 manifest。
- raw/internal 链条应保持可索引、可追溯、可仓库相对引用。
- 前端 dumped 文件可以作为公开重建材料保存，但必须有校验说明。
- 大体积 IDB 文件不放入主源码仓库。
- Apache License 许可上下文必须保留。

## 主仓库保存内容

| 位置 | 允许内容 |
| --- | --- |
| `evidence/full-chain/raw/` | 匿名化 raw 链条、前端 dumped 文件、IPC、CCF、manifest、命令索引和校验摘要。 |
| `evidence/full-chain/internal/` | 匿名化 audit map、frontend map、distilled logic、raw leaf 和结构化摘要。 |
| `docs/reconstruction/` | 中文重建说明、发布规则、架构规则和大文件策略。 |
| `evidence/binary-manifests/` | 独立大文件状态、大小和哈希清单。 |

## OpenAiMami IDB

LFS/IDB 独立称为 `OpenAiMami IDB`。它用于保存 OpenAiMami 1.0.9 的 macOS/Windows `.i64` 参考文件。

主仓库只记录它的状态、大小和哈希，不保存大体积文件本体。重建说明必须明确：IDB 是独立参考资产，还原主线仍然是 `evidence/full-chain/raw` 与 `evidence/full-chain/internal`。

## 不允许内容

- 凭据、令牌、会话、密钥或账号私密值。
- 本机路径、机器名、用户名、共享盘路径。
- 个人数据、客户数据、运行期缓存、未审查 dump。
- 外部参考仓库名称。
- 未说明来源、大小、哈希或用途的大体积文件。

## 新增大文件门槛

新增大文件前必须先说明：

- 为什么文本摘要或 manifest 不够。
- 文件是否已经匿名化。
- 文件大小、哈希和用途。
- 与 raw/internal 证据链的关系。
- 是否应放入 `OpenAiMami IDB` 而不是主源码仓库。
