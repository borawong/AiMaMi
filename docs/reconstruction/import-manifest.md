# Import Manifest

This manifest tracks reconstruction material that is intended to be safe for a
public source repository.

## Imported Material

Full-chain reconstruction material was imported into:

- `evidence/full-chain/internal/`
- `evidence/full-chain/raw/`

Internal chain import:

- imported files: 548
- skipped candidates: 13
- main index: `evidence/full-chain/internal/INDEX.md`

Raw chain import:

- imported files: 1360
- skipped files: 1229
- command groups: 326
- main index: `evidence/full-chain/raw/INDEX.md`
- command index: `evidence/full-chain/raw/command-index.json`
- validation summary: `evidence/full-chain/raw/validation-summary.json`

The public reference database bundle is published outside this source
repository:

Repository: `https://github.com/MapleEve/OpenAiMami-IDB`

Archive path: `1.0.9/AiMaMi-1.0.9-i64-databases.zip`

It contains macOS and Windows `.i64` files only. Archive status, sizes, and
hashes are recorded in:

`evidence/binary-manifests/1.0.9/i64-databases.json`

## Public Repository Inputs Used

| Path | Purpose |
| --- | --- |
| `README.md` | Public overview and restoration prompt |
| `README-cn.md` | Chinese overview and restoration prompt |
| `LICENSE` | Apache-2.0 license text |
| `package.json` | Frontend scripts and dependency map |
| `src/` | React application source |
| `src-tauri/` | Tauri 2 and Rust application source |
| `scripts/` | Repository utility scripts |
| `assets/` | Public application assets |
| `https://github.com/MapleEve/OpenAiMami-IDB` | External opaque reference database bundle |

## Intake Criteria

Future additions should be small, reviewed, repository-relative, and useful for
restoring the public project. Do not add credentials, personal data, raw runtime
output, large generated dumps, or local-only environment details.
