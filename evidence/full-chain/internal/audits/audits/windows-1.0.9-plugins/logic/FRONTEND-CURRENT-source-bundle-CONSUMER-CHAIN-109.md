# Frontend current source archive consumer chain - plugins 1.0.9 Windows

Scope: supplemental frontend comparison only. It does not rewrite the Windows plugins backend/registry/store gate.

Current repository baseline was refreshed with `git fetch origin --prune`; checked branch `master` equals `origin/master` at `8327295d0233933a8fcbf2dda24e5bd56fc61693`.

## Upstream packaged frontend

AiMaMi 1.0.9 frontend exposes wrappers for `list_plugins`, `toggle_plugin`, `get_plugin_config`, and `update_plugin_config`. Windows backend proof is same-platform and remains in `windows-1.0.9-plugins`.

## Current source archive source comparison

Current source archive source has no visible upstream-style Plugins page or API wrappers for these four commands. The current codebase uses project/plugin marketplace packaging surfaces instead.

## Consumer consequence

Windows plugins backend is closed, but frontend parity is not present in current source archive. Implementation must either add an upstream-like plugin UI/API surface or explicitly keep the current source archive product delta.
