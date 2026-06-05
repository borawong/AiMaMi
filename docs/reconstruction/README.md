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

## Second-Stage Skeleton

The current reconstruction stage records a complete frontend skeleton shape and
a backend hexagonal skeleton shape. Frontend modules are organized around
`app`, `routes`, `features`, `services`, `store`, `hooks`, `utils`, `types`,
`config`, `locales`, `libs`, and `layout`. The covered AiMaMi 1.0.9 frontend
surfaces are `overview`, `accounts`, `sessions`, `analytics`,
`custom-instructions`, `mcp`, `skills`, `relay`, `settings`, `maintenance`,
`daemon-autoswitch`, `tray-shell`, and `voice`.

Backend work is a project decision to keep business behavior intentionally
unrestored in this stage. It records contracts, domain, ports, application,
adapters, and infrastructure boundaries with thin command adapters and explicit
stubs. See `frontend-backend-skeleton.md` for the P0/P1/P2 rules and future PR
gates.

## Full-Chain Evidence

The main reconstruction entry points are:

- `docs/reconstruction/frontend-backend-skeleton.md`
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
- `frontend-backend-skeleton.md`: second-stage frontend and backend skeleton
  rules.
- `full-chain-map.md`: imported internal/raw evidence entry points.
- `consumer-facing-chain.md`: how to consume the chain for restoration.
- `publication-rules.md`: checks before adding reconstruction material.
- `i64-status.md`: status of the public reference database bundle.
- `large-file-policy.md`: size and storage policy for reconstruction material.
