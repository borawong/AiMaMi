# AiMaMi

**面向 OpenAI Codex 的原生桌面伴侣 —— 统一管理账号、路由、会话与本地配置。**

[English](./README.md) · 简体中文

---

## 概述

Codex 的账号、会话、MCP、Skills、智能路由与中转配置分散在 `~/.codex` 下的多个文件里。多账号切换、额度耗尽、第三方模型接入与路由维护、会话清理和配置漂移，都会把日常操作变成手改 TOML / JSON / SQLite。

AiMaMi 基于 **Tauri 2 + React + Rust**，把这些高频操作 —— 含智能路由与中转管理 —— 收敛到一个桌面应用里，在本地安全读写 Codex 数据，减少手工改文件带来的风险。

---

## 核心能力

| 模块 | 解决的痛点 |
| --- | --- |
| **账号管理** | 多账号切换靠手改 `auth.json`；额度分散、导入导出麻烦 |
| **自动切换** | 5 小时 / 周额度触顶后任务中断，需自动找可用账号并重启 Codex |
| **智能路由** | 在 Codex 桌面内使用中转模型，同时尽量保留历史线程可续聊 |
| **中转管理** | Provider 配置、连通性测试、导入导出与路由诊断 |
| **会话管理** | 基于真实索引安全查看、统计与批量清理本地线程 |
| **MCP / Skills** | 图形化管理 MCP 条目与 Skills 生命周期，支持备份恢复 |
| **插件** | 统一管理内置扩展（如 web tools、image support） |
| **自定义指令** | 仅管理 `~/.codex/AGENTS.md` 中的 AiMaMi 受控区块，支持预览与回滚 |
| **系统维护** | 诊断、清理、重建 registry、强杀 Codex、修复常见配置问题 |
| **设置与运行时** | 主题、语言、额度刷新、API 代理、更新检查；托盘与 macOS 刘海额度展示 |

**智能路由说明：** 中转模型经 AiMaMi 本地代理转发，使用期间需保持 AiMaMi 运行。

---

## 平台支持

| 平台 | 说明 |
| --- | --- |
| macOS | Universal（Apple Silicon + Intel），macOS 12+ |
| Windows | x64，NSIS 安装包 |
| Linux | 部分能力为尽力支持 |

---

## 技术栈

Tauri 2 · React 18 · TypeScript · Vite 6 · Tailwind CSS · shadcn/ui · Rust

---

## 快速开始

**环境要求：** Node.js · pnpm · Rust · [Tauri 系统依赖](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/borawong/AiMaMi.git
cd AiMaMi
pnpm install
pnpm tauri dev
```

```bash
pnpm build                                      # 前端构建检查
cargo check --manifest-path src-tauri/Cargo.toml  # Rust 检查
pnpm tauri build                                # 生产构建
```

---

## 项目结构

```text
src/           React 前端
src-tauri/     Tauri 壳与 Rust 后端
src/locales/   国际化（中 / 英）
scripts/       构建与发布脚本
assets/        品牌与文档素材
```

---

## 架构

```text
React UI ── invoke() ──▶ Tauri commands ──▶ core/
                                              ├── ~/.codex          (Codex 原生)
                                              └── ~/.codex/codexmate/ (AiMaMi 数据)
                         platform/            macOS / Windows 差异实现
```

---

## 参与贡献

欢迎提交 Issue 与 Pull Request。较大改动请先开 Issue，并注意本地 Codex 数据的安全与可逆性。

---

## 许可证

[Apache License 2.0](LICENSE)

---

## 免责声明

AiMaMi 是独立的 Codex 本地工作流工具，与 OpenAI 无隶属、背书或赞助关系。使用第三方中转服务请自行评估风险并遵守相应条款。
