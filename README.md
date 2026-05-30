# AiMaMi

**A native desktop companion for OpenAI Codex — manage accounts, routing, sessions, and local configuration in one place.**

English · [简体中文](./README-cn.md)

---

## Overview

Codex stores accounts, sessions, MCP entries, Skills, smart-router settings, and relay configuration across multiple files under `~/.codex`. Multi-account switching, quota exhaustion, third-party model setup, session cleanup, and config drift quickly turn day-to-day work into hand-editing TOML, JSON, and SQLite.

AiMaMi is built with **Tauri 2, React, and Rust**. It consolidates these high-frequency workflows — including smart routing and relay management — into a single desktop app that reads and writes Codex data locally, reducing the risk of manual file edits.

---

## Core Capabilities

| Module | Pain point addressed |
| --- | --- |
| **Account management** | Switching accounts by editing `auth.json`; scattered quota views; cumbersome import/export |
| **Auto-switch** | Work stops when 5-hour or weekly quota runs out; need automatic fallback and Codex restart |
| **Smart router** | Use relay models inside Codex Desktop while keeping historical threads resumable |
| **Relay management** | Provider setup, connectivity tests, import/export, and router diagnostics |
| **Session management** | Safely inspect, analyze, and bulk-clean local threads from the real index |
| **MCP / Skills** | Manage MCP entries and Skills lifecycle in the UI, with backup and restore |
| **Plugins** | Unified toggles for built-in extensions (e.g. web tools, image support) |
| **Custom instructions** | Manage only the AiMaMi-managed block in `~/.codex/AGENTS.md`, with preview and rollback |
| **System maintenance** | Diagnose, clean, rebuild registry, force-quit Codex, fix common config issues |
| **Settings & runtime** | Theme, language, quota refresh, API proxy, update checks; tray and macOS notch quota display |

**Smart router note:** Relay models are forwarded through AiMaMi's local proxy. Keep AiMaMi running while Codex uses relay models.

---

## Platform Support

| Platform | Notes |
| --- | --- |
| macOS | Universal (Apple Silicon + Intel), macOS 12+ |
| Windows | x64, NSIS installer |
| Linux | Best-effort support for some workflows |

---

## Tech Stack

Tauri 2 · React 18 · TypeScript · Vite 6 · Tailwind CSS · shadcn/ui · Rust

---

## Quick Start

**Requirements:** Node.js · pnpm · Rust · [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/borawong/AiMaMi.git
cd AiMaMi
pnpm install
pnpm tauri dev
```

```bash
pnpm build                                        # Frontend build check
cargo check --manifest-path src-tauri/Cargo.toml  # Rust check
pnpm tauri build                                  # Production build
```

---

## Project Structure

```text
src/           React frontend
src-tauri/     Tauri shell and Rust backend
src/locales/   i18n (en / zh)
scripts/       Build and release scripts
assets/        Branding and documentation assets
```

---

## Architecture

```text
React UI ── invoke() ──▶ Tauri commands ──▶ core/
                                              ├── ~/.codex          (Codex native)
                                              └── ~/.codex/codexmate/ (AiMaMi app data)
                         platform/            macOS / Windows implementations
```

---

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first and keep local Codex data safety and reversibility in mind.

---

## License

[Apache License 2.0](LICENSE)

---

## Disclaimer

AiMaMi is an independent tool for local Codex workflows. It is not affiliated with, endorsed by, or sponsored by OpenAI. Use third-party relay services at your own risk and comply with their terms of service.
