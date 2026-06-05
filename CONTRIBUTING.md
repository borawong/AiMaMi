# 参与 OpenAiMami 贡献

感谢参与 OpenAiMami。这个仓库公开的是可审计、匿名化、可重建的材料，贡献时请优先保证证据链清楚、隐私边界清楚、变更范围清楚。

## 基本原则

- 项目使用 [Apache License](LICENSE) 许可，贡献内容需要保留该许可上下文。
- 文档、注释和提交说明使用中文。
- 公开材料只能使用仓库相对路径。
- 不写入内部路径、机器名、用户名、共享盘、内部项目名、凭据或未脱敏日志。
- 不写入外部参考仓库名称。
- 不把未证实业务写成已实现行为。

## 可接受的贡献

- 基于 `evidence/full-chain/raw` 和 `evidence/full-chain/internal` 还原 OpenAiMami 1.0.9 的完整实现。
- 根据 raw/internal 主链路补齐前端页面、路由、状态、IPC 包装、缓存、对话框、面板、组件、类型和测试；需要 IDB 时只核对 `OpenAiMami IDB`。
- 按 commands、application、core、platform、repository、adapters、contracts 边界补齐后端六边形架构。
- 改进匿名化规则、证据索引、manifest 校验、文档说明或重建提示。
- 修正错误路径、哈希、索引、命令说明或未覆盖项。

## PR 说明要求

提交 PR 时请写明：

- 使用了哪些 raw/internal 证据，以及是否核对 `OpenAiMami IDB`。
- 校验了哪些 manifest、哈希、dumped 文件或索引。
- 哪些行为已经还原，哪些仍是桩、契约或待实现项。
- 是否涉及用户数据读取、写入、导入、导出、清理、恢复、缓存或本地集成。
- 是否新增了测试或验证说明。

## 前端贡献规则

前端应按主流前端模块化架构重构并还原，不写入任何外部参考仓库名称。

还原时应优先对齐：

- route registry。
- entry/root。
- runtime initializer。
- Provider、StoreUpdater、Content、cache、hooks、dialogs、panels、components、types、tests。
- IPC 包装、数据类型、页面状态和缓存边界。

超出证据的行为应标成待实现，不应写成确定实现。

## 后端贡献规则

后端是六边形架构骨架。不还原后端业务实现是项目选择，不代表证据缺失。

贡献后端实现时：

- commands 保持薄适配层。
- application 负责编排用例。
- core 保留稳定领域类型。
- platform 和 repository 保留平台与存储边界。
- adapters 承接外部适配。
- contracts 定义前后端可序列化契约。
- 未证实业务只能写成桩、契约、待实现项或测试缺口。

## 匿名化检查

提交前请确认没有写入：

- 内部项目名。
- 本机用户名、机器名、共享盘路径或绝对本地路径。
- 凭据、令牌、会话、密钥、账号私密值或未脱敏日志。
- 个人数据、客户数据、运行期缓存或未审查 dump。
- 外部参考仓库名称。

如果发现材料未脱敏，请先改成占位说明，再提交。

## 建议验证

文档改动请检查是否仍有未脱敏词、外部参考名称、英文段落、乱码或本机环境信息。代码改动请根据范围运行相关构建、类型检查或后端检查，并在 PR 中写明结果。
