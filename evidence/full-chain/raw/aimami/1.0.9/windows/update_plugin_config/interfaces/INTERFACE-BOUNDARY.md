# Interface Boundary

Leaf: `update_plugin_config`

## Current Evidence

- Request arg keys from frontend retained IPC evidence: `pluginId, settings`.
- Response boundary: CoreEnvelope ok payload likely 1 from prior reducer notes; exact Windows 1.0.9 envelope not accepted.
- Side-effect boundary: config/settings mutation and persistence suspected; exact Windows write/error rollback boundary missing.

## Acceptance Status

- strict DTO parity: false
- exact defaults/settings/capabilities/schema: false
- exact error envelope: false
- exact persistence or no-mutation boundary: false
- frontend consumption closure: false

This file intentionally does not claim implementation parity.