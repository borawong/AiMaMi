# macOS 1.0.9 progress reconciliation after local outtake

This file records the corrected global state after detecting that shell/bootstrap was already owned by another producer.

## Authoritative Shell/Bootstrap Ownership

| Scope | Authoritative source | Machine / producer | Session | Gate |
| --- | --- | --- | --- | --- |
| macOS bootstrap/shell | `../macos-1.0.9-bootstrap/data/task-plan.json` | `<workstation>` | `deep-mac-bootstrap-20260602` | `consumerStartReady` reduce, no gate promotion |
| Windows bootstrap | `../windows-1.0.9-bootstrap/data/task-plan.json` | `claude-sonnet-4-6 (deep-win-bootstrap)` | `deep-win-bootstrap-20260602` | `consumerStartReady_candidate` |
| Cross bootstrap | `../cross-1.0.9-relay-core-bootstrap/data/task-plan.json` | shared reduce | cross reduce | lower-bound coordination |

The local `system-shell-init` package is a duplicate outtake and has no gate effect.

## Current Shared Progress Snapshot

| Bundle | Current state |
| --- | --- |
| `macos-1.0.9-accounts` | full leaf accepted in current package |
| `windows-1.0.9-accounts` | static IDA/no-promotion package remains separate |
| `macos-1.0.9-plugins` | deep full leaf accepted in current package |
| `windows-1.0.9-plugins` | leaf-gates-authoritative; root not promoted |
| `macos-1.0.9-system` | `ready_count=6` |
| `windows-1.0.9-system` | `ready_count=5`, `strict_count=1` |
| `macos-1.0.9-daemon-autoswitch` | `ready_count=13` |
| `windows-1.0.9-daemon-autoswitch` | `readyToImplement` contains 9 commands |
| `macos-1.0.9-bootstrap` | authoritative shell/bootstrap progress owned by `<workstation>`, consumerStartReady reduce |
| `windows-1.0.9-bootstrap` | authoritative Windows bootstrap progress owned by `deep-win-bootstrap`, candidate only |
| `macos-1.0.9-relay` / `macos-1.0.9-relay-core` | external relay workorder; do not touch from this package |
| `windows-1.0.9-relay` / `windows-1.0.9-relay-core` | external relay workorder; do not touch from this package |

## Hard Boundary

This package must not:

- schedule relay or relay-core;
- schedule system;
- promote bootstrap/shell initialization;
- override `<workstation>` macOS bootstrap work;
- override `deep-win-bootstrap` Windows bootstrap work;
- serve as a current consumer gate source.
