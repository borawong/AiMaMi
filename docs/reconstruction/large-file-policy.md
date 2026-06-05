# Large File Policy

This policy keeps reconstruction material repository-friendly.

## Defaults

- Prefer small reviewed text summaries over raw dumps.
- Keep evidence files focused, indexed, and repository-relative.
- Avoid adding large generated output unless it is required for restoring the
  project and has passed publication review.
- Preserve Apache-2.0 context and the Tauri 2 + React + Rust project identity.

## Allowed Areas

| Directory | Expected content |
| --- | --- |
| `evidence/text/` | Reviewed text summaries, manifests, and interface lists |
| `evidence/frontend-dumps/` | Reviewed frontend contracts or UI parity summaries |
| `evidence/runtime-traces/` | Reviewed runtime summaries only |
| `evidence/binary-manifests/` | Metadata manifests for large reference assets |
| `evidence/binary-manifests/` | External location, size, and hash metadata for reference database archives |

## Size Guidance

| File type | Guidance |
| --- | --- |
| Markdown, JSON, TSV, plain text | Keep concise and reviewed |
| HTML, CSS, JavaScript | Store only reviewed extracts or summaries |
| Image assets | Prefer existing public `assets/` files |
| Reference database archive | Publish the approved zip in the external IDB repository |
| Reference database metadata | Store status, sizes, and hashes in `evidence/binary-manifests/` |

## Reference Database Bundle

AiMaMi 1.0.9 uses one opaque external archive:

Repository: `https://github.com/MapleEve/OpenAiMami-IDB`

Archive path: `1.0.9/AiMaMi-1.0.9-i64-databases.zip`

The archive contains the macOS and Windows `.i64` files only. Expanded companion
files are not published.

## Exclusions

Do not add credentials, personal data, local-only paths, raw runtime output, or
unreviewed generated dumps. Large assets should stay outside the main source
repository and be listed by manifest with an external location, size, and hash.
