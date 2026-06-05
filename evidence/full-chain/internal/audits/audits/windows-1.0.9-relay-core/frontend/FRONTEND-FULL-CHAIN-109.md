# Windows 1.0.9 Relay-Core Frontend Boundary

platform=windows
module=relay-core
status=internal_backend_package

Relay-core has no standalone frontend route. It is reached through the Windows
relay IPC package:

- `../windows-1.0.9-relay/frontend/FRONTEND-FULL-CHAIN-109.md`
- `src/components/relay/relay-page.tsx`
- `src/lib/api.ts`
- `src-tauri/src/commands/relay.rs`
- `src-tauri/src/core/relay/`

Consumers must use the relay package for frontend/API/TanStack control flow and
this package for internal backend implementation evidence.
