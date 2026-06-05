# Frontend Universe Classification - AiMaMi 1.0.9

Source: Windows 1.0.9 frontend IPC command set.

Total frontend IPC commands: 127.

Classification result:

- target_sessions_analytics: 8
- target_mcp: 4
- target_skills: 6
- target_custom_instructions: 5
- target_voice: 34
- excluded_accounts: 9
- excluded_plugins_deep: 4
- excluded_relay: 19
- excluded_system_boot_shell_direct: 38
- unknown: 0

Target surface total: 47 commands.

Excluded surface total: 80 commands.

No frontend IPC command is left unclassified in this bundle.

## Important Correction

These source archive repo/API commands are not in the AiMaMi 1.0.9 Windows frontend IPC command set and must not be assigned to upstream IDA closure from this bundle without independent backend string proof:

- `recover_unindexed_sessions`
- `mark_voice_overlay_ready`
- `hide_voice_search_overlay`

Machine-readable classification: `<source-location>/data/aimami-1.0.9-frontend-command-classification.json`.
