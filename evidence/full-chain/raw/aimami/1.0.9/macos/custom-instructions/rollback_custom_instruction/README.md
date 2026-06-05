# rollback_custom_instruction - macos AiMaMi 1.0.9 custom-instructions

Status: accepted same-platform backend-absence substitute. Frontend wrapper exists; matching IDA backend has no command string/owner for the five custom-instructions commands.

Interface: `{ historyId: string }`.

Implementation boundary: upstream custom-instructions code is product/local behavior, not upstream backend parity.
