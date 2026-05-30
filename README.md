# AiMaMi

English | [简体中文](./README-cn.md)

AiMaMi is a native desktop companion for Codex. This repository contains the open-source desktop shell and local management modules for MCP, Skills, custom instructions, settings, and maintenance workflows.

It is built with Tauri 2, React, TypeScript, and Rust, and is designed for macOS and Windows.

## What's Included

- MCP server management
- Codex Skills management
- Custom instruction templates and history
- Local system maintenance tools
- Settings, theme, language, and update UI
- A Tauri 2 desktop shell with a React interface

Some product modules may be developed outside this public repository. The README only describes the open-source code included here.

## Tech Stack

- Tauri 2
- React 18
- TypeScript
- Vite 6
- Tailwind CSS
- shadcn/ui
- Rust

## Development

Requirements:

- Node.js
- pnpm
- Rust
- Tauri system dependencies

Install dependencies:

```bash
pnpm install
```

Start the web dev server:

```bash
pnpm dev
```

Start the Tauri desktop app:

```bash
pnpm tauri dev
```

Check the frontend build:

```bash
pnpm build
```

Build the desktop app:

```bash
pnpm tauri build
```

## Project Structure

```text
src/              React frontend
src-tauri/        Tauri and Rust backend
src/locales/      i18n resources
assets/           README and app assets
scripts/          helper scripts
```

## Notes

AiMaMi integrates with local Codex files and settings. Back up local Codex data before changing maintenance, configuration, or migration logic.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
