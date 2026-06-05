# 面向使用者的证据链

本文件说明使用者和贡献者应如何消费公开重建链条。目标是让 OpenAiMami 1.0.9 的还原过程可检查、可复核、可按证据逐步补齐。

## 入口顺序

建议按以下顺序读取：

1. `docs/reconstruction/full-chain-map.md`
2. `evidence/full-chain/raw/INDEX.md`
3. 前端 dumped 校验文件（通过 `evidence/full-chain/raw/INDEX.md` 和 raw 清单定位）
4. `evidence/full-chain/raw/command-index.json`
5. `evidence/full-chain/raw/validation-summary.json`
6. `evidence/full-chain/internal/INDEX.md`
7. `evidence/full-chain/internal/audit-map.json`
8. `evidence/full-chain/internal/frontend-map/INDEX.md`

raw 链条用于确认原始来源、manifest、校验摘要、IPC、CCF 和前端 dumped 文件。internal 链条用于理解 audit map、frontend map、distilled logic、raw leaf 和结构化摘要。两者应互相校验，不能只引用其中一边。

## 可公开材料

- 匿名化的 raw/internal 索引、摘要、清单和校验文件。
- 前端 dumped 文件及其校验信息。
- 命令、IPC、CCF、manifest、版本差异和前端地图。
- 六边形后端骨架说明。
- 前端模块化架构说明。
- 独立大文件的状态、大小和哈希清单。

## 不公开材料

以下材料不得进入公开文档或 PR：

- 本机路径、机器名、用户名、共享盘路径。
- 凭据、令牌、会话、密钥和账号私密值。
- 未脱敏日志、运行期缓存、个人数据和客户数据。
- 内部项目名或外部参考仓库名称。
- 未审查的大体积生成物。

## 使用规则

- 公开说明只使用仓库相对路径。
- 还原结论必须能回指到 raw/internal 证据。
- `OpenAiMami IDB` 只作为独立参考资产，不替代 raw/internal 链条。
- 前端实现应说明 route、entry、runtime、Provider、StoreUpdater、Content、cache、hooks、dialogs、panels、components、types、tests 的证据来源。
- 后端实现应说明 commands、application、core、platform、repository、adapters、contracts 的证据来源和未覆盖项。
