# System Diff — confirm_pending_auto_switch

## Platform
- macOS: confirmed. Windows: Unknown.

## Backend
- Reads pending_auto_switch JSON → writes active account
- Triggers async refresh via AppHandle

## Interface
- Response: CoreEnvelope<SwitchPayload>
- Error: CoreError "No pending auto-switch request" or poisoned lock

## Gate Leaf
- macOS: strictImplementationUse. Windows: Unknown.
