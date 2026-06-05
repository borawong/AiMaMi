# PluginRegistry__update_settings

Status: accepted full_leaf_100.
Evidence: current macos IDA owner `0x10015b42c`.
Thread model: registry update_settings -> save_store_static.
Side effects: mutex protected settings mutation, missing-target error, save-store side effect.
