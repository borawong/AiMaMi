# OpenAiMami 重建说明

本目录说明如何基于公开、匿名化、可审计的材料重建 OpenAiMami 1.0.9。重建主线必须同时使用 `evidence/full-chain/raw` 和 `evidence/full-chain/internal`，不能写成只依赖 `OpenAiMami IDB`。

## 范围

| 项目 | 说明 |
| --- | --- |
| 项目名称 | OpenAiMami |
| 许可 | Apache License |
| 应用形态 | Tauri 2、React、Rust 桌面应用 |
| 前端入口 | `src/App.tsx`、`src/main.tsx`、`src/main-app.tsx` |
| 后端入口 | `src-tauri/src/main.rs`、`src-tauri/src/lib.rs` |
| 构建配置 | `package.json`、`vite.config.ts`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` |

## 公开输入

只使用仓库相对路径：

- `docs/reconstruction/`
- `evidence/full-chain/raw/`
- `evidence/full-chain/internal/`
- `evidence/binary-manifests/`
- `src/`
- `src-tauri/`
- `scripts/`
- `assets/`

LFS/IDB 资料独立称为 `OpenAiMami IDB`。主仓库保存匿名化 raw/internal、前端 dumped 文件、架构骨架和文档；大体积 IDB 文件不放入主源码仓库，状态、大小和哈希由 `evidence/binary-manifests/1.0.9/i64-databases.json` 记录。

## 重建主线

1. 从 `evidence/full-chain/raw/INDEX.md`、命令索引和校验摘要开始，按索引定位前端 dumped 校验文件，再校验 dumped 文件和 manifest hash。
2. 读取 `evidence/full-chain/raw` 中的 macOS/Windows 前端 dumped 文件、IPC、CCF、manifest、命令索引和校验摘要。
3. 读取 `evidence/full-chain/internal` 中的 audit map、frontend map、distilled logic、raw leaf 和版本差异材料。
4. 用 raw 链条确认来源，用 internal 链条解释结构、页面、边界和行为摘要。
5. 前端按 route registry、entry/root、runtime initializer 和深模块边界逐步还原。
6. 后端按六边形架构骨架渐进补齐，不把未证实业务写成实现。

## 落地边界

前端必须先按 entry/root、全局 Provider、route registry、runtime initializer、route/module shell、复杂模块、TanStack cache、mutation/cache helper、locale 和 E2E mock 的 owner 边界重构现有代码，再按 raw/internal 全链条材料逐步还原 1.0.9 前端文件。

后端必须按 commands、application/usecase/service、core、platform、repository/adapter、contracts 的六边形边界重构现有代码。后端不做闭源业务全量还原是项目范围选择；后端骨架仍必须真实表达接口、DTO、错误语义、适配器边界、仓储边界和可替换 fake/temp 测试边界。

## 文档索引

- `consumer-facing-chain.md`：面向使用者的全链条消费方式。
- `frontend-backend-skeleton.md`：前端模块化重建和后端六边形骨架规则。
- `full-chain-map.md`：raw/internal 证据入口和覆盖范围。
- `import-manifest.md`：导入材料清单。
- `source-map.md`：公开源码结构和接口地图。
- `version-diff-map.md`：版本差异证据入口。
- `i64-status.md`：`OpenAiMami IDB` 状态。
- `large-file-policy.md`：大文件与外部资产策略。
- `publication-rules.md`：匿名化和发布规则。
