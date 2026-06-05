<h1 align="center">OpenAiMaMi</h1>

<p align="center">
  English · <a href="./README-cn.md">简体中文</a>
</p>

---

## Why This Is Public

AiMaMi has gone through many personal iterations. Parts of the project were
previously maintained outside the public source tree, which made it harder for
users and contributors to understand what the app does with local Codex data.

This repository is being expanded so those materials can be reviewed, rebuilt,
and improved in the open.

The goals are simple:

- keep AiMaMi useful for personal iteration and day-to-day local workflows;
- keep the project available under the **Apache License 2.0**;
- make the behavior easier to inspect before running it locally;
- reduce privacy concerns by keeping reconstruction notes, source layout, and
  reference assets in a public repository instead of relying on opaque local
  bundles.

If you have a complete restoration or a cleaner implementation, PRs are welcome.

---

## What Is Included

- `src/` and `src-tauri/`: the public Tauri 2 + React + Rust source tree.
- `docs/reconstruction/`: maps and notes for rebuilding the project from public
  files.
- `evidence/full-chain/internal/`: reviewed chain summaries, audit maps,
  frontend maps, distilled leaves, and data rollups.
- `evidence/full-chain/raw/`: raw chain text, command indexes, manifests, and
  validation summaries.
- `evidence/binary-manifests/`: size and hash manifests for large reference
  assets published outside this repository.
- External IDB archive:
  [MapleEve/OpenAiMami-IDB](https://github.com/MapleEve/OpenAiMami-IDB) at
  `1.0.9/AiMaMi-1.0.9-i64-databases.zip`, containing the macOS and Windows
  `.i64` reference databases.
- `LICENSE`: Apache License 2.0.

The repository does not require local machine-specific paths or unpublished
state to understand the public restoration flow.

---

## Restore With AI

Use this prompt when asking an AI coding agent to restore or complete AiMaMi from
this repository:

```text
Restore AiMaMi as a complete Tauri 2 + React + Rust desktop application using
only this public repository.

Read these repository-relative inputs first: README.md, README-cn.md,
docs/reconstruction/, evidence/full-chain/internal/,
evidence/full-chain/raw/, evidence/binary-manifests/, src/, src-tauri/,
package.json, and src-tauri/Cargo.toml.

Preserve the Apache License 2.0. Rebuild the full application behavior, UI,
Tauri command surface, Rust backend, packaging metadata, and validation workflow
from the public source tree and full-chain reconstruction evidence. Start with
docs/reconstruction/full-chain-map.md, evidence/full-chain/internal/INDEX.md,
evidence/full-chain/raw/INDEX.md, evidence/full-chain/raw/command-index.json,
and evidence/full-chain/raw/validation-summary.json.

If reference databases are needed, fetch the external archive from
https://github.com/MapleEve/OpenAiMami-IDB at
1.0.9/AiMaMi-1.0.9-i64-databases.zip and use the macOS and Windows .i64 files
inside it. Treat
evidence/binary-manifests/1.0.9/i64-databases.json as the source of truth for
asset status, sizes, and hashes.

Do not rely on local-only paths, machine state, unpublished files, credentials,
or user data. If you produce a complete restoration, submit it as a pull request.
```

---

## Build

**Requirements:** Node.js · pnpm · Rust · [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/borawong/AiMaMi.git
cd AiMaMi
pnpm install
pnpm tauri dev
```

```bash
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
pnpm tauri build
```

---

## Contributing

Issues and pull requests are welcome. A complete restoration, cleaner module
split, stronger privacy review, or better documentation can all be proposed as
PRs.

---

## License

[Apache License 2.0](LICENSE)

---

## Disclaimer

AiMaMi is an independent tool for local Codex workflows. It is not affiliated
with, endorsed by, or sponsored by OpenAI.
