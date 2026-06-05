# PluginRegistry__update_settings

Status: accepted full_leaf_100.
Evidence: current windows-x64 IDA owner `0x1403edaa0`.
Thread model: registry update_settings -> save_store_static.
Side effects: mutex protected settings mutation, missing-target error, save-store side effect.
