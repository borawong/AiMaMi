# list_plugins

Status: accepted full_leaf_100.
Evidence: current windows-x64 IDA owner `0x1402663e0`.
Thread model: dispatcher branch -> wrapper -> registry list.
Side effects: read registry, map PluginEntry DTO, CoreEnvelope ok list, no durable write.
