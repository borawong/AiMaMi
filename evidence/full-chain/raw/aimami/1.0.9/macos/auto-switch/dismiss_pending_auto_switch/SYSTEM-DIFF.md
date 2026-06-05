# System Diff — dismiss_pending_auto_switch

## Platform
- macOS: confirmed. Windows: Unknown.

## Backend
- Reads pending_auto_switch JSON, writes snooze record, removes snooze file

## Interface
- Response: Result<()>
- Error: fs write failure

## Gate Leaf
- macOS: strictImplementationUse. Windows: Unknown.
