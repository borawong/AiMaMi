# toggle_plugin

Status: accepted full_leaf_100.
Evidence: current windows-x64 IDA owner `0x140282b70`.
Thread model: owner -> set_enabled -> save_store_static.
Side effects: decode id/enabled, set_enabled, save store, CoreEnvelope ok enabled.
