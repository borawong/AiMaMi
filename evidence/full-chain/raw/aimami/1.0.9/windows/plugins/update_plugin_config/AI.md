# update_plugin_config

Status: accepted full_leaf_100.
Evidence: current windows-x64 IDA owner `0x1402663e0`.
Thread model: dispatcher branch -> adapter/wrapper -> update_settings -> save_store_static.
Side effects: decode id/settings, update_settings, save store, CoreEnvelope ok bool.
