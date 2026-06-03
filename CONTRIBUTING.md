# Contributing to AiMaMi

Thanks for taking the time to improve AiMaMi. This project touches local Codex configuration, account data, sessions, MCP entries, Skills, and relay settings, so contributions should keep user data safety and reversibility in mind.

## Development setup

Before starting, make sure you have the following installed:

- Node.js
- pnpm
- Rust
- Tauri 2 prerequisites for your operating system: <https://v2.tauri.app/start/prerequisites/>

Clone the repository and install dependencies:

```bash
git clone https://github.com/borawong/AiMaMi.git
cd AiMaMi
pnpm install
```

Start the desktop app in development mode:

```bash
pnpm tauri dev
```

## Validation before opening a pull request

For code changes, run the relevant checks before opening a pull request:

```bash
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
pnpm tauri build
```

For documentation-only changes, verify that links, commands, headings, and screenshots are still accurate. A full application build is usually not required for docs-only pull requests.

## Local data safety

AiMaMi works with files under `~/.codex` and app-managed data under `~/.codex/codexmate/`. When contributing features or fixes that read, write, import, export, clean, or rebuild local data:

- Prefer reversible operations and provide clear user confirmation for destructive actions.
- Avoid silently overwriting user-managed configuration outside AiMaMi-controlled blocks.
- Keep backup, restore, preview, and rollback flows easy to understand.
- Be careful with account, session, relay, and routing data in logs, screenshots, and bug reports.
- Test changes with disposable local data whenever possible instead of personal production Codex data.

## Pull request guidelines

- Keep pull requests focused and describe the user-facing impact clearly.
- For larger behavior changes, open an issue first to discuss the approach.
- Include validation notes in the pull request description.
- For UI changes, include screenshots or short screen recordings when helpful.
- For docs-only changes, state that no source code behavior was changed.

---

# 参与 AiMaMi 贡献

感谢你愿意改进 AiMaMi。该项目会接触本地 Codex 配置、账号数据、会话、MCP、Skills 与中转设置，因此贡献时应优先考虑用户数据安全与可逆性。

## 开发环境

开始前，请先安装：

- Node.js
- pnpm
- Rust
- 当前操作系统所需的 Tauri 2 依赖：<https://v2.tauri.app/start/prerequisites/>

克隆仓库并安装依赖：

```bash
git clone https://github.com/borawong/AiMaMi.git
cd AiMaMi
pnpm install
```

启动桌面端开发模式：

```bash
pnpm tauri dev
```

## 提交 Pull Request 前的检查

如果修改了代码，建议在提交 PR 前运行相关检查：

```bash
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
pnpm tauri build
```

如果只是修改文档，请确认链接、命令、标题与截图仍然准确。纯文档 PR 通常不需要完整构建应用。

## 本地数据安全

AiMaMi 会处理 `~/.codex` 下的文件，以及 `~/.codex/codexmate/` 下的应用数据。当贡献内容涉及读取、写入、导入、导出、清理或重建本地数据时：

- 优先设计可逆操作，对破坏性动作提供明确确认。
- 避免静默覆盖 AiMaMi 受控区块之外的用户配置。
- 让备份、恢复、预览与回滚流程清晰易懂。
- 在日志、截图和问题反馈中谨慎处理账号、会话、中转与路由数据。
- 尽量使用一次性测试数据验证改动，避免直接使用个人生产 Codex 数据。

## Pull Request 建议

- 保持 PR 聚焦，并清楚描述用户可感知的影响。
- 较大的行为变更建议先开 Issue 讨论方案。
- 在 PR 描述中写明验证方式。
- UI 改动可附截图或短录屏，方便 Review。
- 纯文档改动请说明没有改变源码行为。
