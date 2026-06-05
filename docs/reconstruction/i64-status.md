# i64 Reference Database Status

This file records the public status of the AiMaMi 1.0.9 reference database
bundle. It treats the bundle as an opaque asset.

## Current Status

The public reference database asset is a single zip archive published outside
this source repository:

Repository: `https://github.com/MapleEve/OpenAiMami-IDB`

Archive path: `1.0.9/AiMaMi-1.0.9-i64-databases.zip`

It contains only these entries:

- `macos/AiMaMi-1.0.9-macos.i64`
- `windows/AiMaMi-1.0.9-windows.i64`

The repository does not publish expanded companion files. Keeping a single zip
archive makes the asset set smaller and easier to verify.

## Manifest

Use this file as the source of truth for size and hash checks:

`evidence/binary-manifests/1.0.9/i64-databases.json`

## Handling Rules

- Treat the archive and extracted `.i64` files as opaque reference assets.
- Keep the zip archive in the external IDB repository, not in this source
  repository.
- Do not publish expanded companion files.
- Do not include user data, credentials, or local runtime state in any material
  added around the bundle.
