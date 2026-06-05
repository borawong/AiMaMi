# Interface Boundary

Leaf: `get_plugin_config`

## Current Evidence

- Request arg keys from frontend retained IPC evidence: `pluginId`.
- Response boundary: PluginConfig or null; exact Windows 1.0.9 envelope not accepted.
- Side-effect boundary: none expected; retrieval boundary unknown.

## Acceptance Status

- strict DTO parity: false
- exact defaults/settings/capabilities/schema: false
- exact error envelope: false
- exact persistence or no-mutation boundary: false
- frontend consumption closure: false

This file intentionally does not claim implementation parity.