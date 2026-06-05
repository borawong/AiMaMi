# 导入材料清单

本文件记录进入公开仓库的重建材料类型。所有导入材料必须匿名化、仓库相对、可审计。

## 已导入材料

| 位置 | 内容 |
| --- | --- |
| `evidence/full-chain/internal/` | audit map、frontend map、distilled logic、raw leaf、版本差异和结构化摘要。 |
| `evidence/full-chain/raw/` | raw 链条、前端 dumped 文件、IPC、CCF、manifest、命令索引和校验摘要。 |
| `docs/reconstruction/` | 重建规则、证据入口、架构骨架、发布规则和大文件策略。 |
| `evidence/binary-manifests/` | 独立大文件状态、大小和哈希清单。 |

## 主仓库输入

| 路径 | 用途 |
| --- | --- |
| `README.md` | 中文公开说明和 AI 重建提示模板。 |
| `README-cn.md` | 中文公开说明副本。 |
| `LICENSE` | Apache License 许可文本。 |
| `package.json` | 前端脚本和依赖声明。 |
| `src/` | 当前公开前端源码和重构入口。 |
| `src-tauri/` | 当前公开 Tauri 与 Rust 后端骨架。 |
| `scripts/` | 仓库工具脚本。 |
| `assets/` | 公开应用资产。 |

## 独立资料

LFS/IDB 独立称为 `OpenAiMami IDB`。主仓库不保存大体积 IDB 文件，只保存独立资产清单：

`evidence/binary-manifests/1.0.9/i64-databases.json`

还原流程不得写成只依赖 IDB。完整还原必须以 raw/internal 为主链路；需要 IDB 时只核对 `OpenAiMami IDB`，它是独立参考资产。

## 导入标准

未来新增材料必须满足：

- 使用中文说明。
- 使用仓库相对路径。
- 不含内部项目名、机器名、用户名、共享盘路径或绝对本机路径。
- 不含凭据、令牌、会话、密钥、个人数据或未脱敏日志。
- 不含外部参考仓库名称。
- 能解释它与 OpenAiMami 1.0.9 重建链条的关系。
