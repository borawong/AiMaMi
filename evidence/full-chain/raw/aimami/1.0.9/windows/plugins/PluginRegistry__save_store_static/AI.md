# PluginRegistry__save_store_static

Status: accepted full_leaf_100.
Evidence: current windows-x64 IDA owner `0x1403edec0`.
Thread model: save_store_static -> serializer -> file write.
Side effects: PluginStoreSchema serialization and plugins.json durable write/error boundary.
