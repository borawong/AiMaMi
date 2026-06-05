# PluginRegistry__save_store_static

Status: accepted full_leaf_100.
Evidence: current macos IDA owner `0x10015b6fc`.
Thread model: save_store_static -> PluginStoreSchema::serialize/write.
Side effects: PluginStoreSchema serialization and plugins.json durable write/error boundary.
