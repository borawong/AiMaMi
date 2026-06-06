# OpenAiMami IDB 状态

`OpenAiMami IDB` 是独立的大文件资料集，用于保存 OpenAiMami 1.0.9 的 macOS 和 Windows `.i64` 参考文件。它不属于主源码仓库的普通文本材料。

## 当前规则

- 主仓库不直接保存大体积 `.i64` 文件。
- 主仓库保存匿名化 raw/internal、前端 dumped 文件、架构骨架和重建文档。
- `OpenAiMami IDB` 作为独立资料存在。
- IDB 只能作为还原参考资产，不能替代 `evidence/full-chain/raw` 和 `evidence/full-chain/internal`。

## 资产内容

`OpenAiMami IDB` 应只包含 OpenAiMami 1.0.9 的 macOS/Windows 参考数据库文件。具体文件名、大小和哈希以主仓库清单为准，不在说明文档中重复写外部资产路径或仓库名。

不发布展开后的伴随文件，不发布用户数据，不发布运行期缓存，不发布凭据或本机状态。

## 清单

主仓库用以下清单记录状态、大小和哈希：

`evidence/binary-manifests/1.0.9/i64-databases.json`

重建时先使用 raw/internal 链条，再按需要核对该清单。PR 中引用 IDB 时必须说明它只是参考资产，并列出对应 raw/internal 证据。
