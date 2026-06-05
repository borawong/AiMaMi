# System Diff

## Backend Commands / Control-flow

This leaf narrows the `update_plugin_config` backend chain:

```text
sub_1402663E0
  -> sub_1404F1950(settings decode)
  -> sub_140165130
  -> sub_1403EDAA0
  -> sub_1403EDEC0
  -> sub_14104E390
```

No new frontend or runtime evidence was produced.

## Interface / Error / Boundary

- Accepted static input boundary: `settings` must pass `sub_1404F1950` and return tag `1`.
- Error path: serialize/write failures are save-helper tag `9` and propagate to wrapper error discriminant `0x8000000000000000`.
- Poisoned lock: update mutator references `plugin store poisoned`.
- Store side effect: update mutator writes settings before calling save helper.

## Plugin / Persistence

- Static write order is mutation first, persistence second.
- No rollback proof is visible in the bounded update path.
- Write failure construction uses `write plugins.json: `.
- Serialize failure construction uses `serialize plugins.json: `.

## Gate Leaf

No promotion. This is IDA-only static assist evidence.

## Unknown

- Runtime settings edge fixtures.
- Frontend consumption of failures.
- Acceptance mapping.
- Live rollback/observability beyond bounded static path.

