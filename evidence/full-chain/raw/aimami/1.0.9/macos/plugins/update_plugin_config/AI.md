# update_plugin_config

Status: accepted full_leaf_100.
Evidence: current macos IDA owner `0x10015f440`.
Thread model: command owner -> PluginRegistry::update_settings.
Side effects: decode id/settings, update_settings, save store, CoreEnvelope ok bool.
