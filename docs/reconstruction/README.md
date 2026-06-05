# AiMaMi Reconstruction Notes

This directory explains how to rebuild AiMaMi from the public repository.

## Scope

- Project name: AiMaMi
- License: Apache-2.0
- Application stack: Tauri 2 + React + Rust
- Frontend entry points: `src/App.tsx`, `src/main.tsx`, `src/main-app.tsx`
- Desktop entry points: `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`
- Build configuration: `package.json`, `vite.config.ts`,
  `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`

## Public Inputs

Use repository-relative paths only:

- `src/`
- `src-tauri/`
- `scripts/`
- `assets/`
- `docs/reconstruction/`
- `evidence/full-chain/internal/`
- `evidence/full-chain/raw/`
- `evidence/binary-manifests/`

The reference database bundle is external to this source repository:

`https://github.com/MapleEve/OpenAiMami-IDB`

Archive path:

`1.0.9/AiMaMi-1.0.9-i64-databases.zip`

Its manifest is:

`evidence/binary-manifests/1.0.9/i64-databases.json`

## Public Architecture Summary

AiMaMi is a desktop companion app using React for the interface and Tauri 2 for
native integration. Rust code under `src-tauri/src` provides commands, app
setup, tray behavior, update handling, and platform integration. The frontend
under `src` organizes the visible workflows and shared UI.

## Full-Chain Evidence

The main reconstruction entry points are:

- `docs/reconstruction/full-chain-map.md`
- `docs/reconstruction/consumer-facing-chain.md`
- `evidence/full-chain/internal/INDEX.md`
- `evidence/full-chain/raw/INDEX.md`
- `evidence/full-chain/raw/command-index.json`
- `evidence/full-chain/raw/validation-summary.json`

Use the internal chain for distilled behavior, frontend maps, audit maps, and
leaf summaries. Use the raw chain for command-level manifests, validation
results, and source evidence organization.

## Use Rules

- Keep all references repository-relative.
- Preserve Apache-2.0 licensing context.
- Treat `src`, `src-tauri`, `scripts`, and `assets` as the public structure.
- Do not include local-only paths, runtime state, user data, or credentials.
- Publish reference database material only as the approved external `.i64` zip
  archive.

## Index

- `import-manifest.md`: import status and intake decisions.
- `source-map.md`: public source tree and interface map.
- `full-chain-map.md`: imported internal/raw evidence entry points.
- `consumer-facing-chain.md`: how to consume the chain for restoration.
- `publication-rules.md`: checks before adding reconstruction material.
- `i64-status.md`: status of the public reference database bundle.
- `large-file-policy.md`: size and storage policy for reconstruction material.
