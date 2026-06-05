# list_plugins

Status: accepted full_leaf_100.
Evidence: current macos IDA owner `0x1003262b8`.
Thread model: dispatcher branch -> PluginRegistry::list.
Side effects: read registry, map PluginEntry DTO, CoreEnvelope ok list, no durable write.
