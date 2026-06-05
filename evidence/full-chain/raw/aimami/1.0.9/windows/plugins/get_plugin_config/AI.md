# get_plugin_config

Status: accepted full_leaf_100.
Evidence: current windows-x64 IDA owner `0x140281c40`.
Thread model: owner -> get_config wrapper -> registry get_config.
Side effects: decode id, get_config, CoreEnvelope ok config.
