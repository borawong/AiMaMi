# 版本差异地图

版本差异材料位于：

`evidence/full-chain/internal/version-diff/`

这些文件用于比较 OpenAiMami 重建链条在不同阶段的变化，帮助贡献者理解 1.0.9 的页面、命令、数据边界和架构差异。它们不应暴露源码归档位置、执行系统文档、本机路径或内部项目名。

## 文件

- `version-diff/CHAIN-DIFF-LADDER/00-main-to-1.0.1.md`
- `version-diff/CHAIN-DIFF-LADDER/01-1.0.1-mac-vs-win.md`
- `version-diff/CHAIN-DIFF-LADDER/02-target-1.0.4.md`
- `version-diff/CHAIN-DIFF-LADDER/03-target-1.0.5.md`
- `version-diff/CHAIN-DIFF-LADDER/04-target-1.0.6.md`
- `version-diff/CHAIN-DIFF-LADDER/05-target-1.0.8.md`
- `version-diff/CHAIN-DIFF-LADDER/README.md`

## 使用规则

- 只通过仓库相对路径引用版本差异材料。
- 用版本差异解释变化顺序，不把它当成唯一实现来源。
- 还原实现时仍需回到 raw/internal 证据链校验。
- 若差异材料与 raw/internal 冲突，以可校验的 raw/internal 路径为准，并在 PR 中说明冲突。
