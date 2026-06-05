# PluginRegistry__set_enabled

Status: accepted full_leaf_100.
Evidence: current windows-x64 IDA owner `0x1403ed760`.
Thread model: registry set_enabled -> save_store_static.
Side effects: mutex protected mutation, missing-target error, save-store side effect.
