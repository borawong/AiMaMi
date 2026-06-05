# AGENTS.md - raw/aimami/1.0.9/macos/system

Scope: clean raw leaves for AiMaMi 1.0.9 macOS system commands only.

Rules:
- Inherit `<source-location>/AGENTS.md`, `raw/AGENTS.md`, `raw/aimami/AGENTS.md`, `raw/aimami/1.0.9/AGENTS.md`, and `raw/aimami/1.0.9/macos/AGENTS.md`.
- One command equals one canonical leaf directory under this folder.
- Leaf files are limited to `AI.md`, `README.md`, `SYSTEM-DIFF.md`, `audits/<command>-ida-closure.json`, `validation/result.json`, `file-manifest.json`, and `manifest.json`.
- Backend proof must come from the matching macOS AiMaMi 1.0.9 IDB through IDA MCP; frontend proof must come from current allowed frontend extraction/source mapping only.
- Do not write bulk decompile text, logs, callgraph dumps, binary data, screenshots, temp outputs, date directories, machine directories, pass directories, or version-span path components.
- Do not overwrite existing command leaves or promote shared gate state without the producer collision gate and an explicit owner authorization when required.
