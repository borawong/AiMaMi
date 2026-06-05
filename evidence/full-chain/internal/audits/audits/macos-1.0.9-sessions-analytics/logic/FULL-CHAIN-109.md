# FULL CHAIN 109

- `load_sessions` -> frontend invoke -> `0x1005716d0` -> raw leaf; gate=readyToImplement/full_leaf_100.
- `delete_sessions` -> frontend invoke -> `0x1005759ec` -> raw leaf; gate=readyToImplement/full_leaf_100.
- `load_usage_analytics` -> frontend invoke -> `0x1005f894c` -> `0x1005f699c` compute -> success path `0x1001bf67c` bootstrap cache update -> `0x100d2c974` write `bootstrap-cache.json`; gate=readyToImplement/full_leaf_100.
- `load_session_analytics` -> frontend invoke -> `0x1005f91bc` -> `0x10054a0a4` compute session analytics -> read-only session JSONL aggregation; gate=readyToImplement/full_leaf_100.
- `load_token_analytics` -> frontend invoke -> `0x1005f856c` -> `0x10054939c` compute sensitive-field analytics -> `0x100547988` parse sessions; gate=readyToImplement/full_leaf_100.
- `load_tool_analytics` -> frontend invoke -> `0x1005f81c8` -> `0x100548aa8` compute tool analytics -> `0x100547988` parse sessions; gate=readyToImplement/full_leaf_100.
- `load_change_analytics` -> frontend invoke -> `0x1005f8e18` -> `0x100549a78` compute change analytics -> upstream command-count DTO; gate=readyToImplement/full_leaf_100.
- `load_quota_history` -> frontend invoke -> `0x1005f7dfc` -> `0x1001be170` load history -> read/filter/sort + 7-day compaction rewrite; gate=readyToImplement/full_leaf_100.
