# AiMaMi

[English](./README.md) | 简体中文

AiMaMi 是一个面向 Codex 的原生桌面增强工具。本仓库包含开源桌面壳和本地管理模块，用于 MCP、Skills、自定义指令、设置和系统维护等工作流。

项目基于 Tauri 2、React、TypeScript 和 Rust 构建，面向 macOS 与 Windows。

## 包含内容

- MCP 服务器管理
- Codex Skills 管理
- 自定义指令模板与历史记录
- 本地系统维护工具
- 设置、主题、语言与更新界面
- Tauri 2 桌面壳与 React 前端

部分产品模块可能在此公开仓库之外开发。本文档只描述当前仓库中包含的开源代码。

## 技术栈

- Tauri 2
- React 18
- TypeScript
- Vite 6
- Tailwind CSS
- shadcn/ui
- Rust

## 开发

需要：

- Node.js
- pnpm
- Rust
- Tauri 系统依赖

安装依赖：

```bash
pnpm install
```

启动前端开发服务：

```bash
pnpm dev
```

启动 Tauri 桌面应用：

```bash
pnpm tauri dev
```

检查前端构建：

```bash
pnpm build
```

构建桌面应用：

```bash
pnpm tauri build
```

## 项目结构

```text
src/              React 前端
src-tauri/        Tauri 与 Rust 后端
src/locales/      国际化资源
assets/           README 与应用素材
scripts/          辅助脚本
```

## 注意

AiMaMi 会与本地 Codex 文件和设置集成。修改维护、配置或迁移逻辑前，请先备份本地 Codex 数据。

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 许可。
