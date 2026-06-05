# macOS 1.0.9 Relay-Core Frontend Boundary

platform=macos
module=relay-core
status=internal_backend_package

Relay-core has no standalone frontend route. It is reached through the relay
IPC package:

- `../macos-1.0.9-relay/frontend/FRONTEND-FULL-CHAIN-109.md`
- `src/components/relay/relay-page.tsx`
- `src/lib/api.ts`
- `src-tauri/src/commands/relay.rs`
- `src-tauri/src/core/relay/`

Consumers must not look for independent relay-core UI controls. Relay-core
facts are backend implementation facts consumed by relay commands.
