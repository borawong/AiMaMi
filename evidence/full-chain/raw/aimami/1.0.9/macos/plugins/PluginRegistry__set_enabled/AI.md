# PluginRegistry__set_enabled

Status: accepted full_leaf_100.
Evidence: current macos IDA owner `0x10015b18c`.
Thread model: registry set_enabled -> save_store_static.
Side effects: mutex protected mutation, missing-target error, save-store side effect.
