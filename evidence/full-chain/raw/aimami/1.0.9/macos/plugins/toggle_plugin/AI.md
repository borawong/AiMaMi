# toggle_plugin

Status: accepted full_leaf_100.
Evidence: current macos IDA owner `0x10015f064`.
Thread model: command owner -> PluginRegistry::set_enabled.
Side effects: decode id/enabled, set_enabled, save store, CoreEnvelope ok enabled.
